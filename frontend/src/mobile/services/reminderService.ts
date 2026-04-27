import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const NIGHTLY_REMINDER_KEY = "nightly-reminder";
const NIGHTLY_REMINDER_CHANNEL_ID = "nightly-reminders";
const NIGHTLY_REMINDER_TITLE = "NightRecall";
const NIGHTLY_REMINDER_BODY = "1 quick question before bed?";
let nightlyReminderMutation: Promise<void> = Promise.resolve();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

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

export async function syncNightlyReminder(reminderTime: string, enabled: boolean, options?: { requestPermission?: boolean }) {
  const parsed = parseReminderTime(reminderTime);
  if (!enabled || !parsed) {
    await cancelNightlyReminder();
    return false;
  }

  return scheduleLocalReminder(parsed.hour, parsed.minute, {
    requestPermission: options?.requestPermission ?? false,
  });
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

function parseReminderTime(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return { hour, minute };
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
