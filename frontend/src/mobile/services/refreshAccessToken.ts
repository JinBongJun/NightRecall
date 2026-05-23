import { clearPersistedSession, persistSession } from "./authSessionService";
import { useAuthStore } from "../store/authStore";
import type { PersistedSession } from "../types/authModels";

export type RefreshTokenResponse = {
  access_token: string;
  refresh_token: string;
};

let refreshInFlight: Promise<PersistedSession> | null = null;

export function resetRefreshInFlightForTests() {
  refreshInFlight = null;
}

async function performRefresh(postRefresh: (refreshToken: string) => Promise<RefreshTokenResponse>): Promise<PersistedSession> {
  const auth = useAuthStore.getState();
  if (!auth.refreshToken || !auth.userId || !auth.provider) {
    throw new Error("No refresh credentials");
  }

  try {
    const refreshed = await postRefresh(auth.refreshToken);
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
    return nextSession;
  } catch (error) {
    await clearPersistedSession();
    throw error;
  }
}

export async function refreshAccessToken(
  postRefresh: (refreshToken: string) => Promise<RefreshTokenResponse>,
): Promise<PersistedSession> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh(postRefresh).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}
