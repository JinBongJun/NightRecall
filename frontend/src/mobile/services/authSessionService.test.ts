import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "../store/authStore";

const sessionStorageMocks = vi.hoisted(() => ({
  clearSessionStorage: vi.fn(),
  loadSession: vi.fn(),
  saveSession: vi.fn(),
}));

vi.mock("./sessionStorage", () => ({
  clearSessionStorage: sessionStorageMocks.clearSessionStorage,
  loadSession: sessionStorageMocks.loadSession,
  saveSession: sessionStorageMocks.saveSession,
}));

import { clearPersistedSession, persistSession, restorePersistedSession } from "./authSessionService";

const sampleSession = {
  userId: "user-1",
  timezone: "Asia/Seoul",
  authMode: "signed_in" as const,
  accessToken: "access",
  refreshToken: "refresh",
  provider: "google" as const,
};

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
  });
}

describe("authSessionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("persists the session after updating the auth store", async () => {
    await persistSession(sampleSession);

    expect(useAuthStore.getState()).toMatchObject({
      bootstrapStatus: "ready",
      userId: "user-1",
      provider: "google",
    });
    expect(sessionStorageMocks.saveSession).toHaveBeenCalledWith(sampleSession);
  });

  it("restores a stored session into the auth store", async () => {
    sessionStorageMocks.loadSession.mockResolvedValue(sampleSession);

    const restored = await restorePersistedSession();

    expect(restored).toEqual(sampleSession);
    expect(useAuthStore.getState()).toMatchObject({
      bootstrapStatus: "ready",
      userId: "user-1",
      timezone: "Asia/Seoul",
    });
  });

  it("clears persisted and in-memory auth state together", async () => {
    useAuthStore.getState().setSession(sampleSession);

    await clearPersistedSession();

    expect(sessionStorageMocks.clearSessionStorage).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({
      bootstrapStatus: "ready",
      userId: null,
      accessToken: null,
      refreshToken: null,
      provider: null,
    });
  });
});
