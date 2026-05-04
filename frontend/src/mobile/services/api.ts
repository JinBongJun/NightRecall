import axios from "axios";
import Constants from "expo-constants";

import { clearPersistedSession, persistSession } from "./authSessionService";
import { useAuthStore } from "../store/authStore";
import type { PersistedSession } from "../types/authModels";
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
    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    const auth = useAuthStore.getState();
    if (!auth.refreshToken || !auth.userId || !auth.provider) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshResponse = await refreshClient.post<RefreshTokenResponse>("/users/refresh", { refresh_token: auth.refreshToken });
      const refreshed = refreshResponse.data;
      const nextSession: PersistedSession = {
        userId: auth.userId,
        timezone: auth.timezone,
        authMode: auth.authMode,
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        provider: auth.provider,
        email: auth.email,
        displayName: auth.displayName,
        avatarUrl: auth.avatarUrl,
      };
      await persistSession(nextSession);
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${refreshed.access_token}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      await clearPersistedSession();
      return Promise.reject(refreshError);
    }
  },
);
