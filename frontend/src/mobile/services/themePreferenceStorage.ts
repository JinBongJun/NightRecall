import * as SecureStore from "expo-secure-store";

export type ThemePreference = "system" | "light" | "dark";

const THEME_PREFERENCE_KEY = "theme_preference";

const isThemePreference = (value: string): value is ThemePreference =>
  value === "system" || value === "light" || value === "dark";

export async function loadThemePreference(): Promise<ThemePreference> {
  const raw = await SecureStore.getItemAsync(THEME_PREFERENCE_KEY);
  if (!raw || !isThemePreference(raw)) {
    return "system";
  }
  return raw;
}

export async function saveThemePreference(preference: ThemePreference): Promise<void> {
  await SecureStore.setItemAsync(THEME_PREFERENCE_KEY, preference);
}
