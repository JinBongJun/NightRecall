import type { NavigatorScreenParams } from "@react-navigation/native";

import type { CaptureMode, ReviewMode } from "../types/domain";

export type EditPointsParams =
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

export type QuestionGeneratingParams =
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

export type UsageLimitParams =
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

export type CaptureStackParamList = {
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
  UsageLimit: UsageLimitParams;
  EditPoints: EditPointsParams;
  QuestionGenerating: QuestionGeneratingParams;
};

export type HomeStackParamList = {
  Home: undefined;
  Stats: undefined;
};

export type LibraryStackParamList = {
  Library: undefined;
  EditPoints: Extract<EditPointsParams, { variant: "saved" }>;
};

export type MainTabParamList = {
  CaptureTab: NavigatorScreenParams<CaptureStackParamList> | undefined;
  HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined;
  LibraryTab: NavigatorScreenParams<LibraryStackParamList> | undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Review: { mode?: ReviewMode } | undefined;
  Result: undefined;
  Settings: undefined;
  PrivacyPolicy: undefined;
  RefundPolicy: undefined;
  Account: undefined;
};
