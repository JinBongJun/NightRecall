import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { colors } from "../theme/colors";
import { theme } from "../theme";

type Props = {
  correct: boolean;
  body: string;
  meta?: string;
};

export function ResultBanner({ correct, body, meta }: Props) {
  return (
    <View style={[styles.card, correct ? styles.cardCorrect : styles.cardIncorrect]}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, correct ? styles.iconCorrect : styles.iconIncorrect]}>
          <MaterialIcons name={correct ? "check" : "close"} size={18} color={correct ? colors.primary : colors.accent} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{correct ? "Correct" : "Not quite"}</Text>
          <Text style={styles.body}>{body}</Text>
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    gap: 3,
  },
  cardCorrect: {
    backgroundColor: colors.primarySoft,
    borderColor: "rgba(15,76,63,0.15)",
  },
  cardIncorrect: {
    backgroundColor: colors.accentSoft,
    borderColor: "rgba(199,123,74,0.2)",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.sm,
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
    gap: 3,
  },
  title: {
    color: colors.text,
    fontSize: theme.typography.title.fontSize,
    lineHeight: theme.typography.title.lineHeight,
    fontWeight: "800",
  },
  body: {
    color: colors.muted,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
  },
  meta: {
    color: colors.primary,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "700",
  },
});
