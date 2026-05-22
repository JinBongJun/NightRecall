import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { AppState, PixelRatio, useColorScheme } from "react-native";
import { DarkTheme, DefaultTheme, Theme as NavigationTheme } from "@react-navigation/native";

import { darkColors, lightColors, type ColorPalette } from "./colors";
import { buildTypography, type AppTypography } from "./typography";

export const theme = {
  spacing: {
    xs: 4,
    sm: 10,
    md: 14,
    lg: 16,
    xl: 22,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 18,
  },
  control: {
    buttonMinHeight: 44,
    buttonMinHeightCompact: 40,
    inputMinHeight: 44,
    touchTarget: 44,
  },
} as const;

type AppThemeContextValue = {
  colors: ColorPalette;
  typography: AppTypography;
  isDark: boolean;
  navigationTheme: NavigationTheme;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

function buildNavigationTheme(colors: ColorPalette, isDark: boolean): NavigationTheme {
  const base = isDark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.accent,
    },
  };
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [fontScale, setFontScale] = useState(() => PixelRatio.getFontScale());

  useEffect(() => {
    const refresh = () => setFontScale(PixelRatio.getFontScale());
    const subscription = AppState.addEventListener("change", refresh);
    return () => subscription.remove();
  }, []);

  const value = useMemo<AppThemeContextValue>(() => {
    const colors = isDark ? darkColors : lightColors;
    return {
      colors,
      typography: buildTypography(fontScale),
      isDark,
      navigationTheme: buildNavigationTheme(colors, isDark),
    };
  }, [fontScale, isDark]);

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme(): AppThemeContextValue {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within ThemeProvider");
  }
  return context;
}
