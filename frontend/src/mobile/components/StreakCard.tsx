import { StyleSheet, Text, View } from "react-native";

import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { theme } from "../theme";

type Props = {
  streak: number;
};

export function StreakCard({ streak }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Current streak</Text>
      <Text style={styles.value}>{streak} nights</Text>
    </View>
  );
}

function createStyles({ colors, typography, isDark }: ThemedStyleContext) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.primarySoft,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      gap: 4,
      borderWidth: 1,
      borderColor: isDark ? "rgba(114,168,134,0.35)" : "rgba(15,76,63,0.16)",
    },
    label: {
      color: colors.mutedSoft,
      fontSize: typography.body.fontSize,
      fontWeight: "700",
    },
    value: {
      color: colors.primary,
      fontSize: typography.display.fontSize,
      lineHeight: typography.display.lineHeight,
      fontWeight: "800",
    },
  });
}
