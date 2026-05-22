import { StyleSheet, Text, View } from "react-native";

import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { theme, useAppTheme } from "../theme";

type Props = {
  streak: number;
};

export function StreakCard({ streak }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Current streak</Text>
      <Text style={styles.value}>{streak} nights</Text>
    </View>
  );
}

function createStyles({ colors, typography }: ThemedStyleContext) {
  return StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: 4,
  },
  label: {
    color: "#D6EEF0",
    fontSize: typography.body.fontSize,
    fontWeight: "700",
  },
  value: {
    color: "#FFFFFF",
    fontSize: typography.display.fontSize,
    lineHeight: typography.display.lineHeight,
    fontWeight: "800",
  },
});
}
