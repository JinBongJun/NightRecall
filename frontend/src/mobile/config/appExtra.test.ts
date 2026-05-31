import { describe, expect, it } from "vitest";

import { resolveAppExtra } from "./appExtra";

describe("resolveAppExtra", () => {
  it("defaults development API and environment", () => {
    expect(resolveAppExtra()).toEqual({
      apiBaseUrl: "http://localhost:8000/v1",
      environment: "development",
      sentryTracesSampleRate: 0,
    });
  });

  it("maps production profile defaults", () => {
    expect(
      resolveAppExtra({
        easBuildProfile: "production",
        sentryDsn: "https://example@sentry.io/1",
      }),
    ).toEqual({
      apiBaseUrl: "https://nightrecall-production.up.railway.app/v1",
      sentryDsn: "https://example@sentry.io/1",
      environment: "production",
      sentryTracesSampleRate: 0.1,
    });
  });

  it("prefers explicit env overrides", () => {
    expect(
      resolveAppExtra({
        easBuildProfile: "preview",
        apiBaseUrl: "https://preview.example/v1",
        environment: "preview",
        sentryTracesSampleRate: "0.05",
      }),
    ).toEqual({
      apiBaseUrl: "https://preview.example/v1",
      environment: "preview",
      sentryTracesSampleRate: 0.05,
    });
  });
});
