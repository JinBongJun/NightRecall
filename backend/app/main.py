from contextlib import asynccontextmanager

from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.core.sentry import SentryConfig, init_sentry
from app.db.base import Base
from app.db.schemas.health import HealthResponse
from app.db.session import engine
from app.middleware.ops_middleware import ops_middleware
from app.services.health_service import check_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    if settings.should_bootstrap_schema:
        Base.metadata.create_all(bind=engine)
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

    @app.get(
        "/health",
        tags=["health"],
        response_model=HealthResponse,
        responses={503: {"model": HealthResponse}},
    )
    def health(response: Response) -> HealthResponse:
        database_ok = check_database()
        if not database_ok:
            response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthResponse(
            status="ok" if database_ok else "degraded",
            database="ok" if database_ok else "unavailable",
        )

    return app


app = create_app()
