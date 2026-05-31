import type { ConfigContext, ExpoConfig } from "expo/config";

import { resolveAppExtra } from "./src/mobile/config/appExtra";

const appJson = require("./app.json");

export default ({ config }: ConfigContext): ExpoConfig => {
  const baseExtra = appJson.expo.extra ?? {};
  const resolvedExtra = resolveAppExtra({
    baseExtra,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: process.env.EXPO_PUBLIC_ENVIRONMENT,
    sentryTracesSampleRate: process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
    easBuildProfile: process.env.EAS_BUILD_PROFILE,
  });

  return {
    ...config,
    ...appJson.expo,
    extra: {
      ...baseExtra,
      ...resolvedExtra,
    },
  };
};
