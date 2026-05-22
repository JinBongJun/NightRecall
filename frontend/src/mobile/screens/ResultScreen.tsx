import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ActionButton } from "../components/ActionButton";
import { TopBar } from "../components/TopBar";
import { PrimaryButton } from "../components/PrimaryButton";
import { ResultBanner } from "../components/ResultBanner";
import { ScreenContainer } from "../components/ScreenContainer";
import { useStatsRefresh } from "../hooks/useStatsRefresh";
import { refreshStatsFromServer } from "../services/refreshStats";
import { useReviewStore } from "../store/reviewStore";
import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { theme, useAppTheme } from "../theme";
import { navigateToReview } from "../navigation/navigationHelpers";
import type { RootStackParamList } from "../navigation/types";
import { playAnswerResultHaptic } from "../utils/feedback";
import { MAX_FONT_SCALE } from "../theme/typography";

type Props = NativeStackScreenProps<RootStackParamList, "Result">;

export function ResultScreen({ navigation }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const result = useReviewStore((state) => state.result);
  const sessionQuestions = useReviewStore((state) => state.sessionQuestions);
  const sessionIndex = useReviewStore((state) => state.sessionIndex);
  const retryQuestion = useReviewStore((state) => state.retryQuestion);
  const retryUsed = useReviewStore((state) => state.retryUsed);
  const currentQuestionMode = useReviewStore((state) => state.currentQuestionMode);
  const advanceSessionQuestion = useReviewStore((state) => state.advanceSessionQuestion);
  const consumeRetryQuestion = useReviewStore((state) => state.consumeRetryQuestion);
  const resetSession = useReviewStore((state) => state.resetSession);
  const releaseActiveRecall = useReviewStore((state) => state.releaseActiveRecall);
  const remaining = sessionQuestions.length ? Math.max(0, sessionQuestions.length - (sessionIndex + 1)) : 0;
  const retryReady = Boolean(retryQuestion) && !retryUsed && currentQuestionMode !== "retry";
  const isCorrect = Boolean(result?.is_correct);
  const sessionFinished = remaining === 0 && !retryReady;

  useStatsRefresh();

  useEffect(() => {
    if (sessionFinished) {
      releaseActiveRecall();
    }
  }, [releaseActiveRecall, sessionFinished]);

  useEffect(() => {
    if (!result) {
      return;
    }

    void playAnswerResultHaptic(result.is_correct);
    void refreshStatsFromServer();
  }, [result]);

  const done = () => {
    resetSession();
    navigation.popToTop();
  };

  const continueTonight = () => {
    const advanced = advanceSessionQuestion();
    if (!advanced) {
      return;
    }
    navigateToReview(navigation, "auto");
  };

  const retryTonight = () => {
    const consumed = consumeRetryQuestion();
    if (!consumed) {
      return;
    }
    navigateToReview(navigation, "auto");
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

      <View
        style={styles.streakCard}
        accessibilityRole="text"
        accessibilityLabel={`${result?.current_streak ?? 0} night streak`}
      >
        <Text style={styles.streakValue} allowFontScaling maxFontSizeMultiplier={MAX_FONT_SCALE}>
          {result?.current_streak ?? 0}-night streak
        </Text>
        <Text style={styles.streakHelper} allowFontScaling maxFontSizeMultiplier={MAX_FONT_SCALE}>
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

function createStyles({ colors, typography }: ThemedStyleContext) {
  return StyleSheet.create({
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
    fontSize: typography.micro.fontSize,
    fontWeight: "800",
  },
  body: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontWeight: typography.body.fontWeight,
  },
  streakCard: {
    gap: 4,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakValue: {
    color: colors.primary,
    fontSize: typography.section.fontSize,
    lineHeight: typography.section.lineHeight,
    fontWeight: "800",
  },
  streakHelper: {
    color: colors.muted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
});
}
