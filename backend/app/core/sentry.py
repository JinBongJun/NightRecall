from __future__ import annotations

from dataclasses import dataclass

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration


@dataclass(frozen=True, slots=True)
class SentryConfig:
    dsn: str
    environment: str
    traces_sample_rate: float


def init_sentry(config: SentryConfig) -> None:
    """
    Initialize Sentry if a DSN is configured.

    Notes:
    - DSN is not a secret, but we still never log it.
    - Keep traces_sample_rate default at 0.0 to avoid perf overhead during early testing.
    """

    if not config.dsn:
        return

    sentry_sdk.init(
        dsn=config.dsn,
        environment=config.environment,
        traces_sample_rate=float(config.traces_sample_rate),
        send_default_pii=False,
        integrations=[FastApiIntegration()],
    )

