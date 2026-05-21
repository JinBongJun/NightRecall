import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

import { fetchStats } from "../services/statsService";
import { useStatsStore } from "../store/statsStore";

export function useStatsRefresh() {
  const setStats = useStatsStore((state) => state.setStats);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void fetchStats()
        .then((stats) => {
          if (!active) {
            return;
          }

          setStats({
            streak: stats.current_streak,
            totalAnswered: stats.total_answered,
            accuracy: stats.accuracy,
            answeredToday: stats.answered_today,
            recentWrongTopics: stats.recent_wrong_topics,
            answeredDatesThisMonth: stats.answered_dates_this_month,
          });
        })
        .catch(() => {
          // Keep the last known stats if refresh fails.
        });

      return () => {
        active = false;
      };
    }, [setStats]),
  );
}
