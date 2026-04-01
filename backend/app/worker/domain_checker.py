"""
Domain Expiration Checker using WHOIS

This module checks domain expiration dates using the python-whois library.
CRITICAL: This check should run ONCE EVERY 24 HOURS to avoid WHOIS rate limiting.
"""

import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from urllib.parse import urlparse

import whois

logger = logging.getLogger(__name__)


def get_domain_expiry(url: str) -> Optional[Dict[str, Any]]:
    """
    Query WHOIS database for domain expiration information.
    
    Args:
        url: Full URL (e.g., "https://example.com/path")
        
    Returns:
        Dict with expiry_date, days_remaining, and status, or None if lookup fails
        
    CRITICAL: Do NOT call this function frequently. WHOIS servers will block your IP.
    This should only be called once every 24 hours per domain.
    """
    try:
        # Extract hostname from URL
        parsed = urlparse(url)
        hostname = parsed.hostname
        
        if not hostname:
            logger.error(f"[WHOIS] Invalid URL, no hostname: {url}")
            return None
        
        logger.info(f"[WHOIS] Querying WHOIS for domain: {hostname}")
        
        # Query WHOIS database
        w = whois.whois(hostname)
        expiry_date = w.expiration_date
        
        # Sometimes whois returns a list if there are multiple dates
        # Take the first one (usually the most relevant)
        if isinstance(expiry_date, list):
            logger.debug(f"[WHOIS] Multiple expiry dates found, using first: {expiry_date}")
            expiry_date = expiry_date[0]
        
        if not expiry_date:
            logger.warning(f"[WHOIS] No expiration date found for {hostname}")
            return None
        
        # Ensure timezone-aware datetime
        if expiry_date.tzinfo is None:
            expiry_date = expiry_date.replace(tzinfo=timezone.utc)
        
        # Calculate days remaining
        now = datetime.now(timezone.utc)
        days_remaining = (expiry_date - now).days
        
        # Determine status based on days remaining
        if days_remaining < 0:
            status = "EXPIRED"
        elif days_remaining <= 7:
            status = "CRITICAL"  # Less than 1 week
        elif days_remaining <= 30:
            status = "WARNING"   # Less than 1 month
        else:
            status = "VALID"
        
        logger.info(
            f"[WHOIS] ✓ Domain {hostname}: "
            f"Expires {expiry_date.strftime('%Y-%m-%d')}, "
            f"{days_remaining} days remaining, "
            f"Status: {status}"
        )
        
        return {
            "expiry_date": expiry_date,
            "days_remaining": days_remaining,
            "status": status,
            "hostname": hostname
        }
        
    except whois.parser.PywhoisError as e:
        logger.error(f"[WHOIS] WHOIS lookup failed for {url}: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"[WHOIS] Unexpected error during WHOIS lookup for {url}: {str(e)}", exc_info=True)
        return None


def should_check_domain(last_checked: Optional[datetime]) -> bool:
    """
    Determine if domain expiration should be checked based on last check time.
    
    Args:
        last_checked: DateTime of last domain check, or None if never checked
        
    Returns:
        True if 24 hours have passed since last check, False otherwise
    """
    if not last_checked:
        # Never checked before
        return True
    
    # Ensure timezone-aware
    if last_checked.tzinfo is None:
        last_checked = last_checked.replace(tzinfo=timezone.utc)
    
    now = datetime.now(timezone.utc)
    hours_since_check = (now - last_checked).total_seconds() / 3600
    
    # Check if 24 hours have passed
    return hours_since_check >= 24.0
