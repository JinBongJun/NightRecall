import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

import { refreshStatsFromServer } from "../services/refreshStats";

export function useStatsRefresh() {
  useFocusEffect(
    useCallback(() => {
      void refreshStatsFromServer();
    }, []),
  );
}
