import { useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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
import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { theme, useAppTheme } from "../theme";
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
  const currentQuestionMode = useReviewStore((state) => state.currentQuestionMode);
  const selectedChoice = useReviewStore((state) => state.selectedChoice);
  const fillBlankAnswer = useReviewStore((state) => state.fillBlankAnswer);
  const setSelectedChoice = useReviewStore((state) => state.setSelectedChoice);
  const setFillBlankAnswer = useReviewStore((state) => state.setFillBlankAnswer);
  const setResult = useReviewStore((state) => state.setResult);
  const queueRetryQuestion = useReviewStore((state) => state.queueRetryQuestion);
  const startedAt = useRef(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const totalQuestions = sessionQuestions.length ? sessionQuestions.length : 1;
  const currentNumber = currentQuestionMode === "retry" ? totalQuestions : sessionQuestions.length ? sessionIndex + 1 : 1;
  const progressRatio = currentQuestionMode === "retry" ? 1 : Math.min(1, Math.max(0, currentNumber / totalQuestions));
  const remainingAfterCurrent = currentQuestionMode === "retry" ? 0 : Math.max(0, totalQuestions - currentNumber);
  const isResurfaced = currentQuestion?.resurface_reason === "missed_before";

  const canSubmit = useMemo(() => {
    if (!currentQuestion) return false;
    if (currentQuestion.question_type === "fill_blank") return fillBlankAnswer.trim().length > 0;
    return selectedChoice !== null;
  }, [currentQuestion, fillBlankAnswer, selectedChoice]);

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

  const onSubmit = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitAnswer({
        question_id: currentQuestion.id,
        selected_index: selectedChoice,
        selected_text: fillBlankAnswer || null,
        response_time_ms: Date.now() - startedAt.current,
      });
      if (!result.is_correct && currentQuestionMode === "normal") {
        queueRetryQuestion(currentQuestion);
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
              {currentQuestionMode === "retry" ? "One more try" : isResurfaced ? "One more look" : "Tonight's recall"}
            </Text>
            <Text style={styles.statusTitle}>
              {currentQuestionMode === "retry"
                ? "A quick retry before you finish"
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
            {currentQuestionMode === "retry"
              ? "A quick retry for the one you missed"
              : isResurfaced
                ? "A quick return to something worth another look"
              : remainingAfterCurrent > 0
              ? `${remainingAfterCurrent} question${remainingAfterCurrent > 1 ? "s" : ""} left after this`
              : "Last question for tonight"}
          </Text>
        </View>
      </View>

      <SectionRow title="Question" iconName="quiz" />
      <View style={styles.questionCard}>
        <View style={styles.questionMeta}>
          <Text style={styles.questionMetaText}>
            {currentQuestionMode === "retry"
              ? "One more try"
              : isResurfaced
                ? "One more look"
              : currentQuestion.question_type === "fill_blank"
                ? "Fill in the answer"
                : "Choose the best answer"}
          </Text>
        </View>
        <Text style={styles.questionText}>{currentQuestion.question_text}</Text>

        {currentQuestion.question_type === "fill_blank" ? (
          <>
            <TextInput
              value={fillBlankAnswer}
              onChangeText={setFillBlankAnswer}
              style={styles.textArea}
              multiline
              placeholder="Type what you remember..."
              placeholderTextColor={colors.mutedSoft}
            />
            <View style={styles.hintRow}>
              <Text style={styles.hintText}>Use a short, direct answer.</Text>
            </View>
          </>
        ) : (
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
        )}
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
  textArea: {
    minHeight: 120,
    paddingHorizontal: 0,
    paddingTop: 6,
    paddingBottom: 10,
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
    borderBottomWidth: 2,
    borderBottomColor: colors.surfaceHigh,
    textAlignVertical: "top",
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  hintText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.72,
  },
  choices: {
    gap: 10,
  },
});
}
