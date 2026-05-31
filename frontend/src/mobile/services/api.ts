import axios from "axios";
import Constants from "expo-constants";

import { retryAfterUnauthorizedRefresh } from "./apiUnauthorizedRetry";
import { refreshAccessToken } from "./refreshAccessToken";
import { useAuthStore } from "../store/authStore";
import type { components } from "../types/generated-api";

type RefreshTokenResponse = Pick<components["schemas"]["TokenPair"], "access_token" | "refresh_token">;

const publishSafeFallbackBaseURL = "https://example.invalid/v1";
const defaultBaseURL = (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? publishSafeFallbackBaseURL;

export function getApiBaseUrl() {
  return apiClient.defaults.baseURL ?? defaultBaseURL;
}

export function getSourceImageUrl(sourceImageRef: string) {
  return `${getApiBaseUrl().replace(/\/$/, "")}/study-inputs/source-images/${sourceImageRef}`;
}

export function getSourceImageHeaders() {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export const apiClient = axios.create({
  baseURL: defaultBaseURL,
  timeout: 10000,
  // Mitigation for axios -> follow-redirects header leakage advisory (Node adapter).
  // For our API calls we do not expect redirects; treat redirects as errors instead.
  maxRedirects: 0,
});

const refreshClient = axios.create({
  baseURL: defaultBaseURL,
  timeout: 10000,
  maxRedirects: 0,
});

async function postRefresh(refreshToken: string): Promise<RefreshTokenResponse> {
  const refreshResponse = await refreshClient.post<RefreshTokenResponse>("/users/refresh", { refresh_token: refreshToken });
  return refreshResponse.data;
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    if (!originalRequest) {
      return Promise.reject(error);
    }

    try {
      return await retryAfterUnauthorizedRefresh(
        originalRequest,
        error,
        {
          getCredentials: () => useAuthStore.getState(),
          refreshAccessToken,
          postRefresh: postRefresh,
        },
        (config) => apiClient.request(config),
      );
    } catch (retryError) {
      return Promise.reject(retryError);
    }
  },
);
