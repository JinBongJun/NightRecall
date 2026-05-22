export { theme, ThemeProvider, useAppTheme } from "./ThemeContext";
export type { ThemePreference } from "../services/themePreferenceStorage";
export { lightColors, darkColors, colors, type ColorPalette } from "./colors";
export { baseTypography, buildTypography, MAX_FONT_SCALE, type AppTypography } from "./typography";
export { useThemedStyles, type ThemedStyleContext } from "./useThemedStyles";

/** Approximate fixed height of the main tab bar (excluding safe area). */
export const TAB_BAR_HEIGHT = 56;

/** @deprecated Use TAB_BAR_HEIGHT */
export const BOTTOM_DOCK_HEIGHT = TAB_BAR_HEIGHT;
