import { localDateKeyInTimezone } from "./timezoneDate";

export type ReminderResyncSnapshot = {
  lastLocalResyncDate: string | null;
  lastLocalResyncFingerprint: string | null;
  lastForegroundResyncAtMs: number | null;
};

export function buildReminderFingerprint(reminderTime: string, timezone: string, enabled: boolean): string {
  return `${reminderTime}|${timezone}|${enabled ? "on" : "off"}`;
}

export function shouldRescheduleLocalReminder(params: {
  timezone: string;
  reminderTime: string;
  enabled: boolean;
  stored: ReminderResyncSnapshot | null;
  force?: boolean;
  reference?: Date;
}): boolean {
  if (params.force) {
    return true;
  }

  if (!params.enabled) {
    return false;
  }

  if (!params.stored?.lastLocalResyncDate || !params.stored.lastLocalResyncFingerprint) {
    return true;
  }

  const todayKey = localDateKeyInTimezone(params.timezone, params.reference);
  const fingerprint = buildReminderFingerprint(params.reminderTime, params.timezone, params.enabled);

  if (params.stored.lastLocalResyncDate !== todayKey) {
    return true;
  }

  return params.stored.lastLocalResyncFingerprint !== fingerprint;
}

export function shouldDebounceForegroundResync(
  lastForegroundResyncAtMs: number | null,
  nowMs: number,
  minIntervalMs = 30 * 60 * 1000,
): boolean {
  if (lastForegroundResyncAtMs == null) {
    return false;
  }

  return nowMs - lastForegroundResyncAtMs < minIntervalMs;
}
