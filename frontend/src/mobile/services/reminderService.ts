import * as Notifications from "expo-notifications";

const NIGHTLY_REMINDER_KEY = "nightly-reminder";
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

export async function scheduleLocalReminder(hour: number, minute: number) {
  return mutateNightlyReminder(async () => {
    const permissions = await Notifications.requestPermissionsAsync();
    if (!permissions.granted) {
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

async function cancelNightlyReminderInternal() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const nightlyRequests = scheduled.filter((request) => isNightlyReminderRequest(request));

  await Promise.all(
    nightlyRequests.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
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
