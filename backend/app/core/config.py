from functools import lru_cache
import os

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "NightRecall API"
    environment: str = "development"
    api_v1_prefix: str = "/v1"
    database_url: str = "sqlite:///./nightrecall.db"
    cors_origins: list[str] = Field(default_factory=list)
    default_locale: str = "en"
    default_timezone: str = "UTC"
    llm_provider: str = "stub"
    llm_model: str = "deterministic-fallback"
    openai_api_key: str | None = None
    openai_vision_model: str = "gpt-4.1-mini"
    openai_question_model: str = "gpt-4.1-mini"
    jwt_secret_key: str = "change-me"
    jwt_access_token_ttl_minutes: int = 30
    jwt_refresh_token_ttl_days: int = 30
    job_inline_processing: bool | None = None
    job_worker_poll_interval_seconds: float = 2.0
    source_image_storage_root: str = "./storage/source-images"
    google_web_client_id: str | None = None
    google_android_client_id: str | None = None
    google_ios_client_id: str | None = None
    enable_google_auth: bool = True

    # Error tracking (Sentry)
    sentry_dsn: str | None = None
    sentry_traces_sample_rate: float = 0.0

    # Ops / monitoring (self-hosted)
    ops_cron_token: str | None = None
    ops_slack_webhook_url: str | None = None
    ops_alert_window_minutes: int = 10
    ops_alert_threshold_5xx: int = 3
    ops_alert_threshold_429: int = 30
    ops_alert_threshold_slow: int = 20
    ops_alert_threshold_exception: int = 1
    ops_alert_threshold_job_failed: int = 1
    ops_alert_threshold_job_slow: int = 10

    def validate_security(self) -> None:
        """
        Fail fast on dangerous defaults when the app is likely running in a hosted environment.

        We intentionally keep development easy, but we should never run production with a
        guessable JWT secret.
        """

        hosted_markers = (
            "RAILWAY_ENVIRONMENT",
            "RAILWAY_PROJECT_ID",
            "RAILWAY_SERVICE_ID",
            "RENDER",
            "FLY_APP_NAME",
            "DYNO",  # Heroku
        )
        is_hosted = any(os.getenv(key) for key in hosted_markers)
        uses_non_sqlite = not self.sqlalchemy_database_url.startswith("sqlite")
        is_non_dev = not self.is_development

        if self.jwt_secret_key == "change-me" and (is_hosted or uses_non_sqlite or is_non_dev):
            raise ValueError("JWT_SECRET_KEY must be set to a strong secret in production.")

    @property
    def is_development(self) -> bool:
        return self.environment.lower() == "development"

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+psycopg://", 1)
        if self.database_url.startswith("postgres://"):
            return self.database_url.replace("postgres://", "postgresql+psycopg://", 1)
        return self.database_url

    @property
    def effective_cors_origins(self) -> list[str]:
        if self.cors_origins:
            return self.cors_origins
        if self.is_development:
            return ["*"]
        return []

    @property
    def cors_allow_credentials(self) -> bool:
        origins = self.effective_cors_origins
        return bool(origins) and "*" not in origins

    @property
    def inline_job_processing_enabled(self) -> bool:
        if self.job_inline_processing is not None:
            return self.job_inline_processing
        return self.is_development


@lru_cache
def get_settings() -> Settings:
    return Settings()
