import { create } from "zustand";

type StatsState = {
  streak: number;
  totalAnswered: number;
  accuracy: number;
  answeredToday: boolean;
  recentWrongTopics: string[];
  answeredDatesThisMonth: string[];
  setStats: (stats: Partial<Omit<StatsState, "setStats">>) => void;
  resetStats: () => void;
};

const defaultStats = {
  streak: 0,
  totalAnswered: 0,
  accuracy: 0,
  answeredToday: false,
  recentWrongTopics: [],
  answeredDatesThisMonth: [],
};

export const useStatsStore = create<StatsState>((set) => ({
  ...defaultStats,
  setStats: (stats) => set((state) => ({ ...state, ...stats })),
  resetStats: () => set(defaultStats),
}));
