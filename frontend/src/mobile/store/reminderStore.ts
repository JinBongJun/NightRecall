import { create } from "zustand";

type ReminderState = {
  reminderTime: string;
  notificationsEnabled: boolean;
  nextReminderLabel: string;
  permissionDenied: boolean;
  setReminder: (reminderTime: string, notificationsEnabled: boolean) => void;
  setReminderState: (state: {
    reminderTime: string;
    notificationsEnabled: boolean;
    nextReminderLabel?: string;
    permissionDenied?: boolean;
  }) => void;
  resetReminder: () => void;
};

const defaultReminder = {
  reminderTime: "22:30",
  notificationsEnabled: false,
  nextReminderLabel: "Reminders are off.",
  permissionDenied: false,
};

export const useReminderStore = create<ReminderState>((set) => ({
  ...defaultReminder,
  setReminder: (reminderTime, notificationsEnabled) =>
    set((state) => ({
      reminderTime,
      notificationsEnabled,
      nextReminderLabel: notificationsEnabled ? state.nextReminderLabel : "Reminders are off.",
      permissionDenied: notificationsEnabled ? state.permissionDenied : false,
    })),
  setReminderState: ({ reminderTime, notificationsEnabled, nextReminderLabel, permissionDenied }) =>
    set({
      reminderTime,
      notificationsEnabled,
      nextReminderLabel: nextReminderLabel ?? (notificationsEnabled ? "Reminders are on." : "Reminders are off."),
      permissionDenied: permissionDenied ?? false,
    }),
  resetReminder: () => set(defaultReminder),
}));
