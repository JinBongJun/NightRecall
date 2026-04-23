import { apiClient } from "./api";
import { QuestionGenerationJobResponse, StudyInputExtractResponse, StudyInputExtractJobResponse, Topic } from "../types/api";

const QUESTION_GENERATION_POLL_INTERVAL_MS = 1500;
const QUESTION_GENERATION_JOB_TIMEOUT_MS = 180000;
const STUDY_INPUT_EXTRACT_JOB_POLL_INTERVAL_MS = 1500;
const STUDY_INPUT_EXTRACT_JOB_TIMEOUT_MS = 180000;

export async function createStudyInput(payload: {
  input_type: "keywords" | "notes";
  content: string[] | string;
  starred_indices: number[];
  source_kind?: "photo" | "manual";
  source_preview_text?: string;
  source_image_data?: string;
}) {
  const response = await apiClient.post("/study-inputs", payload);
  return response.data as {
    study_input_id: string;
    topics: Topic[];
    source_kind?: "photo" | "manual" | null;
    source_preview_text?: string | null;
    source_image_data?: string | null;
  };
}

export async function redactStudyInputSource(studyInputId: string) {
  await apiClient.post(`/study-inputs/${studyInputId}/redact-source`);
}

export async function generateQuestions(payload: { study_input_id: string; count: number }) {
  const response = await apiClient.post("/questions/generate", payload, {
    timeout: 60000,
  });
  return response.data;
}

export async function startQuestionGenerationJob(payload: { study_input_id: string; count: number }) {
  const response = await apiClient.post("/questions/jobs", payload);
  return response.data as QuestionGenerationJobResponse;
}

export async function fetchQuestionGenerationJob(jobId: string) {
  const response = await apiClient.get(`/questions/jobs/${jobId}`);
  return response.data as QuestionGenerationJobResponse;
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

export async function extractStudyInput(payload: {
  source_type: "text" | "image";
  source_text?: string;
  image_base64?: string;
  image_mime_type?: string;
}) {
  const response = await apiClient.post("/study-inputs/extract", payload);
  return response.data as StudyInputExtractResponse;
}

export async function startStudyInputExtractJob(payload: {
  source_type: "text" | "image";
  source_text?: string;
  image_base64?: string;
  image_mime_type?: string;
}) {
  const response = await apiClient.post("/study-inputs/extract/jobs", payload);
  return response.data as StudyInputExtractJobResponse;
}

export async function fetchStudyInputExtractJob(jobId: string) {
  const response = await apiClient.get(`/study-inputs/extract/jobs/${jobId}`);
  return response.data as StudyInputExtractJobResponse;
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
