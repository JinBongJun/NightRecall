import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "nightrecall.session";

export type StoredSession = {
  userId: string;
  timezone: string;
  authMode: "guest" | "signed_in";
  accessToken: string;
  refreshToken: string;
  provider: "guest" | "google";
};

export async function saveSession(session: StoredSession) {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<StoredSession | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return null;
  }
}

export async function clearSessionStorage() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
