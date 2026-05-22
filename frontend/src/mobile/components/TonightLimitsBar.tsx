import { StyleSheet, Text, View } from "react-native";

import { useUsageLimits } from "../hooks/useUsageLimits";
import { formatTonightLimitsLine } from "../utils/usageLimitDisplay";
import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { theme, useAppTheme } from "../theme";

export function TonightLimitsBar() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const usageLimits = useUsageLimits();
  const line = formatTonightLimitsLine(usageLimits);

  if (!line) {
    return null;
  }

  return (
    <View style={styles.bar}>
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
  text: {
    color: colors.muted,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    textAlign: "center",
  },
});
}
