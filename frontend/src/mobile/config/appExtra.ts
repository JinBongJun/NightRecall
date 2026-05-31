export type AppExtraConfig = {
  apiBaseUrl: string;
  sentryDsn?: string;
  environment: string;
  sentryTracesSampleRate: number;
};

type ResolveAppExtraInput = {
  baseExtra?: Record<string, unknown>;
  apiBaseUrl?: string;
  sentryDsn?: string;
  environment?: string;
  sentryTracesSampleRate?: string | number;
  easBuildProfile?: string;
};

const DEFAULT_DEV_API_BASE_URL = "http://localhost:8000/v1";
const DEFAULT_PROD_API_BASE_URL = "https://nightrecall-production.up.railway.app/v1";

function parseTracesSampleRate(value: string | number | undefined, fallback: number): number {
  if (value == null || value === "") {
    return fallback;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function resolveAppExtra({
  baseExtra = {},
  apiBaseUrl,
  sentryDsn,
  environment,
  sentryTracesSampleRate,
  easBuildProfile,
}: ResolveAppExtraInput = {}): AppExtraConfig {
  const resolvedApiBaseUrl =
    apiBaseUrl ??
    (easBuildProfile === "production" ? DEFAULT_PROD_API_BASE_URL : DEFAULT_DEV_API_BASE_URL);

  const resolvedEnvironment =
    environment ??
    (easBuildProfile === "production" ? "production" : easBuildProfile === "preview" ? "preview" : "development");

  const baseSentryDsn = typeof baseExtra.sentryDsn === "string" ? baseExtra.sentryDsn : undefined;
  const baseEnvironment = typeof baseExtra.environment === "string" ? baseExtra.environment : undefined;
  const baseTracesSampleRate =
    typeof baseExtra.sentryTracesSampleRate === "number" ? baseExtra.sentryTracesSampleRate : undefined;

  return {
    apiBaseUrl: resolvedApiBaseUrl,
    sentryDsn: sentryDsn ?? baseSentryDsn,
    environment: environment ?? baseEnvironment ?? resolvedEnvironment,
    sentryTracesSampleRate: parseTracesSampleRate(
      sentryTracesSampleRate,
      baseTracesSampleRate ?? (resolvedEnvironment === "production" ? 0.1 : 0),
    ),
  };
}
