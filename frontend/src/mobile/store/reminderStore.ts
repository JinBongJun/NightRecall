import { create } from "zustand";

type ReminderState = {
  reminderTime: string;
  notificationsEnabled: boolean;
  setReminder: (reminderTime: string, notificationsEnabled: boolean) => void;
  resetReminder: () => void;
};

const defaultReminder = {
  reminderTime: "22:30",
  notificationsEnabled: false,
};

export const useReminderStore = create<ReminderState>((set) => ({
  ...defaultReminder,
  setReminder: (reminderTime, notificationsEnabled) => set({ reminderTime, notificationsEnabled }),
  resetReminder: () => set(defaultReminder),
}));
