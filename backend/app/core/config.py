from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str
    database_url: str
    secret_key: str
    access_token_expire_minutes: int
    
    # Google OAuth settings
    google_client_id: str
    google_client_secret: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


def get_settings() -> Settings:
    return Settings()
