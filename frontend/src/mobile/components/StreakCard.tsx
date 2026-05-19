import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { theme } from "../theme";

type Props = {
  streak: number;
};

export function StreakCard({ streak }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Current streak</Text>
      <Text style={styles.value}>{streak} nights</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: 4,
  },
  label: {
    color: "#D6EEF0",
    fontSize: theme.typography.body.fontSize,
    fontWeight: "700",
  },
  value: {
    color: "#FFFFFF",
    fontSize: theme.typography.display.fontSize,
    lineHeight: theme.typography.display.lineHeight,
    fontWeight: "800",
  },
});
