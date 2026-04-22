import { apiClient } from "./api";
import { StudyInputExtractResponse, Topic } from "../types/api";

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
  const response = await apiClient.post("/questions/generate", payload);
  return response.data;
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
