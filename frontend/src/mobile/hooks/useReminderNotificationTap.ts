import * as Notifications from "expo-notifications";
import { useEffect } from "react";

import { navigateFromNightlyReminderTap } from "../navigation/navigateFromNightlyReminder";
import { NIGHTLY_REMINDER_KEY } from "../utils/nightlyReminderNavigation";

function isNightlyReminderResponse(response: Notifications.NotificationResponse) {
  return response.notification.request.content.data?.reminderKey === NIGHTLY_REMINDER_KEY;
}

export function useReminderNotificationTap() {
  useEffect(() => {
    const handleResponse = (response: Notifications.NotificationResponse) => {
      if (!isNightlyReminderResponse(response)) {
        return;
      }

      navigateFromNightlyReminderTap();
      void Notifications.clearLastNotificationResponseAsync();
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleResponse(response);
      }
    });

    return () => subscription.remove();
  }, []);
}
