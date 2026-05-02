import { apiClient } from "./api";
import type { components } from "../types/generated-api";

type EntitlementsResponse = components["schemas"]["EntitlementsResponse"];

export async function fetchEntitlements() {
  const response = await apiClient.get<EntitlementsResponse>("/entitlements");
  return response.data;
}
