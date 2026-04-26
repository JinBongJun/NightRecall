import { beforeEach, describe, expect, it } from "vitest";

import { useAuthStore } from "./authStore";

function resetStore() {
  useAuthStore.setState({
    bootstrapStatus: "bootstrapping",
    userId: null,
    authMode: "guest",
    plan: "free",
    locale: "en",
    timezone: "UTC",
    accessToken: null,
    refreshToken: null,
    provider: null,
    email: null,
    displayName: null,
    avatarUrl: null,
  });
}

describe("authStore", () => {
  beforeEach(() => {
    resetStore();
  });

  it("marks bootstrap as ready when a session is restored", () => {
    useAuthStore.getState().setSession({
      userId: "user-1",
      timezone: "Asia/Seoul",
      authMode: "signed_in",
      accessToken: "access",
      refreshToken: "refresh",
      provider: "google",
      email: "user@example.com",
      displayName: "Test User",
      avatarUrl: "https://example.com/avatar.jpg",
    });

    expect(useAuthStore.getState()).toMatchObject({
      bootstrapStatus: "ready",
      userId: "user-1",
      timezone: "Asia/Seoul",
      authMode: "signed_in",
      provider: "google",
    });
  });

  it("fully resets auth state on clearSession", () => {
    useAuthStore.setState({
      bootstrapStatus: "ready",
      userId: "user-1",
      authMode: "signed_in",
      plan: "plus",
      locale: "ko",
      timezone: "Asia/Seoul",
      accessToken: "access",
      refreshToken: "refresh",
      provider: "google",
    });

    useAuthStore.getState().clearSession();

    expect(useAuthStore.getState()).toMatchObject({
      bootstrapStatus: "ready",
      userId: null,
      authMode: "guest",
      plan: "free",
      locale: "en",
      timezone: "UTC",
      accessToken: null,
      refreshToken: null,
      provider: null,
      email: null,
      displayName: null,
      avatarUrl: null,
    });
  });
});
