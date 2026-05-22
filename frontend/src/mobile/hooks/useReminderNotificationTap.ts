import * as Notifications from "expo-notifications";
import { useEffect } from "react";

import { navigationRef } from "../navigation/navigationRef";

const NIGHTLY_REMINDER_KEY = "nightly-reminder";

export function useReminderNotificationTap() {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const reminderKey = response.notification.request.content.data?.reminderKey;
      if (reminderKey !== NIGHTLY_REMINDER_KEY) {
        return;
      }

      if (!navigationRef.isReady()) {
        return;
      }

      navigationRef.navigate("MainTabs", {
        screen: "HomeTab",
        params: { screen: "Home" },
      });
    });

    return () => subscription.remove();
  }, []);
}
