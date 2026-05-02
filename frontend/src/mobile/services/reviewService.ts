import { apiClient } from "./api";
import type {
  AnswerResponse,
  GeneratedQuestionsResponse,
  Question,
  SavedStudyInputDetail,
  SavedStudyInputsResponse,
  SavedTopicSource,
  Topic,
  TonightQuestionResponse,
} from "../types/api";
import type { components } from "../types/generated-api";

type AnswerSubmitRequest = components["schemas"]["AnswerSubmitRequest"];
type RawAnswerSubmitResponse = components["schemas"]["AnswerSubmitResponse"];
type GenerateFromSavedInputRequest = components["schemas"]["GenerateFromSavedInputRequest"];
type RawGenerateFromSavedInputResponse = components["schemas"]["GenerateFromSavedInputResponse"];
type GenerateFromSavedTopicRequest = components["schemas"]["GenerateFromSavedTopicRequest"];
type RawGenerateFromSavedTopicResponse = components["schemas"]["GenerateFromSavedTopicResponse"];
type PickTopicQuestionRequest = components["schemas"]["PickTopicQuestionRequest"];
type RawReviewQuestionResponse = components["schemas"]["ReviewQuestionResponse"];
type RawSavedStudyInputDetailResponse = components["schemas"]["SavedStudyInputDetailResponse"];
type RawSavedStudyInputsResponse = components["schemas"]["SavedStudyInputsResponse"];
type RawSavedTopicSourceResponse = components["schemas"]["SavedTopicSourceResponse"];
type RawTonightTopicsResponse = components["schemas"]["TonightTopicsResponse"];

const QUESTION_GENERATION_TIMEOUT_MS = 60000;

function normalizeQuestion(question: components["schemas"]["QuestionOutput"]): Question {
  return {
    ...question,
    choices: question.choices ?? null,
    answer_index: question.answer_index ?? null,
    answer_text: question.answer_text ?? null,
  };
}

function normalizeInputType(value: string): "keywords" | "notes" {
  return value === "keywords" ? "keywords" : "notes";
}

function normalizeSourceKind(value: string | null | undefined): "photo" | "manual" | null | undefined {
  if (value === "photo" || value === "manual" || value == null) {
    return value;
  }
  return undefined;
}

function normalizeReviewQuestion(response: RawReviewQuestionResponse): TonightQuestionResponse {
  return {
    mode: response.mode === "picked" ? "picked" : "auto",
    question: normalizeQuestion(response.question),
  };
}

function normalizeSavedTopicSource(response: RawSavedTopicSourceResponse): SavedTopicSource {
  return {
    ...response,
    input_type: normalizeInputType(response.input_type),
    source_kind: normalizeSourceKind(response.source_kind),
    topics: response.topics as Topic[],
  };
}

function normalizeSavedInputDetail(response: RawSavedStudyInputDetailResponse): SavedStudyInputDetail {
  return {
    ...response,
    input_type: normalizeInputType(response.input_type),
    source_kind: normalizeSourceKind(response.source_kind),
    topics: response.topics as Topic[],
  };
}

function normalizeSavedInputs(response: RawSavedStudyInputsResponse): SavedStudyInputsResponse {
  return {
    ...response,
    items: response.items.map((item) => ({
      ...item,
      input_type: normalizeInputType(item.input_type),
      source_kind: normalizeSourceKind(item.source_kind),
    })),
  };
}

function normalizeGeneratedQuestions<T extends RawGenerateFromSavedTopicResponse | RawGenerateFromSavedInputResponse>(
  response: T,
): GeneratedQuestionsResponse {
  return { questions: response.questions.map(normalizeQuestion) };
}

export async function fetchTonightQuestion() {
  const response = await apiClient.get<RawReviewQuestionResponse>("/review/tonight");
  return normalizeReviewQuestion(response.data);
}

export async function fetchPickableTopics() {
  const response = await apiClient.get<RawTonightTopicsResponse>("/review/pick-topics");
  return response.data;
}

export async function fetchQuestionFromTopic(topicId: string) {
  const payload: PickTopicQuestionRequest = { topic_id: topicId };
  const response = await apiClient.post<RawReviewQuestionResponse>("/review/from-topic", payload);
  return normalizeReviewQuestion(response.data);
}

export async function fetchSavedTopicSource(topicId: string) {
  const response = await apiClient.get<RawSavedTopicSourceResponse>(`/review/topic/${topicId}/source`);
  return normalizeSavedTopicSource(response.data);
}

export async function fetchSavedInputs(params?: { page?: number; limit?: number }) {
  const response = await apiClient.get<RawSavedStudyInputsResponse>("/review/saved-inputs", { params });
  return normalizeSavedInputs(response.data);
}

export async function fetchSavedInputDetail(studyInputId: string) {
  const response = await apiClient.get<RawSavedStudyInputDetailResponse>(`/review/saved-input/${studyInputId}`);
  return normalizeSavedInputDetail(response.data);
}

export async function generateQuestionsFromSavedTopic(payload: GenerateFromSavedTopicRequest) {
  const response = await apiClient.post<RawGenerateFromSavedTopicResponse>("/review/from-saved-topic", payload, {
    timeout: QUESTION_GENERATION_TIMEOUT_MS,
  });
  return normalizeGeneratedQuestions(response.data);
}

export async function generateQuestionsFromSavedInput(payload: GenerateFromSavedInputRequest) {
  const response = await apiClient.post<RawGenerateFromSavedInputResponse>("/review/from-saved-input", payload, {
    timeout: QUESTION_GENERATION_TIMEOUT_MS,
  });
  return normalizeGeneratedQuestions(response.data);
}

export async function deleteTopic(topicId: string) {
  await apiClient.delete(`/review/topic/${topicId}`);
}

export async function deleteSavedInput(studyInputId: string) {
  await apiClient.delete(`/review/saved-input/${studyInputId}`);
}

export async function submitAnswer(payload: AnswerSubmitRequest) {
  const response = await apiClient.post<RawAnswerSubmitResponse>("/review/answer", payload);
  return response.data;
}
