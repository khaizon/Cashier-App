"""Application settings, loaded from environment variables (and backend/.env)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

# Development-only fallback. Production must set CASHIER_SECRET_KEY.
# At least 32 bytes, which is the minimum RFC 7518 recommends for HS256.
DEV_SECRET_KEY = "dev-insecure-secret-change-me-please-override"
MIN_SECRET_KEY_BYTES = 32


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CASHIER_", env_file=".env", extra="ignore")

    # Used to sign JWTs. MUST be overridden outside local development.
    secret_key: str = DEV_SECRET_KEY
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 12

    database_url: str = "sqlite:///./data/cashier.db"

    # Comma-separated list of allowed browser origins.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def uses_dev_secret(self) -> bool:
        return self.secret_key == DEV_SECRET_KEY

    @property
    def secret_key_is_short(self) -> bool:
        return len(self.secret_key.encode("utf-8")) < MIN_SECRET_KEY_BYTES


@lru_cache
def get_settings() -> Settings:
    return Settings()
