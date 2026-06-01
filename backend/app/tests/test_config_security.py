from app.core.config import Settings
from app.core.hosting import is_hosted_environment


def test_should_bootstrap_schema_only_for_local_sqlite_dev() -> None:
    settings = Settings(
        environment="development",
        database_url="sqlite:///./nightrecall.db",
    )
    assert settings.should_bootstrap_schema is True


def test_should_not_bootstrap_schema_on_hosted_environment(monkeypatch) -> None:
    monkeypatch.setenv("RAILWAY_ENVIRONMENT", "production")
    settings = Settings(
        environment="development",
        database_url="sqlite:///./nightrecall.db",
    )
    assert settings.should_bootstrap_schema is False


def test_validate_security_rejects_local_source_image_storage_in_production() -> None:
    settings = Settings(
        environment="production",
        database_url="postgresql+psycopg://user:pass@db/nightrecall",
        jwt_secret_key="strong-secret",
        source_image_storage_provider="local",
    )

    try:
        settings.validate_security()
    except ValueError as exc:
        assert "SOURCE_IMAGE_STORAGE_PROVIDER" in str(exc)
    else:
        raise AssertionError("expected validate_security to reject local source image storage")


def test_validate_security_allows_object_storage_in_production() -> None:
    settings = Settings(
        environment="production",
        database_url="postgresql+psycopg://user:pass@db/nightrecall",
        jwt_secret_key="strong-secret",
        source_image_storage_provider="s3",
        source_image_storage_endpoint_url="https://example.r2.cloudflarestorage.com",
        source_image_storage_bucket="nightrecall-source-images",
        source_image_storage_region="auto",
        source_image_storage_access_key_id="key",
        source_image_storage_secret_access_key="secret",
    )

    settings.validate_security()


def test_is_hosted_environment_reads_railway_marker(monkeypatch) -> None:
    monkeypatch.setenv("RAILWAY_ENVIRONMENT", "production")
    assert is_hosted_environment() is True
