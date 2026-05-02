import { apiClient } from "./api";
import type { components } from "../types/generated-api";

type UsageLimitsResponse = components["schemas"]["UsageLimitsResponse"];

export async function fetchUsageLimits() {
  const response = await apiClient.get<UsageLimitsResponse>("/usage/limits");
  return response.data;
}
