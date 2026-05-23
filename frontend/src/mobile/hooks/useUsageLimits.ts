import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

import { fetchUsageLimits } from "../services/usageService";
import type { UsageLimits } from "../services/usageService";

export type UsageLimitsLoadState = "loading" | "ready" | "error";

export type UsageLimitsResult = {
  usageLimits: UsageLimits | null;
  status: UsageLimitsLoadState;
  limitsUnavailable: boolean;
  reload: () => void;
};

export function useUsageLimits(): UsageLimitsResult {
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);
  const [status, setStatus] = useState<UsageLimitsLoadState>("loading");

  const reload = useCallback(() => {
    setStatus("loading");
    void fetchUsageLimits()
      .then((limits) => {
        setUsageLimits(limits);
        setStatus("ready");
      })
      .catch(() => {
        setUsageLimits(null);
        setStatus("error");
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return {
    usageLimits,
    status,
    limitsUnavailable: status === "error",
    reload,
  };
}
