import { create } from "zustand";

type OnboardingState = {
  reminderTime: string;
  setReminderTime: (time: string) => void;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  reminderTime: "22:30",
  setReminderTime: (reminderTime) => set({ reminderTime }),
}));
