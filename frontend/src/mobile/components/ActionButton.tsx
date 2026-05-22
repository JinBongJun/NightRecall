import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { MOTION_PRESS } from "../theme/motion";
import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { theme, useAppTheme } from "../theme";
import { MAX_FONT_SCALE } from "../theme/typography";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "tertiary";
  iconName?: keyof typeof MaterialIcons.glyphMap;
  accessibilityLabel?: string;
};

export function ActionButton({ label, onPress, disabled = false, variant = "primary", iconName, accessibilityLabel }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "tertiary" && styles.tertiary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={styles.content}>
        {iconName ? (
          <MaterialIcons
            name={iconName}
            size={16}
            color={variant === "primary" ? "#FFFFFF" : variant === "secondary" ? colors.primary : colors.muted}
          />
        ) : null}
        <Text
          allowFontScaling
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          style={[
            styles.text,
            variant === "primary" && styles.textPrimary,
            variant === "secondary" && styles.textSecondary,
            variant === "tertiary" && styles.textTertiary,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function createStyles({ colors, typography, isDark }: ThemedStyleContext) {
  return StyleSheet.create({
  base: {
    minHeight: theme.control.buttonMinHeight,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: colors.primaryContainer,
    borderColor: "rgba(15,76,63,0.4)",
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  secondary: {
    backgroundColor: isDark ? colors.surfaceLow : colors.surface,
    borderColor: colors.border,
  },
  tertiary: {
    backgroundColor: isDark ? "transparent" : colors.surfaceLow,
    minHeight: theme.control.buttonMinHeightCompact,
    borderColor: "transparent",
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: MOTION_PRESS.opacity,
    transform: [{ scale: MOTION_PRESS.scale }],
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  text: {
    fontSize: typography.button.fontSize,
    lineHeight: typography.button.lineHeight,
    fontWeight: typography.button.fontWeight,
  },
  textPrimary: {
    color: "#FFFFFF",
  },
  textSecondary: {
    color: colors.primary,
  },
  textTertiary: {
    color: colors.muted,
    fontSize: typography.body.fontSize,
    fontWeight: "700",
  },
});
}
