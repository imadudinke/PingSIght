from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    app_name: str
    database_url: str
    secret_key: str
    access_token_expire_minutes: int
    
    # Google OAuth settings
    google_client_id: str
    google_client_secret: str
    
    # Frontend URL
    frontend_url: str = "http://localhost:3000"
    
    # Backend URL (for generating heartbeat URLs)
    backend_url: str = "http://localhost:8000"
    
    # Environment (dev, staging, production)
    environment: str = "development"
    
    # CORS allowed origins (comma-separated list)
    # Example: "https://pingsight.com,https://www.pingsight.com,http://localhost:3000"
    cors_origins: str = "http://localhost:3000"
    
    # Rate limiting
    rate_limit_heartbeat: str = "60/minute"  # Heartbeat endpoint limit
    rate_limit_api: str = "200/minute"  # General API limit

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


def get_settings() -> Settings:
    return Settings()
