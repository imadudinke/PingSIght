"""
Bootstrap OS environment before Settings() or DB engine initialization.

In production (Render), never call load_dotenv() — only use platform env vars.
Locally, load_dotenv() fills os.environ before pydantic reads .env / Settings().
"""

import os

from dotenv import load_dotenv


def is_production_env() -> bool:
    """True when ENVIRONMENT or ENV is production (single source for bootstrap + config)."""
    v = (os.getenv("ENVIRONMENT") or os.getenv("ENV") or "").strip().lower()
    return v == "production"


def load_dotenv_if_not_production() -> None:
    if not is_production_env():
        load_dotenv()
