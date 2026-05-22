import { useEffect, useMemo, useRef } from "react";
import { Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import axios from "axios";

import { ActionButton } from "../components/ActionButton";
import { LoadingOrbitPanel } from "../components/LoadingOrbitPanel";
import { ScreenContainer } from "../components/ScreenContainer";
import { TopBar } from "../components/TopBar";
import { deleteSavedInput, generateQuestionsFromSavedInput, generateQuestionsFromSavedTopic } from "../services/reviewService";
import {
  createStudyInput,
  deleteSourceImage,
  redactStudyInputSource,
  startQuestionGenerationJob,
  uploadSourceImage,
  waitForQuestionGenerationJob,
} from "../services/studyService";
import { useReviewStore } from "../store/reviewStore";
import { useTopicsStore } from "../store/topicsStore";
import type { SourceKind, StudyInputType } from "../types/domain";
import type { Question } from "../types/models";
import { resetToHomeAfterFlow } from "../navigation/navigationHelpers";
import type { CaptureStackParamList } from "../navigation/types";
import { asUsageLimitReason } from "../utils/usageLimits";
import { toStudyInputPayload } from "../utils/reviewDraft";

type Props = NativeStackScreenProps<CaptureStackParamList, "QuestionGenerating">;

const getErrorMessage = (error: unknown): string | null => {
  if (error instanceof Error) {
    return error.message;
  }
  return null;
};

export function QuestionGeneratingScreen({ route, navigation }: Props) {
  const cancelledRef = useRef(false);

  const cancel = () => {
    cancelledRef.current = true;
    navigation.goBack();
  };

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
    cancelledRef.current = false;

    const finishWithQuestions = (
      questions: Question[],
    ) => {
      if (!questions.length || cancelledRef.current) {
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

      resetToHomeAfterFlow(navigation);
    };

    const run = async () => {
      let transientStudyInputId: string | null = null;
      let uploadedSourceImageRef: string | null = null;
      let shouldRedactSource = false;
        let pendingSavedInput:
        | {
            study_input_id: string;
            input_type: StudyInputType;
            source_kind: SourceKind;
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
          if (route.params.mode === "photo" && route.params.imageBase64 && bookmarkedCount > 0) {
            uploadedSourceImageRef = (
              await uploadSourceImage({
                  image_base64: route.params.imageBase64,
                  image_mime_type:
                    route.params.imageMimeType && route.params.imageMimeType.startsWith("image/")
                      ? route.params.imageMimeType
                      : "image/jpeg",
              })
            ).source_image_ref;
          }

          const studyInput = await createStudyInput({
            ...payload,
            source_kind: route.params.mode === "photo" ? "photo" : "manual",
            source_preview_text: normalizedSourcePreview,
            source_image_ref: uploadedSourceImageRef ?? undefined,
          });

          if (cancelledRef.current) {
            return;
          }

          transientStudyInputId = studyInput.study_input_id;
          shouldRedactSource = bookmarkedCount === 0;
          if (bookmarkedCount > 0) {
            const firstSavedPointText =
              usablePoints.find((point) => point.isStarred)?.text.trim() || usablePoints[0]?.text.trim() || "Saved learning";
            const sourcePreview = studyInput.source_preview_text ?? normalizedSourcePreview ?? "";
            pendingSavedInput = {
              study_input_id: studyInput.study_input_id,
              input_type: payload.input_type,
              source_kind: studyInput.source_kind ?? (route.params.mode === "photo" ? "photo" : "manual"),
              source_preview_text: sourcePreview || null,
              title: firstSavedPointText,
              preview:
                sourcePreview ||
                usablePoints.find((point) => point.text.trim() && point.text.trim() !== firstSavedPointText)?.text.trim() ||
                "",
              bookmarked_count: bookmarkedCount,
              topic_id: studyInput.topics.find((topic) => topic.is_starred)?.id ?? studyInput.topics[0]?.id ?? "",
            };
          }

          const job = await startQuestionGenerationJob({
            study_input_id: studyInput.study_input_id,
            count: route.params.selectedQuestionCount,
          });
          const completedJob = await waitForQuestionGenerationJob(job.job_id, {
            isCancelled: () => cancelledRef.current,
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
            questions as Question[],
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
        } else if (uploadedSourceImageRef) {
          try {
            await deleteSourceImage(uploadedSourceImageRef);
          } catch {
            // Best-effort cleanup for an image that was uploaded before save failed.
          }
        }
        if (cancelledRef.current) {
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
      cancelledRef.current = true;
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
      <TopBar leftIcon="close" onLeftPress={cancel} />
      <LoadingOrbitPanel title={title} body={body} phases={phases} />
      <ActionButton label="Cancel" onPress={cancel} variant="tertiary" />
    </ScreenContainer>
  );
}
