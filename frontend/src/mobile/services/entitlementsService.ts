import { apiClient } from "./api";
import { EntitlementsResponse } from "../types/api";

export async function fetchEntitlements() {
  const response = await apiClient.get("/entitlements");
  return response.data as EntitlementsResponse;
}

