import { create } from "zustand";

type StatsState = {
  streak: number;
  totalAnswered: number;
  accuracy: number;
  answeredToday: boolean;
  recentWrongTopics: string[];
  answeredDatesThisMonth: string[];
  setStats: (stats: Partial<Omit<StatsState, "setStats">>) => void;
};

export const useStatsStore = create<StatsState>((set) => ({
  streak: 0,
  totalAnswered: 0,
  accuracy: 0,
  answeredToday: false,
  recentWrongTopics: [],
  answeredDatesThisMonth: [],
  setStats: (stats) => set((state) => ({ ...state, ...stats })),
}));
