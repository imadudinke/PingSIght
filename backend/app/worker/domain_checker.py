"""
Domain Expiration Checker — RDAP-first with WHOIS fallback.

Protocol strategy (per ICANN / RFC 9083 best practices):
  1. RDAP  — modern, JSON-based, faster, no rate-limit bans, Unicode-safe.
             Uses rdap.org as a universal bootstrap proxy so we don't need to
             hard-code per-TLD server URLs ourselves.
  2. WHOIS — legacy fallback for old TLDs whose registrars have not yet
             published RDAP servers, or when rdap.org itself is unreachable.
  3. None  — both failed; caller decides what to do (graceful-fail path).

CRITICAL: This module is called via asyncio.to_thread — all I/O here is
synchronous by design. Do NOT add async code to this file.
"""

import logging
import httpx
import whois

from datetime import datetime, timezone
from typing import Optional, Dict, Any
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# rdap.org is an IANA-bootstrapped universal RDAP proxy maintained by ARIN.
# It resolves the correct authoritative RDAP server for any TLD automatically.
_RDAP_URL = "https://rdap.org/domain/{domain}"
_RDAP_TIMEOUT = 10  # seconds; RDAP is fast, anything longer is a stall


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _classify(expiry_date: datetime) -> tuple[str, int]:
    """Return (status_label, days_remaining) for a given expiry date."""
    now = datetime.now(timezone.utc)
    days = (expiry_date - now).days
    if days < 0:
        status = "EXPIRED"
    elif days <= 7:
        status = "CRITICAL"
    elif days <= 30:
        status = "WARNING"
    else:
        status = "VALID"
    return status, days


def _build_result(hostname: str, expiry_date: datetime, source: str) -> Dict[str, Any]:
    """Normalise an expiry date into the standard result dict."""
    if expiry_date.tzinfo is None:
        expiry_date = expiry_date.replace(tzinfo=timezone.utc)
    status, days = _classify(expiry_date)
    return {
        "expiry_date": expiry_date,
        "days_remaining": days,
        "status": status,
        "hostname": hostname,
        "source": source,           # "rdap" or "whois" — useful for debugging
    }


# ---------------------------------------------------------------------------
# RDAP lookup (primary)
# ---------------------------------------------------------------------------

def _get_expiry_via_rdap(hostname: str) -> Optional[Dict[str, Any]]:
    """
    Query RDAP for domain expiration data.

    Returns a result dict on success, None if RDAP has no data or fails.
    We intentionally catch broadly so RDAP errors never crash the caller.
    """
    try:
        resp = httpx.get(
            _RDAP_URL.format(domain=hostname),
            timeout=_RDAP_TIMEOUT,
            follow_redirects=True,
            headers={"Accept": "application/rdap+json"},
        )

        if resp.status_code != 200:
            logger.debug(f"[RDAP] HTTP {resp.status_code} for {hostname} — will try WHOIS")
            return None

        data = resp.json()

        # The RDAP spec (RFC 9083 §10.2.3) stores lifecycle dates in the
        # top-level `events` array; the expiration event action is "expiration".
        expiry_date: Optional[datetime] = None
        for event in data.get("events", []):
            if event.get("eventAction") == "expiration":
                raw = event.get("eventDate", "")
                if raw:
                    # RFC 3339 / ISO 8601 — replace Z suffix for fromisoformat
                    expiry_date = datetime.fromisoformat(raw.replace("Z", "+00:00"))
                    break

        if not expiry_date:
            logger.debug(f"[RDAP] No expiration event in response for {hostname} — will try WHOIS")
            return None

        result = _build_result(hostname, expiry_date, "rdap")
        logger.info(
            f"[RDAP] ✓ {hostname}: expires {expiry_date.strftime('%Y-%m-%d')}, "
            f"{result['days_remaining']} days, status={result['status']}"
        )
        return result

    except httpx.TimeoutException:
        logger.warning(f"[RDAP] Timeout for {hostname} — falling back to WHOIS")
        return None
    except Exception as e:
        logger.debug(f"[RDAP] Failed for {hostname}: {e} — falling back to WHOIS")
        return None


# ---------------------------------------------------------------------------
# WHOIS lookup (fallback)
# ---------------------------------------------------------------------------

def _get_expiry_via_whois(hostname: str) -> Optional[Dict[str, Any]]:
    """
    Legacy WHOIS fallback.

    Used when RDAP returns no expiration data (thin registries, old TLDs).
    """
    try:
        w = whois.whois(hostname)
        expiry_date = w.expiration_date

        # Some registrars return a list of dates; use the earliest one.
        if isinstance(expiry_date, list):
            expiry_date = min(
                [d for d in expiry_date if isinstance(d, datetime)],
                default=None,
            )

        if not expiry_date:
            logger.warning(f"[WHOIS] No expiration date returned for {hostname}")
            return None

        result = _build_result(hostname, expiry_date, "whois")
        logger.info(
            f"[WHOIS] ✓ {hostname}: expires {expiry_date.strftime('%Y-%m-%d')}, "
            f"{result['days_remaining']} days, status={result['status']}"
        )
        return result

    except whois.parser.PywhoisError as e:
        logger.error(f"[WHOIS] Parse error for {hostname}: {e}")
        return None
    except Exception as e:
        logger.error(f"[WHOIS] Lookup failed for {hostname}: {e}")
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_domain_expiry(url: str) -> Optional[Dict[str, Any]]:
    """
    Return domain expiration info for the given URL.

    Lookup order:
      1. RDAP  (fast, structured, no rate-limit bans)
      2. WHOIS (legacy fallback)
      3. None  (both failed — caller should preserve existing DB data)

    Args:
        url: Full URL, e.g. "https://example.com/path"

    Returns:
        Dict with expiry_date, days_remaining, status, hostname, source
        — or None if both protocols fail.
    """
    parsed = urlparse(url)
    hostname = parsed.hostname

    if not hostname:
        logger.error(f"[DOMAIN] Invalid URL — no hostname: {url}")
        return None

    logger.info(f"[DOMAIN] Checking {hostname} (RDAP → WHOIS fallback)")

    # 1. Try RDAP
    result = _get_expiry_via_rdap(hostname)
    if result:
        return result

    # 2. Fallback to WHOIS
    logger.info(f"[DOMAIN] RDAP gave no data for {hostname} — trying WHOIS...")
    result = _get_expiry_via_whois(hostname)
    if result:
        return result

    # 3. Both failed
    logger.warning(f"[DOMAIN] Both RDAP and WHOIS failed for {hostname}")
    return None


def should_check_domain(last_checked: Optional[datetime]) -> bool:
    """
    Return True if a domain check is due.

    A check is due when:
      - It has never been run (last_checked is None), or
      - More than 24 hours have passed since the last check.
    """
    if not last_checked:
        return True

    if last_checked.tzinfo is None:
        last_checked = last_checked.replace(tzinfo=timezone.utc)

    hours_elapsed = (datetime.now(timezone.utc) - last_checked).total_seconds() / 3600
    return hours_elapsed >= 24.0
