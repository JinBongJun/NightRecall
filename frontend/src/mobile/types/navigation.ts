export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  QuestionSource: undefined;
  Capture: undefined;
  CaptureNote: undefined;
  Processing: {
    mode: "photo" | "manual";
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
  MakeQuestions: {
    mode: "photo" | "manual";
    sourceText: string;
    extractedPoints?: string[];
    imageUri?: string;
    imageBase64?: string;
    imageMimeType?: string;
  };
  QuestionGenerating:
    | {
        variant: "new";
        mode: "photo" | "manual";
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
  SavedMakeQuestions: {
    studyInputId?: string;
    topicId?: string;
  };
  Review: { mode?: "auto" | "picked" } | undefined;
  Result: undefined;
  Stats: undefined;
  Settings: undefined;
  PrivacyPolicy: undefined;
  Profile: undefined;
};
