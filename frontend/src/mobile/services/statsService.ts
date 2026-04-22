import { apiClient } from "./api";
import { StatsResponse } from "../types/api";

export async function fetchStats() {
  const response = await apiClient.get("/stats");
  return response.data as StatsResponse;
}
