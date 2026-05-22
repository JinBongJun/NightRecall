import { create } from "zustand";

import { loadThemePreference, saveThemePreference, type ThemePreference } from "../services/themePreferenceStorage";

type ThemeState = {
  preference: ThemePreference;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

export const useThemeStore = create<ThemeState>((set) => ({
  preference: "system",
  hydrated: false,
  hydrate: async () => {
    const preference = await loadThemePreference();
    set({ preference, hydrated: true });
  },
  setPreference: async (preference) => {
    await saveThemePreference(preference);
    set({ preference });
  },
}));
