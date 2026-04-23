import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

import { fetchUsageLimits } from "../services/usageService";
import { UsageLimitsResponse } from "../types/api";

export function useUsageLimits() {
  const [usageLimits, setUsageLimits] = useState<UsageLimitsResponse | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void fetchUsageLimits()
        .then((limits) => {
          if (active) {
            setUsageLimits(limits);
          }
        })
        .catch(() => {
          // Keep the UI permissive if the limits request fails; the backend still enforces quotas.
        });

      return () => {
        active = false;
      };
    }, []),
  );

  return usageLimits;
}
