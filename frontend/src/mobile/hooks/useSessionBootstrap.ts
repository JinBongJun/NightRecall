import { useEffect } from "react";

import { restorePersistedSession } from "../services/authSessionService";
import { restoreReviewSession } from "../services/restoreReviewSession";
import { fetchEntitlements } from "../services/entitlementsService";
import { syncReminderWithServer } from "../services/syncReminderSettings";
import { bootstrapSession } from "../services/bootstrapSession";
import { fetchMe } from "../services/userService";
import { useAuthStore } from "../store/authStore";
import { useReminderStore } from "../store/reminderStore";

export function useSessionBootstrap() {
  const finishBootstrap = useAuthStore((state) => state.finishBootstrap);
  const setPlan = useAuthStore((state) => state.setPlan);
  const setProfile = useAuthStore((state) => state.setProfile);

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
        await restoreReviewSession();
      } catch {
        // Keep the nightly flow moving if local recall state cannot be restored.
      }

      try {
        const me = await fetchMe();
        if (!active) {
          return;
        }

        const reminderTime = me.user.reminder_time ? me.user.reminder_time.slice(0, 5) : "22:30";
        const accountTimezone = me.user.timezone || session.timezone;

        await syncReminderWithServer({
          reminderTime,
          enabled: me.user.notifications_enabled,
          timezone: accountTimezone,
          requestPermission: false,
          patchServer: true,
        });

        if (!active) {
          return;
        }

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
  }, [finishBootstrap, setPlan, setProfile]);
}
