import { apiClient } from "./api";
import type { components } from "../types/generated-api";

type StatsResponse = components["schemas"]["StatsResponse"];

export async function fetchStats() {
  const response = await apiClient.get<StatsResponse>("/stats");
  return response.data;
}
