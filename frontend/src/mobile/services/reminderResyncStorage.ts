import * as SecureStore from "expo-secure-store";

import { buildReminderFingerprint } from "../utils/reminderResyncPolicy";
import { localDateKeyInTimezone } from "../utils/timezoneDate";
import type { ReminderResyncSnapshot } from "../utils/reminderResyncPolicy";

const REMINDER_RESYNC_STATE_KEY = "reminder_resync_state_v1";

type StoredReminderResyncState = {
  lastLocalResyncDate?: string;
  lastLocalResyncFingerprint?: string;
  lastForegroundResyncAtMs?: number;
};

export async function loadReminderResyncState(): Promise<ReminderResyncSnapshot | null> {
  const raw = await SecureStore.getItemAsync(REMINDER_RESYNC_STATE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredReminderResyncState;
    if (!parsed.lastLocalResyncDate && !parsed.lastLocalResyncFingerprint && parsed.lastForegroundResyncAtMs == null) {
      return null;
    }

    return {
      lastLocalResyncDate: parsed.lastLocalResyncDate ?? null,
      lastLocalResyncFingerprint: parsed.lastLocalResyncFingerprint ?? null,
      lastForegroundResyncAtMs: parsed.lastForegroundResyncAtMs ?? null,
    };
  } catch {
    return null;
  }
}

export async function recordReminderLocalResync(params: {
  reminderTime: string;
  timezone: string;
  enabled: boolean;
  reference?: Date;
}): Promise<void> {
  const existing = await loadReminderResyncState();

  const next: StoredReminderResyncState = {
    lastLocalResyncDate: localDateKeyInTimezone(params.timezone, params.reference),
    lastLocalResyncFingerprint: buildReminderFingerprint(params.reminderTime, params.timezone, params.enabled),
    lastForegroundResyncAtMs: existing?.lastForegroundResyncAtMs ?? undefined,
  };

  await SecureStore.setItemAsync(REMINDER_RESYNC_STATE_KEY, JSON.stringify(next));
}

export async function touchForegroundResyncAttempt(nowMs = Date.now()): Promise<void> {
  const existing = await loadReminderResyncState();

  const payload: StoredReminderResyncState = {
    lastLocalResyncDate: existing?.lastLocalResyncDate ?? undefined,
    lastLocalResyncFingerprint: existing?.lastLocalResyncFingerprint ?? undefined,
    lastForegroundResyncAtMs: nowMs,
  };

  await SecureStore.setItemAsync(REMINDER_RESYNC_STATE_KEY, JSON.stringify(payload));
}
