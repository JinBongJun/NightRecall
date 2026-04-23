import { useAuthStore } from "../store/authStore";
import { clearSessionStorage, loadSession, saveSession, StoredSession } from "./sessionStorage";

export async function persistSession(session: StoredSession) {
  useAuthStore.getState().setSession(session);
  await saveSession(session);
}

export async function restorePersistedSession() {
  const session = await loadSession();
  if (session) {
    useAuthStore.getState().setSession(session);
  }
  return session;
}

export async function clearPersistedSession() {
  useAuthStore.getState().clearSession();
  await clearSessionStorage();
}
