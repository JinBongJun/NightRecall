import * as SecureStore from "expo-secure-store";

const API_BASE_URL_KEY = "nightrecall.api-base-url";

export async function saveApiBaseUrl(baseUrl: string) {
  await SecureStore.setItemAsync(API_BASE_URL_KEY, baseUrl);
}

export async function loadApiBaseUrl(): Promise<string | null> {
  const raw = await SecureStore.getItemAsync(API_BASE_URL_KEY);
  return raw ?? null;
}

export async function clearApiBaseUrl() {
  await SecureStore.deleteItemAsync(API_BASE_URL_KEY);
}
