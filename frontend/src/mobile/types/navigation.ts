import type { CaptureMode, ReviewMode } from "./domain";

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Capture: undefined;
  CaptureNote: undefined;
  Processing: {
    mode: CaptureMode;
    sourceText: string;
    imageBase64?: string;
    imageUri?: string;
    imageMimeType?: string;
  };
  ExtractionHelp: {
    mode: "photo";
    sourceText: string;
    imageBase64?: string;
    imageUri?: string;
    imageMimeType?: string;
    detail?: string;
  };
  UsageLimit:
    | {
        reason: "photo_extract";
        sourceText?: string;
        imageUri?: string;
        imageBase64?: string;
        imageMimeType?: string;
      }
    | {
        reason: "question_generation_daily" | "question_generation_monthly";
      };
  EditPoints:
    | {
        variant: "new";
        mode: CaptureMode;
        sourceText: string;
        extractedPoints?: string[];
        imageUri?: string;
        imageBase64?: string;
        imageMimeType?: string;
      }
    | {
        variant: "saved";
        studyInputId?: string;
        topicId?: string;
        selectedTopicIds?: string[];
      };
  QuestionGenerating:
    | {
        variant: "new";
        mode: CaptureMode;
        sourceText: string;
        points: { id: string; text: string; isStarred: boolean }[];
        selectedQuestionCount: number;
        imageBase64?: string;
        imageMimeType?: string;
      }
    | {
        variant: "saved";
        studyInputId?: string;
        topicId?: string;
        selectedTopicIds: string[];
        selectedQuestionCount: number;
      };
  Library: undefined;
  Review: { mode?: ReviewMode } | undefined;
  Result: undefined;
  Stats: undefined;
  Settings: undefined;
  PrivacyPolicy: undefined;
  RefundPolicy: undefined;
  Account: undefined;
};
