from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.core.sentry import SentryConfig, init_sentry
from app.db.base import Base
from app.db.models import (
    AnalyticsEvent,
    Question,
    QuestionSchedule,
    QuestionGenerationJob,
    RateLimitBucket,
    ReviewEvent,
    OpsEvent,
    StudyInput,
    StudyTopic,
    StudyInputExtractJob,
    User,
    UserIdentity,
    UserSession,
    WaitlistSignup,
)
from app.db.session import engine
from app.middleware.ops_middleware import ops_middleware


def ensure_runtime_schema() -> None:
    inspector = inspect(engine)
    if "study_inputs" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("study_inputs")}
    statements: list[str] = []
    if "source_kind" not in columns:
        statements.append("ALTER TABLE study_inputs ADD COLUMN source_kind VARCHAR(24)")
    if "source_preview_text" not in columns:
        statements.append("ALTER TABLE study_inputs ADD COLUMN source_preview_text TEXT")
    if "source_image_ref" not in columns:
        statements.append("ALTER TABLE study_inputs ADD COLUMN source_image_ref VARCHAR(128)")

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_runtime_schema()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    settings.validate_security()
    configure_logging()
    init_sentry(
        SentryConfig(
            dsn=settings.sentry_dsn or "",
            environment=settings.environment,
            traces_sample_rate=float(settings.sentry_traces_sample_rate),
        )
    )

    app = FastAPI(
        title="NightRecall API",
        version="0.1.0",
        lifespan=lifespan,
        openapi_url=f"{settings.api_v1_prefix}/openapi.json",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.effective_cors_origins,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def _ops_middleware(request, call_next):  # type: ignore[no-untyped-def]
        return await ops_middleware(request, call_next)
    app.include_router(api_router, prefix=settings.api_v1_prefix)

    @app.get("/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
