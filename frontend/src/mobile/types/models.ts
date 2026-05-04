// App-facing models used by screens, stores, and service normalization.

export type Topic = {
  id: string;
  text: string;
  topic_text?: string;
  is_starred: boolean;
};

export type SavedTopicSource = {
  topic_id: string;
  study_input_id: string;
  input_type: "keywords" | "notes";
  source_kind?: "photo" | "manual" | null;
  source_preview_text?: string | null;
  source_image_ref?: string | null;
  topics: Topic[];
};

export type SavedStudyInputSummary = {
  study_input_id: string;
  input_type: "keywords" | "notes";
  source_kind?: "photo" | "manual" | null;
  source_preview_text?: string | null;
  source_image_ref?: string | null;
  title: string;
  preview: string;
  bookmarked_count: number;
  topic_id: string;
};

export type SavedStudyInputsResponse = {
  items: SavedStudyInputSummary[];
  page: number;
  limit: number;
  has_more: boolean;
  total_count: number;
};

export type SavedStudyInputDetail = {
  study_input_id: string;
  input_type: "keywords" | "notes";
  source_kind?: "photo" | "manual" | null;
  source_preview_text?: string | null;
  source_image_ref?: string | null;
  topics: Topic[];
};

export type ExtractedPoint = {
  text: string;
};

export type Question = {
  id: string;
  question_type: "mcq" | "true_false" | "fill_blank";
  question_text: string;
  choices: string[] | null;
  answer_index: number | null;
  answer_text: string | null;
  explanation: string;
  resurface_reason?: "missed_before" | null;
};

export type AnswerResponse = {
  is_correct: boolean;
  correct_index: number | null;
  correct_text: string | null;
  explanation: string;
  current_streak: number;
};
