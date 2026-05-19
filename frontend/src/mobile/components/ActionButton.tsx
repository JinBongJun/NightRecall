import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { colors } from "../theme/colors";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "tertiary";
  iconName?: keyof typeof MaterialIcons.glyphMap;
};

export function ActionButton({ label, onPress, disabled = false, variant = "primary", iconName }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
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
            size={18}
            color={variant === "primary" ? "#FFFFFF" : variant === "secondary" ? colors.primary : colors.muted}
          />
        ) : null}
        <Text
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

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: colors.primaryContainer,
    borderColor: "rgba(15,76,63,0.4)",
    shadowColor: colors.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  secondary: {
    backgroundColor: "rgba(255,253,248,0.92)",
    borderColor: colors.border,
  },
  tertiary: {
    backgroundColor: "rgba(255,253,248,0.46)",
    minHeight: 44,
    borderColor: "transparent",
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  text: {
    fontSize: 15,
    fontWeight: "800",
  },
  textPrimary: {
    color: "#FFFFFF",
  },
  textSecondary: {
    color: colors.primary,
  },
  textTertiary: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
});
