"""Application settings, loaded from environment variables / backend/.env."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Waste2Wealth API"
    api_prefix: str = "/api/v1"
    environment: str = "development"

    supabase_url: str
    supabase_anon_key: str
    # Server-only key that bypasses RLS. Used only for narrowly scoped backend writes.
    supabase_service_role_key: str = ""
    gemini_api_key: str = ""

    # Comma-separated list of allowed browser origins for the web app.
    cors_origins: str = Field(default="http://localhost:5173,http://127.0.0.1:5173")

    @property
    def supabase_issuer(self) -> str:
        return f"{self.supabase_url.rstrip('/')}/auth/v1"

    @property
    def supabase_jwks_url(self) -> str:
        return f"{self.supabase_issuer}/.well-known/jwks.json"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
