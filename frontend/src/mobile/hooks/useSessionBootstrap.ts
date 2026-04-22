import { useEffect } from "react";

import { clearApiBaseUrl } from "../services/apiBaseUrlStorage";
import { getDefaultApiBaseUrl, setApiBaseUrl } from "../services/api";
import { fetchEntitlements } from "../services/entitlementsService";
import { loadSession } from "../services/sessionStorage";
import { useAuthStore } from "../store/authStore";

export function useSessionBootstrap() {
  const setSession = useAuthStore((state) => state.setSession);
  const setPlan = useAuthStore((state) => state.setPlan);

  useEffect(() => {
    void Promise.all([loadSession(), clearApiBaseUrl()]).then(([session]) => {
      setApiBaseUrl(getDefaultApiBaseUrl());

      if (!session) {
        return;
      }
      setSession(session);
      void fetchEntitlements()
        .then((entitlements) => setPlan(entitlements.plan))
        .catch(() => {
          // Keep defaults if the contract is unavailable.
        });
    });
  }, [setPlan, setSession]);
}
