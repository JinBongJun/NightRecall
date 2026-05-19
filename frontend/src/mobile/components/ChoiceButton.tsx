import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "../theme/colors";
import { theme } from "../theme";

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

export function ChoiceButton({ label, selected, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, selected && styles.selected, pressed && styles.pressed]}>
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    fontWeight: "700",
  },
  selectedText: {
    color: colors.primary,
  },
});
