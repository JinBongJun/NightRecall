import { Pressable, StyleSheet, Text } from "react-native";

import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { theme, useAppTheme } from "../theme";

type Props = {
  label: string;
  onPress: () => void;
};

export function SecondaryButton({ label, onPress }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

function createStyles({ colors, typography }: ThemedStyleContext) {
  return StyleSheet.create({
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
    fontSize: typography.button.fontSize,
    fontWeight: "700",
  },
});
}
