import { applyNightlyReminder, type ApplyNightlyReminderResult } from "./reminderService";
import { updateReminderSettings } from "./settingsService";
import { useReminderStore } from "../store/reminderStore";

export type SyncReminderParams = {
  reminderTime: string;
  enabled: boolean;
  timezone: string;
  requestPermission?: boolean;
  patchServer?: boolean;
};

export async function syncReminderWithServer(params: SyncReminderParams): Promise<ApplyNightlyReminderResult> {
  const result = await applyNightlyReminder({
    reminderTime: params.reminderTime,
    enabled: params.enabled,
    timezone: params.timezone,
    requestPermission: params.requestPermission,
  });

  const normalizedTime = result.normalizedTime ?? params.reminderTime;
  const notificationsEnabled = params.enabled ? result.scheduled : false;

  if (params.patchServer !== false) {
    await updateReminderSettings({
      reminder_time: normalizedTime,
      notifications_enabled: notificationsEnabled,
      timezone: params.timezone,
    });
  }

  useReminderStore.getState().setReminderState({
    reminderTime: normalizedTime,
    notificationsEnabled,
    nextReminderLabel: result.nextReminderLabel,
    permissionDenied: result.permissionDenied,
  });

  return result;
}
