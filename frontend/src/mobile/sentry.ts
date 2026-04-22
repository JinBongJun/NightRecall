import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

type Extra = {
  sentryDsn?: string;
  environment?: string;
  sentryTracesSampleRate?: number;
};

function getExtra(): Extra {
  // expoConfig is the runtime config for managed apps. In some contexts this can be undefined.
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  return {
    sentryDsn: typeof extra.sentryDsn === "string" ? extra.sentryDsn : undefined,
    environment: typeof extra.environment === "string" ? extra.environment : undefined,
    sentryTracesSampleRate:
      typeof extra.sentryTracesSampleRate === "number" ? extra.sentryTracesSampleRate : undefined,
  };
}

export function initSentry(): void {
  const extra = getExtra();

  // DSN is not a secret. Prefer EXPO_PUBLIC_ for build-time injection.
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN || extra.sentryDsn;
  if (!dsn) return;

  const environment = process.env.EXPO_PUBLIC_ENVIRONMENT || extra.environment || "development";
  const tracesSampleRateRaw = process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE;
  const tracesSampleRate =
    tracesSampleRateRaw != null
      ? Number(tracesSampleRateRaw)
      : extra.sentryTracesSampleRate != null
        ? extra.sentryTracesSampleRate
        : 0.0;

  Sentry.init({
    dsn,
    environment,
    // Keep perf off by default during early testing. Turn it up later if needed.
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.0,
    sendDefaultPii: false,
    enableAutoSessionTracking: true,
  });
}

