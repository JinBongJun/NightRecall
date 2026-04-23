import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Easing, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import axios from "axios";

import { ScreenContainer } from "../components/ScreenContainer";
import { deleteSavedInput, generateQuestionsFromSavedInput, generateQuestionsFromSavedTopic } from "../services/reviewService";
import {
  createStudyInput,
  redactStudyInputSource,
  startQuestionGenerationJob,
  uploadSourceImage,
  waitForQuestionGenerationJob,
} from "../services/studyService";
import { useReviewStore } from "../store/reviewStore";
import { useTopicsStore } from "../store/topicsStore";
import { colors } from "../theme/colors";
import { RootStackParamList } from "../types/navigation";
import { asUsageLimitReason } from "../utils/usageLimits";
import { toStudyInputPayload } from "../utils/reviewDraft";

type Props = NativeStackScreenProps<RootStackParamList, "QuestionGenerating">;

const getErrorMessage = (error: unknown): string | null => {
  if (error instanceof Error) {
    return error.message;
  }
  return null;
};

export function QuestionGeneratingScreen({ route, navigation }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const copyFade = useRef(new Animated.Value(1)).current;
  const [phaseIndex, setPhaseIndex] = useState(0);

  const setTopics = useTopicsStore((state) => state.setTopics);
  const upsertSavedInput = useTopicsStore((state) => state.upsertSavedInput);
  const currentQuestion = useReviewStore((state) => state.currentQuestion);
  const sessionQuestions = useReviewStore((state) => state.sessionQuestions);
  const addSessionQuestions = useReviewStore((state) => state.addSessionQuestions);
  const setTonightQuestion = useReviewStore((state) => state.setTonightQuestion);
  const setSessionQuestions = useReviewStore((state) => state.setSessionQuestions);
  const selectedQuestionCount = route.params.selectedQuestionCount;

  const title = useMemo(
    () => (selectedQuestionCount > 1 ? "AI is making your questions" : "AI is making your question"),
    [selectedQuestionCount],
  );
  const body = useMemo(
    () => (selectedQuestionCount > 1 ? "Getting tonight ready." : "Getting tonight's question ready."),
    [selectedQuestionCount],
  );
  const phases = useMemo(
    () =>
      selectedQuestionCount > 1
        ? ["Picking key points", "Writing questions", "Final check"]
        : ["Picking one key point", "Writing your question", "Final check"],
    [selectedQuestionCount],
  );

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    pulseAnimation.start();
    shimmerAnimation.start();

    return () => {
      pulseAnimation.stop();
      shimmerAnimation.stop();
    };
  }, [pulse, shimmer]);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(copyFade, {
          toValue: 0.45,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(copyFade, {
          toValue: 1,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
      setPhaseIndex((current) => (current + 1) % phases.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [copyFade, phases.length]);

  useEffect(() => {
    let cancelled = false;

    const finishWithQuestions = (
      questions: Array<{
        id: string;
        question_type: "mcq" | "true_false" | "fill_blank";
        question_text: string;
        choices: string[] | null;
        answer_index: number | null;
        answer_text: string | null;
        explanation: string;
      }>,
    ) => {
      if (!questions.length || cancelled) {
        return;
      }

      const activeQuestionCount = sessionQuestions.length ? sessionQuestions.length : currentQuestion ? 1 : 0;
      if (activeQuestionCount > 0) {
        addSessionQuestions(questions);
      } else if (questions.length > 1) {
        setSessionQuestions(questions);
      } else {
        setTonightQuestion(questions[0]);
      }

      navigation.replace("Home");
    };

    const run = async () => {
      let transientStudyInputId: string | null = null;
      let shouldRedactSource = false;
      let pendingSavedInput:
        | {
            study_input_id: string;
            input_type: "keywords" | "notes";
            source_kind: "photo" | "manual";
            source_preview_text: string | null;
            title: string;
            preview: string;
            bookmarked_count: number;
            topic_id: string;
          }
        | null = null;

      try {
        if (route.params.variant === "new") {
          const { usablePoints, payload } = toStudyInputPayload(route.params.points);
          const bookmarkedCount = usablePoints.filter((point) => point.isStarred).length;
          const normalizedSourcePreview =
            route.params.sourceText.trim() ||
            route.params.points.find((point) => point.text.trim())?.text.trim() ||
            undefined;
          const sourceImageRef =
            route.params.mode === "photo" && route.params.imageBase64 && bookmarkedCount > 0
              ? (await uploadSourceImage({
                  image_base64: route.params.imageBase64,
                  image_mime_type:
                    route.params.imageMimeType && route.params.imageMimeType.startsWith("image/")
                      ? route.params.imageMimeType
                      : "image/jpeg",
                })).source_image_ref
              : null;

          const studyInput = await createStudyInput({
            ...payload,
            source_kind: route.params.mode === "photo" ? "photo" : "manual",
            source_preview_text: normalizedSourcePreview,
            source_image_ref: sourceImageRef ?? undefined,
          });

          if (cancelled) {
            return;
          }

          transientStudyInputId = studyInput.study_input_id;
          shouldRedactSource = bookmarkedCount === 0;
          if (bookmarkedCount > 0) {
            pendingSavedInput = {
              study_input_id: studyInput.study_input_id,
              input_type: payload.input_type,
              source_kind: studyInput.source_kind ?? (route.params.mode === "photo" ? "photo" : "manual"),
              source_preview_text: studyInput.source_preview_text ?? normalizedSourcePreview ?? null,
              title: studyInput.source_preview_text ?? normalizedSourcePreview ?? usablePoints[0]?.text.trim() ?? "Saved learning",
              preview:
                usablePoints.find((point) => point.text.trim() !== (studyInput.source_preview_text ?? normalizedSourcePreview ?? "").trim())?.text.trim() ?? "",
              bookmarked_count: bookmarkedCount,
              topic_id: studyInput.topics.find((topic) => topic.is_starred)?.id ?? studyInput.topics[0]?.id ?? "",
            };
          }

          const job = await startQuestionGenerationJob({
            study_input_id: studyInput.study_input_id,
            count: route.params.selectedQuestionCount,
          });
          const completedJob = await waitForQuestionGenerationJob(job.job_id, {
            isCancelled: () => cancelled,
          });
          const questions = completedJob.questions;
          if (!Array.isArray(questions) || !questions.length) {
            throw new Error("question_generation_job_returned_no_questions");
          }
          setTopics(studyInput.topics);
          if (pendingSavedInput) {
            upsertSavedInput({
              study_input_id: pendingSavedInput.study_input_id,
              input_type: pendingSavedInput.input_type,
              source_kind: pendingSavedInput.source_kind,
              source_preview_text: pendingSavedInput.source_preview_text,
              title: pendingSavedInput.title,
              preview: pendingSavedInput.preview,
              bookmarked_count: pendingSavedInput.bookmarked_count,
              topic_id: pendingSavedInput.topic_id,
            });
          }
          if (shouldRedactSource && transientStudyInputId) {
            try {
              await redactStudyInputSource(transientStudyInputId);
            } catch {
              // Keep the nightly flow moving even if cleanup fails.
            }
          }
          finishWithQuestions(
            questions as Array<{
              id: string;
              question_type: "mcq" | "true_false" | "fill_blank";
              question_text: string;
              choices: string[] | null;
              answer_index: number | null;
              answer_text: string | null;
              explanation: string;
            }>,
          );
          return;
        }

        const generated =
          route.params.studyInputId
            ? await generateQuestionsFromSavedInput({
                study_input_id: route.params.studyInputId,
                selected_topic_ids: route.params.selectedTopicIds,
                count: route.params.selectedQuestionCount,
              })
            : await generateQuestionsFromSavedTopic({
                topic_id: route.params.topicId ?? route.params.selectedTopicIds[0],
                selected_topic_ids: route.params.selectedTopicIds,
                count: route.params.selectedQuestionCount,
              });

        finishWithQuestions(generated.questions);
      } catch (error) {
        if (transientStudyInputId) {
          try {
            if (pendingSavedInput) {
              upsertSavedInput({
                study_input_id: pendingSavedInput.study_input_id,
                input_type: pendingSavedInput.input_type,
                source_kind: pendingSavedInput.source_kind,
                source_preview_text: pendingSavedInput.source_preview_text,
                title: pendingSavedInput.title,
                preview: pendingSavedInput.preview,
                bookmarked_count: pendingSavedInput.bookmarked_count,
                topic_id: pendingSavedInput.topic_id,
              });
            } else if (shouldRedactSource) {
              await deleteSavedInput(transientStudyInputId);
            } else {
              await redactStudyInputSource(transientStudyInputId);
            }
          } catch {
            // Do not hide the original generation failure behind cleanup errors.
          }
        }
        if (cancelled) {
          return;
        }
        if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
          Alert.alert(
            "Question generation is taking longer than expected",
            "NightRecall is still warming up the first generation request. Try again in a moment.",
            [{ text: "OK", onPress: () => navigation.goBack() }],
          );
          return;
        }
        const message = getErrorMessage(error);
        const detail =
          axios.isAxiosError(error) && typeof error.response?.data?.detail === "string"
            ? error.response.data.detail
            : message && message !== "question_generation_cancelled"
              ? message
              : "NightRecall could not finish making questions right now.";
        const usageLimitReason = asUsageLimitReason(typeof detail === "string" ? detail : null);
        if (usageLimitReason === "question_generation_daily" || usageLimitReason === "question_generation_monthly") {
          navigation.replace("UsageLimit", { reason: usageLimitReason });
          return;
        }
        Alert.alert("Could not make questions", detail, [{ text: "OK", onPress: () => navigation.goBack() }]);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    addSessionQuestions,
    currentQuestion,
    navigation,
    route.params,
    sessionQuestions.length,
    setSessionQuestions,
    setTonightQuestion,
    setTopics,
    upsertSavedInput,
  ]);

  return (
    <ScreenContainer>
      <View style={styles.wrap}>
        <Animated.View
          style={[
            styles.motionWrap,
            {
              transform: [
                {
                  scale: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.05],
                  }),
                },
              ],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.motionGlowLarge,
              {
                opacity: shimmer.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0.5],
                }),
                transform: [
                  {
                    scale: shimmer.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.92, 1.08],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.motionGlowSmall,
              {
                opacity: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.18, 0.36],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.iconTile,
              {
                transform: [
                  {
                    rotate: shimmer.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["-4deg", "4deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.motionRow}>
              <Animated.View
                style={[
                  styles.motionBar,
                  styles.motionBarShort,
                  {
                    opacity: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.motionBar,
                  styles.motionBarLong,
                  {
                    opacity: shimmer.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 0.95],
                    }),
                  },
                ]}
              />
            </View>
            <Animated.View
              style={[
                styles.motionDot,
                {
                  transform: [
                    {
                      translateX: shimmer.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-8, 8],
                      }),
                    },
                  ],
                },
              ]}
            />
          </Animated.View>
        </Animated.View>

        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <Animated.Text style={[styles.phase, { opacity: copyFade }]}>{phases[phaseIndex]}</Animated.Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 520,
    justifyContent: "center",
    alignItems: "center",
    gap: 28,
  },
  motionWrap: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  motionGlowLarge: {
    position: "absolute",
    width: 118,
    height: 118,
    borderRadius: 999,
    backgroundColor: "rgba(45,90,90,0.18)",
  },
  motionGlowSmall: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 999,
    backgroundColor: "rgba(188,235,235,0.24)",
  },
  iconTile: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1B1C19",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  motionRow: {
    gap: 8,
    alignItems: "center",
  },
  motionBar: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  motionBarShort: {
    width: 18,
  },
  motionBarLong: {
    width: 30,
  },
  motionDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    marginTop: 10,
  },
  copy: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: colors.primary,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.8,
  },
  body: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 280,
  },
  phase: {
    color: colors.mutedSoft,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginTop: 8,
  },
});
