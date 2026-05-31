import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";

import { TopBar } from "../components/TopBar";
import { ChoiceButton } from "../components/ChoiceButton";
import { EmptyState } from "../components/EmptyState";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionRow } from "../components/SectionRow";
import { ScreenContainer } from "../components/ScreenContainer";
import { submitAnswer } from "../services/reviewService";
import { useReviewStore } from "../store/reviewStore";
import { resolveAttemptKind } from "../utils/reviewAttemptKind";
import { isChoiceQuestionType } from "../utils/questionType";
import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { useAppTheme } from "../theme";
import { navigateToCapture, navigateToHome } from "../navigation/navigationHelpers";
import { playLightTapHaptic } from "../utils/feedback";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Review">;

export function ReviewScreen({ navigation }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const currentQuestion = useReviewStore((state) => state.currentQuestion);
  const sessionQuestions = useReviewStore((state) => state.sessionQuestions);
  const sessionIndex = useReviewStore((state) => state.sessionIndex);
  const sessionPhase = useReviewStore((state) => state.sessionPhase);
  const reviewKind = useReviewStore((state) => state.reviewKind);
  const missedQuestions = useReviewStore((state) => state.missedQuestions);
  const retryIndex = useReviewStore((state) => state.retryIndex);
  const selectedChoice = useReviewStore((state) => state.selectedChoice);
  const setSelectedChoice = useReviewStore((state) => state.setSelectedChoice);
  const setResult = useReviewStore((state) => state.setResult);
  const recordMissedQuestion = useReviewStore((state) => state.recordMissedQuestion);
  const advanceSessionQuestion = useReviewStore((state) => state.advanceSessionQuestion);
  const advanceRetryQuestion = useReviewStore((state) => state.advanceRetryQuestion);
  const releaseActiveRecall = useReviewStore((state) => state.releaseActiveRecall);
  const startedAt = useRef(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const inRetry = sessionPhase === "retry";
  const isPractice = reviewKind === "practice";
  const totalQuestions = sessionQuestions.length ? sessionQuestions.length : 1;
  const totalMissed = missedQuestions.length;
  const currentNumber = inRetry ? retryIndex + 1 : sessionQuestions.length ? sessionIndex + 1 : 1;
  const progressDenominator = inRetry ? Math.max(totalMissed, 1) : totalQuestions;
  const progressRatio = Math.min(1, Math.max(0, currentNumber / progressDenominator));
  const remainingAfterCurrent = inRetry
    ? Math.max(0, totalMissed - currentNumber)
    : Math.max(0, totalQuestions - currentNumber);
  const isResurfaced = currentQuestion?.resurface_reason === "missed_before";
  const isUnsupportedQuestion = Boolean(currentQuestion && !isChoiceQuestionType(currentQuestion.question_type));

  useEffect(() => {
    startedAt.current = Date.now();
  }, [currentQuestion?.id, sessionPhase, retryIndex, sessionIndex]);

  const canSubmit = useMemo(() => {
    if (!currentQuestion || isUnsupportedQuestion) return false;
    return selectedChoice !== null;
  }, [currentQuestion, isUnsupportedQuestion, selectedChoice]);

  const skipUnsupportedQuestion = () => {
    if (inRetry) {
      if (advanceRetryQuestion()) {
        return;
      }
    } else if (advanceSessionQuestion()) {
      return;
    }

    releaseActiveRecall();
    navigateToHome(navigation);
  };

  if (!currentQuestion) {
    return (
      <ScreenContainer>
        <TopBar 
          leftIcon="arrow-back" 
          onLeftPress={() => navigation.goBack()} 
        />
        <View style={{ flex: 1, justifyContent: "center", paddingBottom: 60 }}>
          <EmptyState
            iconName="quiz"
            title="No question loaded"
            body="Capture learning first, then come back to recall it tonight."
            actionLabel="Capture for tonight"
            onAction={() => navigateToCapture(navigation)}
          />
          <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
            <PrimaryButton label="Go to Home" onPress={() => navigateToHome(navigation)} />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  if (isUnsupportedQuestion) {
    return (
      <ScreenContainer>
        <TopBar leftIcon="arrow-back" onLeftPress={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: "center", paddingBottom: 60 }}>
          <EmptyState
            iconName="history"
            title="This question format is no longer supported"
            body="NightRecall now uses multiple choice and true/false only. Skip this one to continue."
            actionLabel="Skip question"
            onAction={skipUnsupportedQuestion}
          />
        </View>
      </ScreenContainer>
    );
  }

  const onSubmit = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitAnswer({
        question_id: currentQuestion.id,
        selected_index: selectedChoice,
        selected_text: null,
        response_time_ms: Date.now() - startedAt.current,
        attempt_kind: resolveAttemptKind(reviewKind, sessionPhase),
      });
      if (!result.is_correct && sessionPhase === "main" && reviewKind === "ritual") {
        recordMissedQuestion(currentQuestion);
      }
      setResult(result);
      navigation.navigate("Result");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const detail =
          typeof error.response?.data?.detail === "string"
            ? error.response?.data?.detail
            : typeof error.message === "string" && error.message.trim().length
              ? error.message
              : null;
        Alert.alert("Answer failed", detail ?? "Your answer could not be submitted.");
        return;
      }

      Alert.alert("Answer failed", "Your answer could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <TopBar leftIcon="arrow-back" onLeftPress={() => navigation.goBack()} />

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.statusCopy}>
            <Text style={styles.statusEyebrow}>
              {isPractice ? "Practice" : inRetry ? "Second try" : isResurfaced ? "One more look" : "Tonight's recall"}
            </Text>
            <Text style={styles.statusTitle}>
              {isPractice
                ? `Practice ${currentNumber} of ${totalQuestions}`
                : inRetry
                ? `Retry ${currentNumber} of ${totalMissed}`
                : isResurfaced
                  ? "Take one more look at this idea"
                  : `Question ${currentNumber} of ${totalQuestions}`}
            </Text>
          </View>
          <View style={styles.statusIconWrap}>
            <MaterialIcons name="psychology" size={22} color={colors.primary} />
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progressRatio * 100)}%` }]} />
        </View>
        <View style={styles.heroFooter}>
          <Text style={styles.heroFooterText}>
            {isPractice
              ? "Practice mode does not affect your streak."
              : inRetry
              ? "One more pass on what you missed"
              : isResurfaced
                ? "A quick return to something worth another look"
                : remainingAfterCurrent > 0
                  ? `${remainingAfterCurrent} ${remainingAfterCurrent > 1 ? "questions" : "question"} left after this`
                  : "Last question for tonight"}
          </Text>
        </View>
      </View>

      <SectionRow title="Question" iconName="quiz" />
      <View style={styles.questionCard}>
        <View style={styles.questionMeta}>
          <Text style={styles.questionMetaText}>
            {inRetry ? "Second try" : isResurfaced ? "One more look" : "Choose the best answer"}
          </Text>
        </View>
        <Text style={styles.questionText}>{currentQuestion.question_text}</Text>

        <View style={styles.choices}>
          {currentQuestion.choices?.map((choice, index) => (
            <ChoiceButton
              key={`${choice}-${index}`}
              label={choice}
              selected={selectedChoice === index}
              onPress={() => {
                void playLightTapHaptic();
                setSelectedChoice(index);
              }}
            />
          ))}
        </View>
      </View>

      <PrimaryButton
        label={submitting ? "Submitting..." : "Submit answer"}
        onPress={() => void onSubmit()}
        disabled={!canSubmit || submitting}
        accessibilityLabel={submitting ? "Submitting answer" : "Submit answer"}
      />
    </ScreenContainer>
  );
}

function createStyles({ colors, typography }: ThemedStyleContext) {
  return StyleSheet.create({
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  statusCopy: {
    flex: 1,
    gap: 4,
  },
  statusEyebrow: {
    color: colors.mutedSoft,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
  },
  statusTitle: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "800",
  },
  statusIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    width: "100%",
    height: 5,
    backgroundColor: colors.surfaceLow,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.primary,
  },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroFooterText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  questionMeta: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  questionMetaText: {
    color: colors.secondary,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
  },
  questionText: {
    color: colors.primary,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
  },
  choices: {
    gap: 10,
  },
});
}
