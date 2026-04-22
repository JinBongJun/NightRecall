import { apiClient } from "./api";

export async function updateReminderSettings(payload: {
  reminder_time: string;
  notifications_enabled: boolean;
  timezone: string;
}) {
  const response = await apiClient.patch("/settings/reminder", payload);
  return response.data;
}
