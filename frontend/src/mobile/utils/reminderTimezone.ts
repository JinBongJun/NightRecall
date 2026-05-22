import { localDateKeyInTimezone } from "./timezoneDate";

export type ParsedReminderTime = {
  hour: number;
  minute: number;
  normalized: string;
};

export function parseReminderTime(value: string): ParsedReminderTime | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return {
    hour,
    minute,
    normalized: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
  };
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function readZonedParts(instant: Date, timezone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
  };
}

/** Device-local hour/minute for a DAILY trigger that fires at wall-clock time in account timezone. */
export function resolveDeviceTriggerForAccountTime(
  reminderTime: string,
  timezone: string,
  reference = new Date(),
): { hour: number; minute: number } | null {
  const parsed = parseReminderTime(reminderTime);
  if (!parsed) {
    return null;
  }

  const dateKey = localDateKeyInTimezone(timezone, reference);
  const [year, month, day] = dateKey.split("-").map((part) => Number(part));
  const start = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const end = start + 48 * 60 * 60 * 1000;

  for (let instant = start; instant < end; instant += 60 * 1000) {
    const probe = new Date(instant);
    const zoned = readZonedParts(probe, timezone);
    const probeKey = `${zoned.year}-${`${zoned.month}`.padStart(2, "0")}-${`${zoned.day}`.padStart(2, "0")}`;

    if (probeKey === dateKey && zoned.hour === parsed.hour && zoned.minute === parsed.minute) {
      return {
        hour: probe.getHours(),
        minute: probe.getMinutes(),
      };
    }
  }

  return null;
}

/** Next fire instant (device clock) for account-timezone wall clock, or null if unresolvable. */
export function computeNextReminderAt(reminderTime: string, timezone: string, reference = new Date()): Date | null {
  const parsed = parseReminderTime(reminderTime);
  if (!parsed) {
    return null;
  }

  const start = reference.getTime();
  const end = start + 48 * 60 * 60 * 1000;

  for (let instant = start; instant < end; instant += 60 * 1000) {
    const probe = new Date(instant);
    const zoned = readZonedParts(probe, timezone);
    if (zoned.hour === parsed.hour && zoned.minute === parsed.minute) {
      return probe;
    }
  }

  return null;
}

export function formatNextReminderLabel(reminderTime: string, timezone: string, scheduled: boolean, reference = new Date()): string {
  if (!scheduled) {
    return "Reminders are off on this device.";
  }

  const nextAt = computeNextReminderAt(reminderTime, timezone, reference);
  if (!nextAt) {
    return "Next reminder time could not be calculated.";
  }

  const dayLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(nextAt);

  const timeLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(nextAt);

  const todayKey = localDateKeyInTimezone(timezone, reference);
  const nextKey = localDateKeyInTimezone(timezone, nextAt);
  const when = todayKey === nextKey ? "today" : "next";

  return `Next reminder: ${when} at ${timeLabel} (${dayLabel}, ${timezone}).`;
}
