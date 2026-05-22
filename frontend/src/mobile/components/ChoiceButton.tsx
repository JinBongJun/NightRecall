import { Pressable, StyleSheet, Text } from "react-native";

import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { theme, useAppTheme } from "../theme";

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

export function ChoiceButton({ label, selected, onPress }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: Boolean(selected) }}
      style={({ pressed }) => [styles.button, selected && styles.selected, pressed && styles.pressed]}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

function createStyles({ colors, typography }: ThemedStyleContext) {
  return StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: theme.control.buttonMinHeightCompact,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius.md,
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  selected: {
    backgroundColor: "rgba(213,230,220,0.86)",
    borderColor: "rgba(15,76,63,0.28)",
  },
  pressed: {
    opacity: 0.96,
    transform: [{ scale: 0.992 }],
  },
  text: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontWeight: "700",
  },
  selectedText: {
    color: colors.primary,
  },
});
}
