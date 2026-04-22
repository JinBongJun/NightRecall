import { StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ActionButton } from "../components/ActionButton";
import { TopBar } from "../components/TopBar";
import { HeroCard } from "../components/HeroCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { useReviewStore } from "../store/reviewStore";
import { colors } from "../theme/colors";
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

  return (
    <ScreenContainer>
      <TopBar />

      <HeroCard
        overline="Tonight's result"
        title={result?.is_correct ? "Correct" : "Not quite"}
        tone={result?.is_correct ? "primary" : "accent"}
        iconName={result?.is_correct ? "check" : "close"}
        body={
          result?.is_correct
            ? "You pulled the right idea back tonight."
            : "That one needs another pass, but the recall still counts."
        }
        meta={
          remaining > 0
            ? `${remaining} more question${remaining > 1 ? "s" : ""} still ready tonight.`
            : retryReady
              ? "One more try is ready tonight."
            : "This set is done for tonight."
        }
        titleMaxWidth={220}
      />

      <View style={styles.explanationCard}>
        <Text style={styles.explanationLabel}>Why</Text>
        <Text style={styles.body}>{result?.explanation ?? "No explanation available."}</Text>
      </View>

      <View style={styles.streakCard}>
        <Text style={styles.streakLabel}>Consistency</Text>
        <Text style={styles.streakValue}>{result?.current_streak ?? 0}-night streak</Text>
        <Text style={styles.streakHelper}>
          {result?.current_streak
            ? "Your recall habit is still active."
            : "Start your streak again tonight."}
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
    backgroundColor: "rgba(255,253,248,0.94)",
    borderRadius: 24,
    padding: 22,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  explanationLabel: {
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
    fontWeight: "800",
  },
  streakCard: {
    backgroundColor: "rgba(255,253,248,0.94)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 10,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  body: {
    color: colors.text,
    lineHeight: 28,
    fontSize: 18,
  },
  streakLabel: {
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
    fontWeight: "800",
  },
  streakValue: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  streakHelper: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
