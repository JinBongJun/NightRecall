import { useAuthStore } from "../store/authStore";
import { useReminderStore } from "../store/reminderStore";
import { useReviewStore } from "../store/reviewStore";
import { useStatsStore } from "../store/statsStore";
import { useTopicsStore } from "../store/topicsStore";
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
  useTopicsStore.getState().resetTopics();
  useReviewStore.getState().resetReview();
  useStatsStore.getState().resetStats();
  useReminderStore.getState().resetReminder();
  await clearSessionStorage();
}
