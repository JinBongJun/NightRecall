import { StyleSheet, Text, View } from "react-native";

import { useUsageLimits } from "../hooks/useUsageLimits";
import { formatTonightLimitsLine } from "../utils/usageLimitDisplay";
import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { theme, useAppTheme } from "../theme";

export function TonightLimitsBar() {
  const styles = useThemedStyles(createStyles);
  const { usageLimits, status } = useUsageLimits();
  const line = formatTonightLimitsLine(usageLimits, status);

  if (!line) {
    return null;
  }

  return (
    <View style={[styles.bar, status === "error" ? styles.barError : null]}>
      <Text style={styles.text}>{line}</Text>
    </View>
  );
}

function createStyles({ colors, typography }: ThemedStyleContext) {
  return StyleSheet.create({
  bar: {
    backgroundColor: colors.surfaceLow,
    borderRadius: theme.radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  barError: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  text: {
    color: colors.muted,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    textAlign: "center",
  },
});
}
