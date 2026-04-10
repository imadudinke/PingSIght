"""
Helpers for deciding whether Settings should read a local .env file.

Production (Render) must use platform env vars only.
"""

import os


def is_production_env() -> bool:
    """True when ENVIRONMENT or ENV is production (single source for bootstrap + config)."""
    v = (os.getenv("ENVIRONMENT") or os.getenv("ENV") or "").strip().lower()
    return v == "production"
