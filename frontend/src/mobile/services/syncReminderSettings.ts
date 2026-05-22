import { applyNightlyReminder, type ApplyNightlyReminderResult } from "./reminderService";
import { recordReminderLocalResync, loadReminderResyncState } from "./reminderResyncStorage";
import { updateReminderSettings } from "./settingsService";
import { useReminderStore } from "../store/reminderStore";
import { shouldRescheduleLocalReminder } from "../utils/reminderResyncPolicy";

export type SyncReminderParams = {
  reminderTime: string;
  enabled: boolean;
  timezone: string;
  requestPermission?: boolean;
  patchServer?: boolean;
  forceLocalReschedule?: boolean;
  onlyIfRescheduleNeeded?: boolean;
};

function resultFromReminderStore(): ApplyNightlyReminderResult {
  const state = useReminderStore.getState();
  return {
    scheduled: state.notificationsEnabled,
    normalizedTime: state.reminderTime,
    permissionDenied: state.permissionDenied,
    nextReminderLabel: state.nextReminderLabel,
  };
}

export async function syncReminderWithServer(params: SyncReminderParams): Promise<ApplyNightlyReminderResult> {
  if (params.onlyIfRescheduleNeeded && !params.forceLocalReschedule) {
    const stored = await loadReminderResyncState();
    if (
      !shouldRescheduleLocalReminder({
        timezone: params.timezone,
        reminderTime: params.reminderTime,
        enabled: params.enabled,
        stored,
      })
    ) {
      return resultFromReminderStore();
    }
  }

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

  await recordReminderLocalResync({
    reminderTime: normalizedTime,
    timezone: params.timezone,
    enabled: notificationsEnabled,
  });

  return result;
}
