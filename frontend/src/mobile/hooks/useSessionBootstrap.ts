import { useEffect } from "react";

import { restorePersistedSession } from "../services/authSessionService";
import { fetchEntitlements } from "../services/entitlementsService";
import { bootstrapSession } from "../services/bootstrapSession";
import { useAuthStore } from "../store/authStore";

export function useSessionBootstrap() {
  const finishBootstrap = useAuthStore((state) => state.finishBootstrap);
  const setPlan = useAuthStore((state) => state.setPlan);

  useEffect(() => {
    let active = true;

    void (async () => {
      await bootstrapSession({
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
    })();

    return () => {
      active = false;
    };
  }, [finishBootstrap, setPlan]);
}
