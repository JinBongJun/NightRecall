from datetime import UTC, date, datetime, time
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


def utc_now() -> datetime:
    return datetime.now(UTC)


def timezone_or_utc(timezone_name: str | None) -> ZoneInfo:
    if not timezone_name:
        return ZoneInfo("UTC")
    try:
        return ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError:
        return ZoneInfo("UTC")


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def local_date(value: datetime, timezone_name: str | None) -> date:
    return as_utc(value).astimezone(timezone_or_utc(timezone_name)).date()


def local_day_start_utc(timezone_name: str | None, value: datetime) -> datetime:
    timezone = timezone_or_utc(timezone_name)
    local_value = as_utc(value).astimezone(timezone)
    return datetime.combine(local_value.date(), time.min, tzinfo=timezone).astimezone(UTC)


def local_month_start_utc(timezone_name: str | None, value: datetime) -> datetime:
    timezone = timezone_or_utc(timezone_name)
    local_value = as_utc(value).astimezone(timezone)
    return datetime(local_value.year, local_value.month, 1, tzinfo=timezone).astimezone(UTC)
