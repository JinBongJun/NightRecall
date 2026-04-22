import { create } from "zustand";

type ReminderState = {
  reminderTime: string;
  notificationsEnabled: boolean;
  setReminder: (reminderTime: string, notificationsEnabled: boolean) => void;
};

export const useReminderStore = create<ReminderState>((set) => ({
  reminderTime: "22:30",
  notificationsEnabled: false,
  setReminder: (reminderTime, notificationsEnabled) => set({ reminderTime, notificationsEnabled }),
}));
