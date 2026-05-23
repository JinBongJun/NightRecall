import type { Question } from "../types/models";

export type ReviewPhase = "main" | "retry";

export function mainRemaining(sessionQuestions: Question[], sessionIndex: number): number {
  if (!sessionQuestions.length) {
    return 0;
  }
  return Math.max(0, sessionQuestions.length - (sessionIndex + 1));
}

export function appendMissedQuestion(missedQuestions: Question[], question: Question): Question[] {
  if (missedQuestions.some((item) => item.id === question.id)) {
    return missedQuestions;
  }
  return [...missedQuestions, question];
}

export function hasMissedRetries(missedQuestions: Question[]): boolean {
  return missedQuestions.length > 0;
}

export function pendingRetryCount(
  missedQuestions: Question[],
  retryIndex: number,
  sessionPhase: ReviewPhase,
): number {
  if (sessionPhase !== "retry") {
    return missedQuestions.length;
  }
  return Math.max(0, missedQuestions.length - (retryIndex + 1));
}

export function retryPassComplete(
  missedQuestions: Question[],
  retryIndex: number,
  sessionPhase: ReviewPhase,
): boolean {
  if (sessionPhase !== "retry" || !missedQuestions.length) {
    return false;
  }
  return retryIndex >= missedQuestions.length - 1;
}

export function hasMoreRetriesAfterCurrent(
  missedQuestions: Question[],
  retryIndex: number,
  sessionPhase: ReviewPhase,
): boolean {
  if (sessionPhase !== "retry" || !missedQuestions.length) {
    return false;
  }
  return retryIndex < missedQuestions.length - 1;
}

export function pluralQuestion(count: number): string {
  return count === 1 ? "question" : "questions";
}
