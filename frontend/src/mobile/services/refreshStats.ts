import axios from "axios";

import { useStatsStore } from "../store/statsStore";
import { fetchStats } from "./statsService";

export async function refreshStatsFromServer(): Promise<boolean> {
  try {
    const stats = await fetchStats();
    useStatsStore.getState().setStats({
      streak: stats.current_streak,
      totalAnswered: stats.total_answered,
      accuracy: stats.accuracy,
      answeredToday: stats.answered_today,
      recentWrongTopics: stats.recent_wrong_topics,
      answeredDatesThisMonth: stats.answered_dates_this_month,
      statsRefreshFailed: false,
    });
    return true;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return false;
    }
    useStatsStore.getState().setStats({ statsRefreshFailed: true });
    return false;
  }
}
