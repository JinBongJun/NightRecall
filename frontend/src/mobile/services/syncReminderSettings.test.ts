import { beforeEach, describe, expect, it, vi } from "vitest";

import { useReminderStore } from "../store/reminderStore";
import { localDateKeyInTimezone } from "../utils/timezoneDate";

const reminderMocks = vi.hoisted(() => ({
  applyNightlyReminder: vi.fn(),
  updateReminderSettings: vi.fn(),
  loadReminderResyncState: vi.fn(),
  recordReminderLocalResync: vi.fn(),
}));

vi.mock("./reminderService", () => ({
  applyNightlyReminder: reminderMocks.applyNightlyReminder,
}));

vi.mock("./settingsService", () => ({
  updateReminderSettings: reminderMocks.updateReminderSettings,
}));

vi.mock("./reminderResyncStorage", () => ({
  loadReminderResyncState: reminderMocks.loadReminderResyncState,
  recordReminderLocalResync: reminderMocks.recordReminderLocalResync,
}));

import { syncReminderWithServer } from "./syncReminderSettings";

describe("syncReminderWithServer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useReminderStore.getState().resetReminder();
    useReminderStore.getState().setReminderState({
      reminderTime: "22:30",
      notificationsEnabled: true,
      nextReminderLabel: "Next reminder: today at 10:30 PM.",
      permissionDenied: false,
    });

    reminderMocks.applyNightlyReminder.mockResolvedValue({
      scheduled: true,
      normalizedTime: "22:30",
      permissionDenied: false,
      nextReminderLabel: "Next reminder: today at 10:30 PM.",
    });
    reminderMocks.loadReminderResyncState.mockResolvedValue({
      lastLocalResyncDate: localDateKeyInTimezone("Asia/Seoul"),
      lastLocalResyncFingerprint: "22:30|Asia/Seoul|on",
      lastForegroundResyncAtMs: null,
    });
  });

  it("skips local apply when onlyIfRescheduleNeeded and snapshot matches", async () => {
    const result = await syncReminderWithServer({
      reminderTime: "22:30",
      enabled: true,
      timezone: "Asia/Seoul",
      patchServer: false,
      onlyIfRescheduleNeeded: true,
    });

    expect(reminderMocks.applyNightlyReminder).not.toHaveBeenCalled();
    expect(reminderMocks.updateReminderSettings).not.toHaveBeenCalled();
    expect(result.scheduled).toBe(true);
    expect(result.nextReminderLabel).toContain("Next reminder");
  });

  it("patches server by default after apply", async () => {
    reminderMocks.loadReminderResyncState.mockResolvedValue(null);

    await syncReminderWithServer({
      reminderTime: "22:30",
      enabled: true,
      timezone: "Asia/Seoul",
      requestPermission: false,
    });

    expect(reminderMocks.applyNightlyReminder).toHaveBeenCalled();
    expect(reminderMocks.updateReminderSettings).toHaveBeenCalled();
    expect(reminderMocks.recordReminderLocalResync).toHaveBeenCalled();
  });

  it("does not patch server when patchServer is false", async () => {
    reminderMocks.loadReminderResyncState.mockResolvedValue(null);

    await syncReminderWithServer({
      reminderTime: "22:30",
      enabled: true,
      timezone: "Asia/Seoul",
      patchServer: false,
      forceLocalReschedule: true,
    });

    expect(reminderMocks.updateReminderSettings).not.toHaveBeenCalled();
  });
});
