import * as Notifications from "expo-notifications";
import { Linking, Platform } from "react-native";

import {
  formatNextReminderLabel,
  parseReminderTime,
  resolveDeviceTriggerForAccountTime,
} from "../utils/reminderTimezone";

const NIGHTLY_REMINDER_KEY = "nightly-reminder";
const NIGHTLY_REMINDER_CHANNEL_ID = "nightly-reminders";
const NIGHTLY_REMINDER_TITLE = "NightRecall";
const NIGHTLY_REMINDER_BODY = "1 quick question before bed?";
let nightlyReminderMutation: Promise<void> = Promise.resolve();

export type ApplyNightlyReminderResult = {
  scheduled: boolean;
  normalizedTime: string | null;
  permissionDenied: boolean;
  nextReminderLabel: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function applyNightlyReminder(params: {
  reminderTime: string;
  enabled: boolean;
  timezone: string;
  requestPermission?: boolean;
}): Promise<ApplyNightlyReminderResult> {
  const parsed = parseReminderTime(params.reminderTime);
  if (!parsed) {
    return {
      scheduled: false,
      normalizedTime: null,
      permissionDenied: false,
      nextReminderLabel: "Use a valid reminder time like 22:30.",
    };
  }

  if (!params.enabled) {
    await cancelNightlyReminder();
    return {
      scheduled: false,
      normalizedTime: parsed.normalized,
      permissionDenied: false,
      nextReminderLabel: "Reminders are off.",
    };
  }

  const deviceTrigger = resolveDeviceTriggerForAccountTime(parsed.normalized, params.timezone);
  if (!deviceTrigger) {
    await cancelNightlyReminder();
    return {
      scheduled: false,
      normalizedTime: parsed.normalized,
      permissionDenied: false,
      nextReminderLabel: "Could not map reminder time to this device.",
    };
  }

  const scheduled = await scheduleLocalReminder(deviceTrigger.hour, deviceTrigger.minute, {
    requestPermission: params.requestPermission,
  });

  const permissions = await Notifications.getPermissionsAsync();
  const permissionDenied = !permissions.granted;

  return {
    scheduled,
    normalizedTime: parsed.normalized,
    permissionDenied,
    nextReminderLabel: permissionDenied
      ? "Notifications are blocked. Allow NightRecall in system settings."
      : formatNextReminderLabel(parsed.normalized, params.timezone, scheduled),
  };
}

export async function scheduleLocalReminder(hour: number, minute: number, options?: { requestPermission?: boolean }) {
  return mutateNightlyReminder(async () => {
    await ensureAndroidNotificationChannel();
    const permissions =
      options?.requestPermission === false
        ? await Notifications.getPermissionsAsync()
        : await Notifications.requestPermissionsAsync();
    if (!permissions.granted) {
      await cancelNightlyReminderInternal();
      return false;
    }

    await cancelNightlyReminderInternal();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: NIGHTLY_REMINDER_TITLE,
        body: NIGHTLY_REMINDER_BODY,
        data: {
          reminderKey: NIGHTLY_REMINDER_KEY,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        channelId: NIGHTLY_REMINDER_CHANNEL_ID,
        hour,
        minute,
      },
    });
    return true;
  });
}

export async function sendTestReminder() {
  await ensureAndroidNotificationChannel();
  const permissions = await Notifications.requestPermissionsAsync();
  if (!permissions.granted) {
    return false;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: NIGHTLY_REMINDER_TITLE,
      body: "This is a test reminder. Your nightly reminder still fires at your chosen time.",
      data: {
        reminderKey: NIGHTLY_REMINDER_KEY,
        test: true,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      channelId: NIGHTLY_REMINDER_CHANNEL_ID,
    },
  });
  return true;
}

export async function openSystemNotificationSettings() {
  if (Platform.OS === "ios") {
    await Linking.openURL("app-settings:");
    return;
  }
  await Linking.openSettings();
}

function isNightlyReminderRequest(request: Notifications.NotificationRequest) {
  const matchesTaggedReminder = request.content.data?.reminderKey === NIGHTLY_REMINDER_KEY;
  const matchesLegacyReminder =
    request.content.title === NIGHTLY_REMINDER_TITLE && request.content.body === NIGHTLY_REMINDER_BODY;

  return matchesTaggedReminder || matchesLegacyReminder;
}

export async function cancelNightlyReminder() {
  return mutateNightlyReminder(async () => {
    await cancelNightlyReminderInternal();
  });
}

/** @deprecated Use applyNightlyReminder or syncReminderWithServer */
export async function syncNightlyReminder(reminderTime: string, enabled: boolean, options?: { requestPermission?: boolean }) {
  const result = await applyNightlyReminder({
    reminderTime,
    enabled,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    requestPermission: options?.requestPermission,
  });
  return result.scheduled;
}

async function cancelNightlyReminderInternal() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const nightlyRequests = scheduled.filter((request) => isNightlyReminderRequest(request));

  await Promise.all(
    nightlyRequests.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
}

async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(NIGHTLY_REMINDER_CHANNEL_ID, {
    name: "Nightly reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
    description: "Daily NightRecall reminder before bed.",
  });
}

async function mutateNightlyReminder<T>(operation: () => Promise<T>): Promise<T> {
  const previous = nightlyReminderMutation;
  let release = () => {};
  nightlyReminderMutation = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;
  try {
    return await operation();
  } finally {
    release();
  }
}
