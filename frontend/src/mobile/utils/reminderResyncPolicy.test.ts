import { describe, expect, it } from "vitest";

import {
  buildReminderFingerprint,
  shouldDebounceForegroundResync,
  shouldRescheduleLocalReminder,
} from "./reminderResyncPolicy";

describe("reminderResyncPolicy", () => {
  it("builds stable fingerprints", () => {
    expect(buildReminderFingerprint("22:30", "Asia/Seoul", true)).toBe("22:30|Asia/Seoul|on");
    expect(buildReminderFingerprint("22:30", "Asia/Seoul", false)).toBe("22:30|Asia/Seoul|off");
  });

  it("requires reschedule when storage is empty", () => {
    expect(
      shouldRescheduleLocalReminder({
        timezone: "Asia/Seoul",
        reminderTime: "22:30",
        enabled: true,
        stored: null,
      }),
    ).toBe(true);
  });

  it("requires reschedule when account date changes", () => {
    const reference = new Date("2026-05-21T12:00:00.000Z");

    expect(
      shouldRescheduleLocalReminder({
        timezone: "Asia/Seoul",
        reminderTime: "22:30",
        enabled: true,
        reference,
        stored: {
          lastLocalResyncDate: "2026-05-20",
          lastLocalResyncFingerprint: "22:30|Asia/Seoul|on",
          lastForegroundResyncAtMs: null,
        },
      }),
    ).toBe(true);
  });

  it("skips reschedule when fingerprint matches same account day", () => {
    const reference = new Date("2026-05-20T12:00:00.000Z");

    expect(
      shouldRescheduleLocalReminder({
        timezone: "Asia/Seoul",
        reminderTime: "22:30",
        enabled: true,
        reference,
        stored: {
          lastLocalResyncDate: "2026-05-20",
          lastLocalResyncFingerprint: "22:30|Asia/Seoul|on",
          lastForegroundResyncAtMs: null,
        },
      }),
    ).toBe(false);
  });

  it("debounces foreground attempts within 30 minutes", () => {
    const now = Date.parse("2026-05-20T13:00:00.000Z");
    expect(shouldDebounceForegroundResync(Date.parse("2026-05-20T12:40:00.000Z"), now)).toBe(true);
    expect(shouldDebounceForegroundResync(Date.parse("2026-05-20T12:00:00.000Z"), now)).toBe(false);
  });
});
