import { apiClient } from "./api";
import type { components } from "../types/generated-api";

export type UsageLimits = components["schemas"]["UsageLimitsResponse"];

export async function fetchUsageLimits() {
  const response = await apiClient.get<UsageLimits>("/usage/limits");
  return response.data;
}
