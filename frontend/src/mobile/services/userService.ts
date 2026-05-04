import { apiClient } from "./api";
import type { AuthMode, AuthProvider, AuthSession } from "../types/authModels";
import type { components } from "../types/generated-api";

type AuthSessionResponse = components["schemas"]["AuthSessionResponse"];
type MeResponse = components["schemas"]["MeResponse"];
type TokenPair = components["schemas"]["TokenPair"];
type UserResponse = components["schemas"]["UserResponse"];
type RefreshTokenResponse = Pick<TokenPair, "access_token" | "refresh_token">;

export type ApiUser = UserResponse;

function toAuthMode(provider: AuthProvider): AuthMode {
  return provider === "guest" ? "guest" : "signed_in";
}

function toAuthSession(response: AuthSessionResponse, provider: AuthProvider): AuthSession {
  return {
    userId: response.user.id,
    timezone: response.user.timezone,
    authMode: toAuthMode(provider),
    accessToken: response.tokens.access_token,
    refreshToken: response.tokens.refresh_token,
    provider,
    email: response.user.email_nullable ?? null,
    displayName: response.user.display_name ?? null,
    avatarUrl: response.user.avatar_url ?? null,
  };
}

export async function createGuestSession(timezone: string, reminderTime?: string) {
  const response = await apiClient.post<AuthSessionResponse>("/users/guest/session", {
    timezone,
    locale: "en",
    reminder_time: reminderTime,
  });
  return toAuthSession(response.data, "guest");
}

export async function signInWithGoogleIdToken(idToken: string) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const response = await apiClient.post<AuthSessionResponse>("/users/google/session", {
    id_token: idToken,
    timezone,
    locale: "en",
  });
  return toAuthSession(response.data, "google");
}

export async function linkGoogleIdToken(idToken: string) {
  const response = await apiClient.post<AuthSessionResponse>("/users/link/google", { id_token: idToken });
  return toAuthSession(response.data, "google");
}

export async function refreshSession(refreshToken: string) {
  const response = await apiClient.post<RefreshTokenResponse>("/users/refresh", { refresh_token: refreshToken });
  return response.data;
}

export async function logoutSession(refreshToken: string) {
  await apiClient.post("/users/logout", { refresh_token: refreshToken });
}

export async function deleteMyAccount() {
  await apiClient.delete("/users/me");
}

export async function fetchMe() {
  const response = await apiClient.get<MeResponse>("/users/me");
  return response.data;
}
