import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { theme, useAppTheme } from "../theme";
import { MAX_FONT_SCALE } from "../theme/typography";

type Props = {
  correct: boolean;
  body: string;
  meta?: string;
};

export function ResultBanner({ correct, body, meta }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  return (
    <View
      style={[styles.card, correct ? styles.cardCorrect : styles.cardIncorrect]}
      accessibilityRole="summary"
      accessibilityLabel={correct ? "Correct answer" : "Incorrect answer"}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, correct ? styles.iconCorrect : styles.iconIncorrect]}>
          <MaterialIcons name={correct ? "check-circle" : "cancel"} size={26} color={correct ? colors.primary : colors.accent} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title} allowFontScaling maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {correct ? "Correct" : "Not quite"}
          </Text>
          <Text style={styles.body} allowFontScaling maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {body}
          </Text>
          {meta ? (
            <Text style={styles.meta} allowFontScaling maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {meta}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function createStyles({ colors, typography, isDark }: ThemedStyleContext) {
  return StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1.5,
    gap: 3,
  },
  cardCorrect: {
    backgroundColor: colors.primarySoft,
    borderColor: isDark ? "rgba(114,168,134,0.42)" : "rgba(15,76,63,0.2)",
  },
  cardIncorrect: {
    backgroundColor: colors.accentSoft,
    borderColor: isDark ? "rgba(212,154,98,0.42)" : "rgba(199,123,74,0.28)",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCorrect: {
    backgroundColor: colors.surface,
  },
  iconIncorrect: {
    backgroundColor: colors.surface,
  },
  copy: {
    flex: 1,
    gap: 5,
  },
  title: {
    color: colors.text,
    fontSize: typography.title.fontSize,
    lineHeight: typography.title.lineHeight,
    fontWeight: "800",
  },
  body: {
    color: colors.muted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  meta: {
    color: colors.primary,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
  },
});
}
