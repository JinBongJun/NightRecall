import { useEffect } from "react";

import { restorePersistedSession } from "../services/authSessionService";
import { fetchEntitlements } from "../services/entitlementsService";
import { syncNightlyReminder } from "../services/reminderService";
import { bootstrapSession } from "../services/bootstrapSession";
import { fetchMe } from "../services/userService";
import { useAuthStore } from "../store/authStore";
import { useReminderStore } from "../store/reminderStore";

export function useSessionBootstrap() {
  const finishBootstrap = useAuthStore((state) => state.finishBootstrap);
  const setPlan = useAuthStore((state) => state.setPlan);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setReminder = useReminderStore((state) => state.setReminder);

  useEffect(() => {
    let active = true;

    void (async () => {
      const session = await bootstrapSession({
        restoreSession: restorePersistedSession,
        fetchPlan: fetchEntitlements,
        setPlan: (plan) => {
          if (active) {
            setPlan(plan);
          }
        },
        finishBootstrap: () => {
          if (active) {
            finishBootstrap();
          }
        },
      });

      if (!active || !session) {
        return;
      }

      try {
        const me = await fetchMe();
        if (!active) {
          return;
        }

        const reminderTime = me.user.reminder_time ? me.user.reminder_time.slice(0, 5) : "22:30";
        const notificationsEnabled = await syncNightlyReminder(
          reminderTime,
          me.user.notifications_enabled,
          { requestPermission: false },
        );

        if (!active) {
          return;
        }

        setReminder(reminderTime, notificationsEnabled);
        setProfile({
          email: me.user.email_nullable,
          displayName: me.user.display_name ?? null,
          avatarUrl: me.user.avatar_url ?? null,
        });
      } catch {
        // Keep the restored local session if account sync is unavailable.
      }
    })();

    return () => {
      active = false;
    };
  }, [finishBootstrap, setPlan, setProfile, setReminder]);
}
