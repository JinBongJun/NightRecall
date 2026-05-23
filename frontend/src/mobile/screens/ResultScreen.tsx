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
import {
  hasMissedRetries,
  hasMoreRetriesAfterCurrent,
  mainRemaining,
  pluralQuestion,
  retryPassComplete,
} from "../store/reviewRetryLogic";
import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { theme } from "../theme";
import { navigateToReview } from "../navigation/navigationHelpers";
import type { RootStackParamList } from "../navigation/types";
import { playAnswerResultHaptic } from "../utils/feedback";
import { MAX_FONT_SCALE } from "../theme/typography";

type Props = NativeStackScreenProps<RootStackParamList, "Result">;

export function ResultScreen({ navigation }: Props) {
  const styles = useThemedStyles(createStyles);
  const result = useReviewStore((state) => state.result);
  const sessionQuestions = useReviewStore((state) => state.sessionQuestions);
  const sessionIndex = useReviewStore((state) => state.sessionIndex);
  const sessionPhase = useReviewStore((state) => state.sessionPhase);
  const missedQuestions = useReviewStore((state) => state.missedQuestions);
  const retryIndex = useReviewStore((state) => state.retryIndex);
  const advanceSessionQuestion = useReviewStore((state) => state.advanceSessionQuestion);
  const beginRetryPass = useReviewStore((state) => state.beginRetryPass);
  const advanceRetryQuestion = useReviewStore((state) => state.advanceRetryQuestion);
  const resetSession = useReviewStore((state) => state.resetSession);
  const remaining = mainRemaining(sessionQuestions, sessionIndex);
  const missedCount = missedQuestions.length;
  const inMain = sessionPhase === "main";
  const inRetry = sessionPhase === "retry";
  const showNextMain = inMain && remaining > 0;
  const showBeginRetry = inMain && remaining === 0 && hasMissedRetries(missedQuestions);
  const showNextRetry = inRetry && hasMoreRetriesAfterCurrent(missedQuestions, retryIndex, sessionPhase);
  const showDoneOnly =
    (inMain && remaining === 0 && !hasMissedRetries(missedQuestions)) ||
    (inRetry && retryPassComplete(missedQuestions, retryIndex, sessionPhase));
  const isCorrect = Boolean(result?.is_correct);

  useStatsRefresh();

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

  const startRetryPass = () => {
    const started = beginRetryPass();
    if (!started) {
      return;
    }
    navigateToReview(navigation, "auto");
  };

  const continueRetry = () => {
    const advanced = advanceRetryQuestion();
    if (!advanced) {
      return;
    }
    navigateToReview(navigation, "auto");
  };

  const retriesLeft = hasMoreRetriesAfterCurrent(missedQuestions, retryIndex, sessionPhase)
    ? missedQuestions.length - (retryIndex + 1)
    : 0;

  const meta = showNextMain
    ? `${remaining} more ${pluralQuestion(remaining)} left tonight.`
    : showBeginRetry
      ? `${missedCount} missed ${pluralQuestion(missedCount)} ready for one more try.`
      : showNextRetry
        ? "Second try in progress."
        : "This set is done for tonight.";

  const retryPrimaryLabel =
    missedCount === 1 ? "Retry missed question" : `Retry missed questions (${missedCount})`;

  return (
    <ScreenContainer>
      <TopBar leftIcon="close" onLeftPress={done} />

      <ResultBanner
        correct={isCorrect}
        body={
          inRetry
            ? isCorrect
              ? "That second try landed."
              : "Still worth another look later tonight or tomorrow."
            : isCorrect
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

      {showNextMain ? (
        <>
          <PrimaryButton label={`Next question (${remaining} left)`} onPress={continueTonight} />
          <ActionButton label="Done for now" onPress={done} variant="secondary" />
        </>
      ) : showBeginRetry ? (
        <>
          <PrimaryButton label={retryPrimaryLabel} onPress={startRetryPass} />
          <ActionButton label="Finish for tonight" onPress={done} variant="secondary" />
        </>
      ) : showNextRetry ? (
        <>
          <PrimaryButton
            label={`Next missed question (${retriesLeft} left)`}
            onPress={continueRetry}
          />
          <ActionButton label="Finish for tonight" onPress={done} variant="secondary" />
        </>
      ) : showDoneOnly ? (
        <PrimaryButton label="Done" onPress={done} />
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
