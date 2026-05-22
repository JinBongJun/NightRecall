import { StyleSheet, Text, View } from "react-native";

import { Question } from "../types/models";
import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { theme, useAppTheme } from "../theme";

type Props = {
  question: Question;
};

export function QuestionCard({ question }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>Tonight's question</Text>
      <Text style={styles.text}>{question.question_text}</Text>
    </View>
  );
}

function createStyles({ colors, typography }: ThemedStyleContext) {
  return StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  kicker: {
    color: colors.muted,
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: typography.micro.fontSize,
    letterSpacing: 0.5,
  },
  text: {
    fontSize: typography.display.fontSize,
    lineHeight: typography.display.lineHeight,
    color: colors.text,
    fontWeight: "700",
  },
});
}
