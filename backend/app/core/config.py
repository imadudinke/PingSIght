from functools import lru_cache
from typing import List

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.env_bootstrap import is_production_env


def should_load_dotenv_file() -> bool:
    """In production, never read .env from disk — only platform env (e.g. Render)."""
    return not is_production_env()


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

    # development | staging | production (ENVIRONMENT or ENV)
    environment: str = Field(
        default="development",
        validation_alias=AliasChoices("ENVIRONMENT", "ENV"),
    )

    # Optional; defaults to {backend_url}/auth/callback
    google_redirect_uri: str | None = None

    # CORS allowed origins (comma-separated list)
    cors_origins: str = "http://localhost:3000"

    # Rate limiting
    rate_limit_heartbeat: str = "60/minute"
    rate_limit_api: str = "200/minute"

    model_config = SettingsConfigDict(
        env_file=".env" if should_load_dotenv_file() else None,
        extra="ignore",
        case_sensitive=False,
    )

    @property
    def is_production(self) -> bool:
        return self.environment.strip().lower() == "production"

    @property
    def oauth_google_redirect_uri(self) -> str:
        if self.google_redirect_uri:
            return self.google_redirect_uri.strip()
        return f"{self.backend_url.rstrip('/')}/auth/callback"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
