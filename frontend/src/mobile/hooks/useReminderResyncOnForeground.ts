import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import { syncReminderWithServer } from "../services/syncReminderSettings";
import { loadReminderResyncState, touchForegroundResyncAttempt } from "../services/reminderResyncStorage";
import { useAuthStore } from "../store/authStore";
import { useReminderStore } from "../store/reminderStore";
import { shouldDebounceForegroundResync } from "../utils/reminderResyncPolicy";

export function useReminderResyncOnForeground() {
  const bootstrapStatus = useAuthStore((state) => state.bootstrapStatus);
  const userId = useAuthStore((state) => state.userId);
  const timezone = useAuthStore((state) => state.timezone);
  const reminderTime = useReminderStore((state) => state.reminderTime);
  const notificationsEnabled = useReminderStore((state) => state.notificationsEnabled);
  const resyncInFlightRef = useRef(false);

  useEffect(() => {
    if (bootstrapStatus !== "ready" || !userId || !notificationsEnabled) {
      return;
    }

    const runResync = async () => {
      if (resyncInFlightRef.current) {
        return;
      }

      const stored = await loadReminderResyncState();
      if (shouldDebounceForegroundResync(stored?.lastForegroundResyncAtMs ?? null, Date.now())) {
        return;
      }

      resyncInFlightRef.current = true;
      try {
        await syncReminderWithServer({
          reminderTime,
          enabled: true,
          timezone,
          requestPermission: false,
          patchServer: false,
          onlyIfRescheduleNeeded: true,
        });
      } catch {
        // Foreground resync is best-effort.
      } finally {
        await touchForegroundResyncAttempt().catch(() => undefined);
        resyncInFlightRef.current = false;
      }
    };

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void runResync();
      }
    });

    return () => subscription.remove();
  }, [bootstrapStatus, notificationsEnabled, reminderTime, timezone, userId]);
}
