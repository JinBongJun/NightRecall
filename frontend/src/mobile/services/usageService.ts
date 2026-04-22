import { apiClient } from "./api";
import { UsageLimitsResponse } from "../types/api";

export async function fetchUsageLimits() {
  const response = await apiClient.get("/usage/limits");
  return response.data as UsageLimitsResponse;
}

