import { StyleSheet } from "react-native";

import { colors } from "./colors";

/** Approximate fixed height of BottomDock (excluding safe area). */
export const BOTTOM_DOCK_HEIGHT = 54;

export const theme = {
  colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 22,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 18,
  },
  typography: {
    display: { fontSize: 22, lineHeight: 28, fontWeight: "800" as const },
    title: { fontSize: 17, lineHeight: 22, fontWeight: "800" as const },
    section: { fontSize: 14, lineHeight: 18, fontWeight: "800" as const },
    body: { fontSize: 13, lineHeight: 18, fontWeight: "600" as const },
    caption: { fontSize: 11, lineHeight: 15, fontWeight: "700" as const },
    button: { fontSize: 14, lineHeight: 18, fontWeight: "800" as const },
    micro: { fontSize: 10, lineHeight: 13, fontWeight: "700" as const },
  },
  control: {
    buttonMinHeight: 40,
    buttonMinHeightCompact: 36,
    inputMinHeight: 44,
    touchTarget: 40,
  },
};

export const sharedStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
});
