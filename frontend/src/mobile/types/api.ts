export type Topic = {
  id: string;
  text: string;
  is_starred: boolean;
};

export type SavedTopicSource = {
  topic_id: string;
  study_input_id: string;
  input_type: "keywords" | "notes";
  raw_content: string;
  source_kind?: "photo" | "manual" | null;
  source_preview_text?: string | null;
  source_image_data?: string | null;
  topics: Topic[];
};

export type SavedStudyInputSummary = {
  study_input_id: string;
  input_type: "keywords" | "notes";
  source_kind?: "photo" | "manual" | null;
  source_preview_text?: string | null;
  source_image_data?: string | null;
  title: string;
  preview: string;
  bookmarked_count: number;
  topic_id: string;
};

export type SavedStudyInputsResponse = {
  items: SavedStudyInputSummary[];
};

export type SavedStudyInputDetail = {
  study_input_id: string;
  input_type: "keywords" | "notes";
  raw_content: string;
  source_kind?: "photo" | "manual" | null;
  source_preview_text?: string | null;
  source_image_data?: string | null;
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

export type TonightQuestionResponse = {
  mode: "auto" | "picked";
  question: Question;
};

export type GeneratedQuestionsResponse = {
  questions: Question[];
};

export type AnswerResponse = {
  is_correct: boolean;
  correct_index: number | null;
  correct_text: string | null;
  explanation: string;
  current_streak: number;
};

export type StatsResponse = {
  current_streak: number;
  total_answered: number;
  correct_count: number;
  accuracy: number;
  recent_wrong_topics: string[];
  answered_today: boolean;
  answered_dates_this_month: string[];
};

export type StudyInputExtractResponse = {
  source_preview: string;
  points: ExtractedPoint[];
};

export type UsageLimitInfo = {
  limit: number;
  used: number;
  remaining: number;
};

export type UsageLimitsResponse = {
  photo_extract_daily: UsageLimitInfo;
  question_generation_daily: UsageLimitInfo;
  question_generation_monthly: UsageLimitInfo;
};

export type PlanName = "free" | "plus";

export type EntitlementsResponse = {
  plan: PlanName;
  billing_enabled: boolean;
};
