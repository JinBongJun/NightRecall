import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "../store/authStore";

const authSessionMocks = vi.hoisted(() => ({
  clearPersistedSession: vi.fn(),
  persistSession: vi.fn(),
}));

vi.mock("./authSessionService", () => ({
  clearPersistedSession: authSessionMocks.clearPersistedSession,
  persistSession: authSessionMocks.persistSession,
}));

import { refreshAccessToken, resetRefreshInFlightForTests } from "./refreshAccessToken";

const sampleSession = {
  userId: "user-1",
  timezone: "Asia/Seoul",
  authMode: "signed_in" as const,
  accessToken: "access-old",
  refreshToken: "refresh-old",
  provider: "google" as const,
  email: "user@example.com",
  displayName: "Test User",
  avatarUrl: null,
};

describe("refreshAccessToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRefreshInFlightForTests();
    useAuthStore.setState({
      ...sampleSession,
      bootstrapStatus: "ready",
      plan: "free",
      locale: "en",
    });
    authSessionMocks.persistSession.mockResolvedValue(undefined);
    authSessionMocks.clearPersistedSession.mockResolvedValue(undefined);
  });

  it("refreshes tokens without an access token header", async () => {
    const postRefresh = vi.fn().mockResolvedValue({
      access_token: "access-new",
      refresh_token: "refresh-new",
    });

    const session = await refreshAccessToken(postRefresh);

    expect(postRefresh).toHaveBeenCalledWith("refresh-old");
    expect(session.accessToken).toBe("access-new");
    expect(authSessionMocks.persistSession).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: "access-new",
        refreshToken: "refresh-new",
      }),
    );
  });

  it("single-flights concurrent refresh calls", async () => {
    let resolveRefresh: ((value: { access_token: string; refresh_token: string }) => void) | undefined;
    const postRefresh = vi.fn(
      () =>
        new Promise<{ access_token: string; refresh_token: string }>((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    const first = refreshAccessToken(postRefresh);
    const second = refreshAccessToken(postRefresh);

    expect(postRefresh).toHaveBeenCalledTimes(1);

    resolveRefresh?.({
      access_token: "access-new",
      refresh_token: "refresh-new",
    });

    const [sessionA, sessionB] = await Promise.all([first, second]);
    expect(sessionA.accessToken).toBe("access-new");
    expect(sessionB.accessToken).toBe("access-new");
    expect(authSessionMocks.persistSession).toHaveBeenCalledTimes(1);
  });

  it("clears persisted session when refresh fails", async () => {
    const postRefresh = vi.fn().mockRejectedValue(new Error("refresh failed"));

    await expect(refreshAccessToken(postRefresh)).rejects.toThrow("refresh failed");
    expect(authSessionMocks.clearPersistedSession).toHaveBeenCalledTimes(1);
  });
});
