import { apiClient } from "./api";
import {
  AnswerResponse,
  GeneratedQuestionsResponse,
  SavedStudyInputDetail,
  SavedStudyInputsResponse,
  SavedTopicSource,
  TonightQuestionResponse,
} from "../types/api";

const QUESTION_GENERATION_TIMEOUT_MS = 60000;

export async function fetchTonightQuestion() {
  const response = await apiClient.get("/review/tonight");
  return response.data as TonightQuestionResponse;
}

export async function fetchPickableTopics() {
  const response = await apiClient.get("/review/pick-topics");
  return response.data as { topics: { id: string; text: string; is_starred: boolean }[] };
}

export async function fetchQuestionFromTopic(topicId: string) {
  const response = await apiClient.post("/review/from-topic", { topic_id: topicId });
  return response.data as TonightQuestionResponse;
}

export async function fetchSavedTopicSource(topicId: string) {
  const response = await apiClient.get(`/review/topic/${topicId}/source`);
  return response.data as SavedTopicSource;
}

export async function fetchSavedInputs() {
  const response = await apiClient.get("/review/saved-inputs");
  return response.data as SavedStudyInputsResponse;
}

export async function fetchSavedInputDetail(studyInputId: string) {
  const response = await apiClient.get(`/review/saved-input/${studyInputId}`);
  return response.data as SavedStudyInputDetail;
}

export async function generateQuestionsFromSavedTopic(payload: { topic_id: string; selected_topic_ids: string[]; count: number }) {
  const response = await apiClient.post("/review/from-saved-topic", payload, {
    timeout: QUESTION_GENERATION_TIMEOUT_MS,
  });
  return response.data as GeneratedQuestionsResponse;
}

export async function generateQuestionsFromSavedInput(payload: { study_input_id: string; selected_topic_ids: string[]; count: number }) {
  const response = await apiClient.post("/review/from-saved-input", payload, {
    timeout: QUESTION_GENERATION_TIMEOUT_MS,
  });
  return response.data as GeneratedQuestionsResponse;
}

export async function deleteTopic(topicId: string) {
  await apiClient.delete(`/review/topic/${topicId}`);
}

export async function deleteSavedInput(studyInputId: string) {
  await apiClient.delete(`/review/saved-input/${studyInputId}`);
}

export async function submitAnswer(payload: {
  question_id: string;
  selected_index?: number | null;
  selected_text?: string | null;
  response_time_ms: number;
}) {
  const response = await apiClient.post("/review/answer", payload);
  return response.data as AnswerResponse;
}
