import type { ConfigContext, ExpoConfig } from "expo/config";

const appJson = require("./app.json");

const DEFAULT_DEV_API_BASE_URL = "http://localhost:8000/v1";
const DEFAULT_PROD_API_BASE_URL = "https://nightrecall-production.up.railway.app/v1";

export default ({ config }: ConfigContext): ExpoConfig => {
  const baseExtra = appJson.expo.extra ?? {};
  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    (process.env.EAS_BUILD_PROFILE === "production" ? DEFAULT_PROD_API_BASE_URL : DEFAULT_DEV_API_BASE_URL);

  return {
    ...config,
    ...appJson.expo,
    extra: {
      ...baseExtra,
      apiBaseUrl,
    },
  };
};
