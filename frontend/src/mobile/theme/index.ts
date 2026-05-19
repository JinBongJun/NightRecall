import { StyleSheet } from "react-native";

import { colors } from "./colors";

/** Approximate fixed height of BottomDock (excluding safe area). */
export const BOTTOM_DOCK_HEIGHT = 64;

export const theme = {
  colors,
  spacing: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 22,
  },
  typography: {
    title: { fontSize: 20, lineHeight: 25, fontWeight: "800" as const },
    section: { fontSize: 16, lineHeight: 20, fontWeight: "800" as const },
    body: { fontSize: 14, lineHeight: 20, fontWeight: "600" as const },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: "700" as const },
    button: { fontSize: 15, lineHeight: 20, fontWeight: "800" as const },
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
