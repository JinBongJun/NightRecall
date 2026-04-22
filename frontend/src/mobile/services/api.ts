import axios from "axios";
import Constants from "expo-constants";

import { clearSessionStorage, saveSession } from "./sessionStorage";
import { useAuthStore } from "../store/authStore";

const publishSafeFallbackBaseURL = "https://example.invalid/v1";
const defaultBaseURL = (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? publishSafeFallbackBaseURL;

let runtimeBaseURL = defaultBaseURL;

export function getDefaultApiBaseUrl() {
  return defaultBaseURL;
}

export function getApiBaseUrl() {
  return apiClient.defaults.baseURL ?? runtimeBaseURL;
}

export function setApiBaseUrl(baseURL: string) {
  runtimeBaseURL = baseURL;
  apiClient.defaults.baseURL = baseURL;
  refreshClient.defaults.baseURL = baseURL;
}

export const apiClient = axios.create({
  baseURL: runtimeBaseURL,
  timeout: 10000,
  // Mitigation for axios -> follow-redirects header leakage advisory (Node adapter).
  // For our API calls we do not expect redirects; treat redirects as errors instead.
  maxRedirects: 0,
});

const refreshClient = axios.create({
  baseURL: runtimeBaseURL,
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
      const refreshResponse = await refreshClient.post("/users/refresh", { refresh_token: auth.refreshToken });
      const refreshed = refreshResponse.data as {
        access_token: string;
        refresh_token: string;
      };
      const nextSession = {
        userId: auth.userId,
        timezone: auth.timezone,
        authMode: auth.authMode,
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        provider: auth.provider,
      } as const;
      useAuthStore.getState().setSession(nextSession);
      await saveSession(nextSession);
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${refreshed.access_token}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().clearSession();
      await clearSessionStorage();
      return Promise.reject(refreshError);
    }
  },
);
