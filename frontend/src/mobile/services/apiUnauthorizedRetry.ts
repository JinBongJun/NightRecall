import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";

import type { RefreshTokenResponse } from "./refreshAccessToken";
import { refreshAccessToken } from "./refreshAccessToken";

export type RefreshCredentials = {
  refreshToken: string | null;
  userId: string | null;
  provider: "guest" | "google" | null;
};

export type UnauthorizedRetryDeps = {
  getCredentials: () => RefreshCredentials;
  refreshAccessToken: typeof refreshAccessToken;
  postRefresh: (refreshToken: string) => Promise<RefreshTokenResponse>;
};

export function shouldRetryUnauthorized(status: number | undefined, retried: boolean | undefined): boolean {
  return status === 401 && !retried;
}

export async function retryAfterUnauthorizedRefresh<T>(
  originalRequest: InternalAxiosRequestConfig & { _retry?: boolean },
  error: AxiosError,
  deps: UnauthorizedRetryDeps,
  resend: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse<T>>,
): Promise<AxiosResponse<T>> {
  if (!shouldRetryUnauthorized(error.response?.status, originalRequest._retry)) {
    throw error;
  }

  const credentials = deps.getCredentials();
  if (!credentials.refreshToken || !credentials.userId || !credentials.provider) {
    throw error;
  }

  originalRequest._retry = true;

  const refreshed = await deps.refreshAccessToken(deps.postRefresh);
  originalRequest.headers = originalRequest.headers ?? {};
  originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
  return resend(originalRequest);
}
