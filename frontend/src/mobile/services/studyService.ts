import { apiClient } from "./api";
import type {
  Question,
  QuestionGenerationJobResponse,
  StudyInputExtractResponse,
  StudyInputExtractJobResponse,
  StudyInputSourceImageUploadResponse,
  Topic,
} from "../types/api";
import type { components } from "../types/generated-api";

type QuestionGenerateRequest = components["schemas"]["QuestionGenerateRequest"];
type RawQuestionGenerateResponse = components["schemas"]["QuestionGenerateResponse"];
type RawQuestionGenerationJobResponse = components["schemas"]["QuestionGenerationJobResponse"];
type StudyInputCreateRequest = components["schemas"]["StudyInputCreateRequest"];
type RawStudyInputCreateResponse = components["schemas"]["StudyInputCreateResponse"];
type StudyInputExtractRequest = components["schemas"]["StudyInputExtractRequest"];
type RawStudyInputExtractResponse = components["schemas"]["StudyInputExtractResponse"];
type RawStudyInputExtractJobResponse = components["schemas"]["StudyInputExtractJobResponse"];
type StudyInputSourceImageUploadRequest = components["schemas"]["StudyInputSourceImageUploadRequest"];
type RawStudyInputSourceImageUploadResponse = components["schemas"]["StudyInputSourceImageUploadResponse"];

type StudyInputSourceImageUploadPayload = Omit<StudyInputSourceImageUploadRequest, "image_mime_type"> & {
  image_mime_type?: string;
};
type StudyInputCreateResult = {
  study_input_id: string;
  topics: Topic[];
  source_kind?: "photo" | "manual" | null;
  source_preview_text?: string | null;
  source_image_ref?: string | null;
};

const QUESTION_GENERATION_POLL_INTERVAL_MS = 1500;
const QUESTION_GENERATION_JOB_TIMEOUT_MS = 180000;
const STUDY_INPUT_EXTRACT_JOB_POLL_INTERVAL_MS = 1500;
const STUDY_INPUT_EXTRACT_JOB_TIMEOUT_MS = 180000;

function normalizeQuestion(question: components["schemas"]["QuestionOutput"]): Question {
  return {
    ...question,
    choices: question.choices ?? null,
    answer_index: question.answer_index ?? null,
    answer_text: question.answer_text ?? null,
  };
}

function normalizeSourceKind(value: string | null | undefined): "photo" | "manual" | null | undefined {
  if (value === "photo" || value === "manual" || value == null) {
    return value;
  }
  return undefined;
}

function normalizeQuestionGenerationJob(job: RawQuestionGenerationJobResponse): QuestionGenerationJobResponse {
  return {
    ...job,
    questions: job.questions?.map(normalizeQuestion),
  };
}

function normalizeStudyInputCreate(response: RawStudyInputCreateResponse): StudyInputCreateResult {
  return {
    ...response,
    source_kind: normalizeSourceKind(response.source_kind),
  };
}

export async function createStudyInput(payload: StudyInputCreateRequest) {
  const response = await apiClient.post<RawStudyInputCreateResponse>("/study-inputs", payload);
  return normalizeStudyInputCreate(response.data);
}

export async function uploadSourceImage(payload: StudyInputSourceImageUploadPayload) {
  const response = await apiClient.post<RawStudyInputSourceImageUploadResponse>("/study-inputs/source-images", payload);
  return response.data;
}

export async function deleteSourceImage(sourceImageRef: string) {
  await apiClient.delete(`/study-inputs/source-images/${sourceImageRef}`);
}

export async function redactStudyInputSource(studyInputId: string) {
  await apiClient.post(`/study-inputs/${studyInputId}/redact-source`);
}

export async function generateQuestions(payload: QuestionGenerateRequest) {
  const response = await apiClient.post<RawQuestionGenerateResponse>("/questions/generate", payload, {
    timeout: 60000,
  });
  return { questions: response.data.questions.map(normalizeQuestion) };
}

export async function startQuestionGenerationJob(payload: QuestionGenerateRequest) {
  const response = await apiClient.post<RawQuestionGenerationJobResponse>("/questions/jobs", payload);
  return normalizeQuestionGenerationJob(response.data);
}

export async function fetchQuestionGenerationJob(jobId: string) {
  const response = await apiClient.get<RawQuestionGenerationJobResponse>(`/questions/jobs/${jobId}`);
  return normalizeQuestionGenerationJob(response.data);
}

export async function waitForQuestionGenerationJob(
  jobId: string,
  options?: {
    isCancelled?: () => boolean;
  },
) {
  const startedAt = Date.now();

  while (true) {
    if (options?.isCancelled?.()) {
      throw new Error("question_generation_cancelled");
    }

    if (Date.now() - startedAt > QUESTION_GENERATION_JOB_TIMEOUT_MS) {
      throw new Error("question_generation_job_timeout");
    }

    const job = await fetchQuestionGenerationJob(jobId);
    if (job.status === "succeeded") {
      return job;
    }
    if (job.status === "failed") {
      throw new Error(job.error_message ?? "question_generation_job_failed");
    }

    await new Promise((resolve) => setTimeout(resolve, QUESTION_GENERATION_POLL_INTERVAL_MS));
  }
}

export async function extractStudyInput(payload: StudyInputExtractRequest) {
  const response = await apiClient.post<RawStudyInputExtractResponse>("/study-inputs/extract", payload);
  return response.data;
}

export async function startStudyInputExtractJob(payload: StudyInputExtractRequest) {
  const response = await apiClient.post<RawStudyInputExtractJobResponse>("/study-inputs/extract/jobs", payload);
  return response.data;
}

export async function fetchStudyInputExtractJob(jobId: string) {
  const response = await apiClient.get<RawStudyInputExtractJobResponse>(`/study-inputs/extract/jobs/${jobId}`);
  return response.data;
}

export async function waitForStudyInputExtractJob(
  jobId: string,
  options?: {
    isCancelled?: () => boolean;
  },
) {
  const startedAt = Date.now();

  while (true) {
    if (options?.isCancelled?.()) {
      throw new Error("study_input_extract_job_cancelled");
    }

    if (Date.now() - startedAt > STUDY_INPUT_EXTRACT_JOB_TIMEOUT_MS) {
      throw new Error("study_input_extract_job_timeout");
    }

    const job = await fetchStudyInputExtractJob(jobId);
    if (job.status === "succeeded") {
      return job;
    }
    if (job.status === "failed") {
      throw new Error(job.error_message ?? "study_input_extract_job_failed");
    }

    await new Promise((resolve) => setTimeout(resolve, STUDY_INPUT_EXTRACT_JOB_POLL_INTERVAL_MS));
  }
}
