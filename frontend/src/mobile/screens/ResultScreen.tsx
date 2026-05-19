import { StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ActionButton } from "../components/ActionButton";
import { TopBar } from "../components/TopBar";
import { PrimaryButton } from "../components/PrimaryButton";
import { ResultBanner } from "../components/ResultBanner";
import { ScreenContainer } from "../components/ScreenContainer";
import { useReviewStore } from "../store/reviewStore";
import { colors } from "../theme/colors";
import { theme } from "../theme";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Result">;

export function ResultScreen({ navigation }: Props) {
  const result = useReviewStore((state) => state.result);
  const sessionQuestions = useReviewStore((state) => state.sessionQuestions);
  const sessionIndex = useReviewStore((state) => state.sessionIndex);
  const retryQuestion = useReviewStore((state) => state.retryQuestion);
  const retryUsed = useReviewStore((state) => state.retryUsed);
  const currentQuestionMode = useReviewStore((state) => state.currentQuestionMode);
  const advanceSessionQuestion = useReviewStore((state) => state.advanceSessionQuestion);
  const consumeRetryQuestion = useReviewStore((state) => state.consumeRetryQuestion);
  const resetSession = useReviewStore((state) => state.resetSession);
  const remaining = sessionQuestions.length ? Math.max(0, sessionQuestions.length - (sessionIndex + 1)) : 0;
  const retryReady = Boolean(retryQuestion) && !retryUsed && currentQuestionMode !== "retry";
  const isCorrect = Boolean(result?.is_correct);

  const done = () => {
    resetSession();
    navigation.popToTop();
  };

  const continueTonight = () => {
    const advanced = advanceSessionQuestion();
    if (!advanced) {
      return;
    }
    navigation.navigate("Review", { mode: "auto" });
  };

  const retryTonight = () => {
    const consumed = consumeRetryQuestion();
    if (!consumed) {
      return;
    }
    navigation.navigate("Review", { mode: "auto" });
  };

  const meta =
    remaining > 0
      ? `${remaining} more question${remaining > 1 ? "s" : ""} left tonight.`
      : retryReady
        ? "One more try is ready."
        : "This set is done for tonight.";

  return (
    <ScreenContainer>
      <TopBar leftIcon="close" onLeftPress={done} />

      <ResultBanner
        correct={isCorrect}
        body={
          isCorrect
            ? "You pulled the right idea back tonight."
            : "That one needs another pass, but the recall still counts."
        }
        meta={meta}
      />

      <View style={styles.explanationCard}>
        <Text style={styles.explanationLabel}>Why</Text>
        <Text style={styles.body}>{result?.explanation ?? "No explanation available."}</Text>
      </View>

      <View style={styles.streakRow}>
        <Text style={styles.streakValue}>{result?.current_streak ?? 0}-night streak</Text>
        <Text style={styles.streakHelper}>
          {result?.current_streak ? "Your recall habit is still active." : "Start your streak again tonight."}
        </Text>
      </View>

      {remaining > 0 ? (
        <>
          <PrimaryButton label={`Next question (${remaining} left)`} onPress={continueTonight} />
          <ActionButton label="Done for now" onPress={done} variant="secondary" />
        </>
      ) : retryReady ? (
        <>
          <PrimaryButton label="Try once more" onPress={retryTonight} />
          <ActionButton label="Done for now" onPress={done} variant="secondary" />
        </>
      ) : (
        <PrimaryButton label="Done" onPress={done} />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  explanationCard: {
    backgroundColor: colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  explanationLabel: {
    color: colors.mutedSoft,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 10,
    fontWeight: "800",
  },
  body: {
    color: colors.text,
    lineHeight: 18,
    fontSize: 13,
  },
  streakRow: {
    gap: 4,
    paddingHorizontal: 4,
  },
  streakValue: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  streakHelper: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
});
