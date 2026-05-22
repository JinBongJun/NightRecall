import { Pressable, StyleSheet, Text } from "react-native";

import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { useAppTheme } from "../theme";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function TopicChip({ label, selected, onPress }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.selected]}>
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

function createStyles({ colors, typography }: ThemedStyleContext) {
  return StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selected: {
    backgroundColor: colors.secondarySoft,
    borderColor: colors.secondarySoft,
  },
  text: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  selectedText: {
    color: colors.primary,
  },
});
}
