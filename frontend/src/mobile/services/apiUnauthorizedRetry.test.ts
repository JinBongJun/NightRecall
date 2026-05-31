import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";

import { useAuthStore } from "../store/authStore";

const authSessionMocks = vi.hoisted(() => ({
  clearPersistedSession: vi.fn(),
  persistSession: vi.fn(),
}));

vi.mock("./authSessionService", () => ({
  clearPersistedSession: authSessionMocks.clearPersistedSession,
  persistSession: authSessionMocks.persistSession,
}));

import { resetRefreshInFlightForTests, refreshAccessToken } from "./refreshAccessToken";
import {
  retryAfterUnauthorizedRefresh,
  shouldRetryUnauthorized,
} from "./apiUnauthorizedRetry";

function makeAxiosError(status: number): AxiosError {
  return {
    response: { status },
    config: {},
    isAxiosError: true,
    toJSON: () => ({}),
    name: "AxiosError",
    message: "Request failed",
  } as AxiosError;
}

describe("apiUnauthorizedRetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRefreshInFlightForTests();
    authSessionMocks.persistSession.mockResolvedValue(undefined);
    useAuthStore.setState({
      userId: "user-1",
      timezone: "UTC",
      authMode: "signed_in",
      accessToken: "access-old",
      refreshToken: "refresh-old",
      provider: "google",
      bootstrapStatus: "ready",
      plan: "free",
      locale: "en",
    });
  });

  it("only retries the first 401", () => {
    expect(shouldRetryUnauthorized(401, false)).toBe(true);
    expect(shouldRetryUnauthorized(401, true)).toBe(false);
    expect(shouldRetryUnauthorized(403, false)).toBe(false);
  });

  it("refreshes and replays the original request after a 401", async () => {
    const originalRequest = {
      url: "/stats",
      headers: {},
    } as InternalAxiosRequestConfig & { _retry?: boolean };
    const postRefresh = vi.fn().mockResolvedValue({
      access_token: "access-new",
      refresh_token: "refresh-new",
    });
    const resend = vi.fn().mockResolvedValue({ status: 200, data: { current_streak: 1 } } as AxiosResponse);

    const response = await retryAfterUnauthorizedRefresh(
      originalRequest,
      makeAxiosError(401),
      {
        getCredentials: () => useAuthStore.getState(),
        refreshAccessToken,
        postRefresh,
      },
      resend,
    );

    expect(postRefresh).toHaveBeenCalledWith("refresh-old");
    expect(originalRequest._retry).toBe(true);
    expect(originalRequest.headers?.Authorization).toBe("Bearer access-new");
    expect(resend).toHaveBeenCalledWith(originalRequest);
    expect(response.status).toBe(200);
  });

  it("does not refresh when credentials are missing", async () => {
    useAuthStore.setState({ refreshToken: null });

    const originalRequest = { headers: {} } as InternalAxiosRequestConfig & { _retry?: boolean };
    const postRefresh = vi.fn();
    const error = makeAxiosError(401);

    await expect(
      retryAfterUnauthorizedRefresh(
        originalRequest,
        error,
        {
          getCredentials: () => useAuthStore.getState(),
          refreshAccessToken: vi.fn(),
          postRefresh,
        },
        vi.fn(),
      ),
    ).rejects.toBe(error);

    expect(postRefresh).not.toHaveBeenCalled();
  });
});
