import { StyleSheet, Text, View } from "react-native";

import { Question } from "../types/models";
import { colors } from "../theme/colors";
import { theme } from "../theme";

type Props = {
  question: Question;
};

export function QuestionCard({ question }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>Tonight's question</Text>
      <Text style={styles.text}>{question.question_text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontSize: theme.typography.micro.fontSize,
    letterSpacing: 0.5,
  },
  text: {
    fontSize: theme.typography.display.fontSize,
    lineHeight: theme.typography.display.lineHeight,
    color: colors.text,
    fontWeight: "700",
  },
});
