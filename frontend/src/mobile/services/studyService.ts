import { apiClient } from "./api";
import type {
  ExtractedPoint,
  Question,
  Topic,
} from "../types/api";
import {
  StudyInputCreateRequestInput_type,
  StudyInputCreateRequestSource_kindAnyOf0,
  StudyInputExtractRequestSource_type,
} from "../types/generated-api";
import type { components } from "../types/generated-api";

type QuestionGenerateRequest = components["schemas"]["QuestionGenerateRequest"];
type RawQuestionGenerateResponse = components["schemas"]["QuestionGenerateResponse"];
type RawQuestionGenerationJobResponse = components["schemas"]["QuestionGenerationJobResponse"];
type RawStudyInputCreateRequest = components["schemas"]["StudyInputCreateRequest"];
type RawStudyInputCreateResponse = components["schemas"]["StudyInputCreateResponse"];
type RawStudyInputExtractRequest = components["schemas"]["StudyInputExtractRequest"];
type RawStudyInputExtractResponse = components["schemas"]["StudyInputExtractResponse"];
type RawStudyInputExtractJobResponse = components["schemas"]["StudyInputExtractJobResponse"];
type StudyInputSourceImageUploadRequest = components["schemas"]["StudyInputSourceImageUploadRequest"];
type RawStudyInputSourceImageUploadResponse = components["schemas"]["StudyInputSourceImageUploadResponse"];
type StudyInputSourceImageUploadResponse = {
  source_image_ref: string;
};
type StudyInputExtractResponse = {
  source_preview: string;
  points: ExtractedPoint[];
};
type StudyInputExtractJobStatus = "queued" | "running" | "succeeded" | "failed";
type StudyInputExtractJobResponse = {
  job_id: string;
  status: StudyInputExtractJobStatus;
  source_preview?: string | null;
  points?: ExtractedPoint[] | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
};
type QuestionGenerationJobStatus = "queued" | "running" | "succeeded" | "failed";
type QuestionGenerationJobResponse = {
  job_id: string;
  status: QuestionGenerationJobStatus;
  questions?: Question[];
  error_message?: string | null;
  created_at: string;
  updated_at: string;
};

type StudyInputCreateRequest = {
  input_type: "keywords" | "notes";
  content: string[] | string;
  starred_indices?: number[];
  source_kind?: "photo" | "manual" | null;
  source_preview_text?: string | null;
  source_image_ref?: string | null;
};
type StudyInputExtractRequest = {
  source_type: "text" | "image";
  source_text?: string;
  image_base64?: string;
  image_mime_type?: string;
};
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

function normalizeQuestionGenerationJob(job: RawQuestionGenerationJobResponse): QuestionGenerationJobResponse {
  return {
    ...job,
    questions: job.questions?.map(normalizeQuestion),
  };
}

function normalizeStudyInputCreate(response: RawStudyInputCreateResponse): StudyInputCreateResult {
  return {
    ...response,
    source_kind: response.source_kind as StudyInputCreateResult["source_kind"],
  };
}

function toStudyInputCreateRequest(payload: StudyInputCreateRequest): RawStudyInputCreateRequest {
  return {
    ...payload,
    input_type:
      payload.input_type === "keywords"
        ? StudyInputCreateRequestInput_type.keywords
        : StudyInputCreateRequestInput_type.notes,
    source_kind:
      payload.source_kind == null
        ? payload.source_kind
        : payload.source_kind === "photo"
          ? StudyInputCreateRequestSource_kindAnyOf0.photo
          : StudyInputCreateRequestSource_kindAnyOf0.manual,
  };
}

function toStudyInputExtractRequest(payload: StudyInputExtractRequest): RawStudyInputExtractRequest {
  return {
    ...payload,
    source_type:
      payload.source_type === "text"
        ? StudyInputExtractRequestSource_type.text
        : StudyInputExtractRequestSource_type.image,
  };
}

export async function createStudyInput(payload: StudyInputCreateRequest) {
  const response = await apiClient.post<RawStudyInputCreateResponse>("/study-inputs", toStudyInputCreateRequest(payload));
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
  const response = await apiClient.post<RawStudyInputExtractResponse>("/study-inputs/extract", toStudyInputExtractRequest(payload));
  return response.data;
}

export async function startStudyInputExtractJob(payload: StudyInputExtractRequest) {
  const response = await apiClient.post<RawStudyInputExtractJobResponse>(
    "/study-inputs/extract/jobs",
    toStudyInputExtractRequest(payload),
  );
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
