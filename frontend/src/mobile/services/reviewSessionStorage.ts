import * as SecureStore from "expo-secure-store";

import type { Question } from "../types/models";

const REVIEW_SESSION_KEY = "nightrecall.review-session";

export type PersistedReviewSession = {
  dateKey: string;
  sessionQuestions: Question[];
  sessionIndex: number;
  sessionSource: "server" | "local" | null;
  tonightQuestion: Question | null;
  currentQuestion: Question | null;
  retryQuestion: Question | null;
  retryUsed: boolean;
  currentQuestionMode: "normal" | "retry";
};

export function localDateKey(date = new Date()) {
  return date.toLocaleDateString("en-CA");
}

export async function saveReviewSession(session: PersistedReviewSession) {
  await SecureStore.setItemAsync(REVIEW_SESSION_KEY, JSON.stringify(session));
}

export async function loadReviewSession(): Promise<PersistedReviewSession | null> {
  const raw = await SecureStore.getItemAsync(REVIEW_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PersistedReviewSession;
  } catch {
    await SecureStore.deleteItemAsync(REVIEW_SESSION_KEY);
    return null;
  }
}

export async function clearReviewSession() {
  await SecureStore.deleteItemAsync(REVIEW_SESSION_KEY);
}
