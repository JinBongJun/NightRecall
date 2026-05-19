import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "../theme/colors";
import { theme } from "../theme";

type Props = {
  label: string;
  onPress: () => void;
};

export function SecondaryButton({ label, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: theme.control.buttonMinHeight,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceLow,
  },
  text: {
    color: colors.text,
    fontSize: theme.typography.button.fontSize,
    fontWeight: "700",
  },
});
