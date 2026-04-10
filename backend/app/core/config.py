import os
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


def _env_is_production() -> bool:
    """
    Decide whether we're running in production based on environment variables.
    Render should set: ENVIRONMENT=production
    """
    return (os.getenv("ENVIRONMENT", "") or "").strip().lower() == "production"


class Settings(BaseSettings):
    # Core
    app_name: str = "pingSight"
    database_url: str
    secret_key: str
    access_token_expire_minutes: int = 60

    # Google OAuth settings
    google_client_id: str
    google_client_secret: str

    # Frontend/Backend URLs
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"

    # Environment (development, staging, production)
    environment: str = "development"

    # CORS allowed origins (comma-separated list)
    # Example: "https://pingsight.vercel.app,http://localhost:3000"
    cors_origins: str = "http://localhost:3000"

    # Rate limiting
    rate_limit_heartbeat: str = "60/minute"
    rate_limit_api: str = "200/minute"

    model_config = SettingsConfigDict(
        env_file=None if _env_is_production() else ".env",
        extra="ignore",
        case_sensitive=False,
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


def get_settings() -> Settings:
    return Settings()