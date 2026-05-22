import { describe, expect, it } from "vitest";

import {
  computeNextReminderAt,
  formatNextReminderLabel,
  parseReminderTime,
  resolveDeviceTriggerForAccountTime,
} from "./reminderTimezone";

describe("reminderTimezone", () => {
  it("parses and normalizes reminder times", () => {
    expect(parseReminderTime("22:30")).toEqual({ hour: 22, minute: 30, normalized: "22:30" });
    expect(parseReminderTime("9:05")).toEqual({ hour: 9, minute: 5, normalized: "09:05" });
    expect(parseReminderTime("25:00")).toBeNull();
    expect(parseReminderTime("bad")).toBeNull();
  });

  it("maps account wall-clock time to device trigger parts", () => {
    const reference = new Date("2026-04-20T12:00:00.000Z");
    const trigger = resolveDeviceTriggerForAccountTime("22:30", "Asia/Seoul", reference);
    expect(trigger).not.toBeNull();
    expect(trigger?.hour).toBeGreaterThanOrEqual(0);
    expect(trigger?.hour).toBeLessThanOrEqual(23);
    expect(trigger?.minute).toBe(30);
  });

  it("computes the next reminder instant at or after the reference", () => {
    const reference = new Date("2026-04-20T12:00:00.000Z");
    const nextAt = computeNextReminderAt("22:30", "Asia/Seoul", reference);
    expect(nextAt).not.toBeNull();
    expect(nextAt!.getTime()).toBeGreaterThanOrEqual(reference.getTime());
  });

  it("formats next reminder copy when scheduled", () => {
    const reference = new Date("2026-04-20T12:00:00.000Z");
    const label = formatNextReminderLabel("22:30", "Asia/Seoul", true, reference);
    expect(label).toMatch(/^Next reminder:/);
    expect(label).toContain("Asia/Seoul");
  });

  it("formats off-state copy when not scheduled", () => {
    expect(formatNextReminderLabel("22:30", "Asia/Seoul", false)).toBe(
      "Reminders are off on this device.",
    );
  });
});
