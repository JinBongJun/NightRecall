import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "../theme/colors";

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
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "rgba(255,253,248,0.92)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    shadowColor: colors.shadow,
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
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
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  selectedText: {
    color: colors.primary,
  },
});
