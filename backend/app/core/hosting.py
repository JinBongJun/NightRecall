import os

HOSTED_MARKERS = (
    "RAILWAY_ENVIRONMENT",
    "RAILWAY_PROJECT_ID",
    "RAILWAY_SERVICE_ID",
    "RENDER",
    "FLY_APP_NAME",
    "DYNO",  # Heroku
)

LOCAL_SOURCE_IMAGE_PROVIDERS = frozenset({"local", "filesystem", "file"})


def is_hosted_environment() -> bool:
    return any(os.getenv(key) for key in HOSTED_MARKERS)
