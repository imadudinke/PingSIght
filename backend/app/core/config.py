from functools import lru_cache

from pydantic import AliasChoices, Field, field_validator
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
    admin_seed_emails: str = "imadudinkeremu@gmail.com"

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

    # CORS allowed origins (comma-separated list). FRONTEND_URL is merged in main.py if missing.
    cors_origins: str = "http://localhost:3000"

    # SameSite for session cookie: "lax" for BFF / same-site; use "none" only for cross-origin API.
    auth_cookie_samesite: str = Field(
        default="lax",
        validation_alias=AliasChoices("AUTH_COOKIE_SAMESITE"),
    )

    # Rate limiting
    rate_limit_heartbeat: str = "60/minute"
    rate_limit_api: str = "200/minute"

    model_config = SettingsConfigDict(
        env_file=".env" if should_load_dotenv_file() else None,
        extra="ignore",
        case_sensitive=False,
    )

    @field_validator("environment", mode="before")
    @classmethod
    def normalize_environment(cls, value: str | None) -> str:
        return (value or "development").strip().lower()

    @field_validator("frontend_url", "backend_url", "google_redirect_uri", mode="before")
    @classmethod
    def normalize_optional_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized.rstrip("/") or None

    @field_validator("cors_origins", mode="before")
    @classmethod
    def normalize_cors_origins(cls, value: str | None) -> str:
        return (value or "").strip()

    @field_validator("auth_cookie_samesite", mode="before")
    @classmethod
    def normalize_samesite(cls, value: str | None) -> str:
        v = (value or "lax").strip().lower()
        if v not in ("lax", "strict", "none"):
            return "lax"
        return v

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def oauth_google_redirect_uri(self) -> str:
        if self.google_redirect_uri:
            return self.google_redirect_uri
        return f"{self.backend_url}/auth/callback"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a normalized list."""
        raw_origins = self.cors_origins or self.frontend_url
        seen: set[str] = set()
        origins: list[str] = []

        for origin in raw_origins.split(","):
            normalized = origin.strip().rstrip("/")
            if not normalized or normalized in seen:
                continue
            seen.add(normalized)
            origins.append(normalized)

        return origins

    @property
    def admin_seed_emails_list(self) -> set[str]:
        return {
            email.strip().lower()
            for email in self.admin_seed_emails.split(",")
            if email.strip()
        }

    @property
    def auth_cookie_name(self) -> str:
        return "access_token"

    @property
    def auth_cookie_secure(self) -> bool:
        return self.is_production

    @property
    def auth_cookie_httponly(self) -> bool:
        return True

    @property
    def auth_cookie_path(self) -> str:
        return "/"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
