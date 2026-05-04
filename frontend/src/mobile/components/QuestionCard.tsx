import { StyleSheet, Text, View } from "react-native";

import { Question } from "../types/models";
import { colors } from "../theme/colors";

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
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  kicker: {
    color: colors.muted,
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 24,
    lineHeight: 32,
    color: colors.text,
    fontWeight: "700",
  },
});
