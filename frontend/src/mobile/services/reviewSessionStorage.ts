import * as SecureStore from "expo-secure-store";

import type { Question } from "../types/models";
import type { ReviewPhase } from "../store/reviewRetryLogic";

const REVIEW_SESSION_KEY = "nightrecall.review-session";

export type PersistedReviewSession = {
  dateKey: string;
  sessionQuestions: Question[];
  sessionIndex: number;
  sessionSource: "server" | "local" | null;
  tonightQuestion: Question | null;
  currentQuestion: Question | null;
  currentQuestionMode: "normal" | "retry";
  sessionPhase: ReviewPhase;
  missedQuestions: Question[];
  retryIndex: number;
};

type LegacyPersistedReviewSession = Partial<PersistedReviewSession> & {
  retryQuestion?: Question | null;
  retryUsed?: boolean;
};

export function localDateKey(date = new Date()) {
  return date.toLocaleDateString("en-CA");
}

export function normalizePersistedReviewSession(raw: unknown): PersistedReviewSession | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const session = raw as LegacyPersistedReviewSession;
  if (
    typeof session.dateKey !== "string" ||
    !Array.isArray(session.sessionQuestions) ||
    typeof session.sessionIndex !== "number"
  ) {
    return null;
  }

  if (session.sessionPhase && Array.isArray(session.missedQuestions)) {
    return {
      dateKey: session.dateKey,
      sessionQuestions: session.sessionQuestions,
      sessionIndex: session.sessionIndex,
      sessionSource: session.sessionSource ?? null,
      tonightQuestion: session.tonightQuestion ?? null,
      currentQuestion: session.currentQuestion ?? null,
      currentQuestionMode: session.currentQuestionMode ?? "normal",
      sessionPhase: session.sessionPhase,
      missedQuestions: session.missedQuestions,
      retryIndex: session.retryIndex ?? 0,
    };
  }

  const legacyMissed =
    session.retryQuestion && !session.retryUsed ? [session.retryQuestion] : [];
  const sessionPhase: ReviewPhase =
    session.currentQuestionMode === "retry" && legacyMissed.length ? "retry" : "main";

  return {
    dateKey: session.dateKey,
    sessionQuestions: session.sessionQuestions,
    sessionIndex: session.sessionIndex,
    sessionSource: session.sessionSource ?? null,
    tonightQuestion: session.tonightQuestion ?? null,
    currentQuestion: session.currentQuestion ?? null,
    currentQuestionMode: session.currentQuestionMode ?? "normal",
    sessionPhase,
    missedQuestions: legacyMissed,
    retryIndex: 0,
  };
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
    return normalizePersistedReviewSession(JSON.parse(raw));
  } catch {
    await SecureStore.deleteItemAsync(REVIEW_SESSION_KEY);
    return null;
  }
}

export async function clearReviewSession() {
  await SecureStore.deleteItemAsync(REVIEW_SESSION_KEY);
}
