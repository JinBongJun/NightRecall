import type { ReviewPhase } from "../store/reviewRetryLogic";
import type { Question } from "../types/models";
import type { ReviewMode } from "../types/domain";
import type { ReviewKind } from "./reviewAttemptKind";

export const NIGHTLY_REMINDER_KEY = "nightly-reminder";

export type NightlyReminderDestination =
  | { screen: "review"; mode: ReviewMode }
  | { screen: "home" };

type ReviewSessionSnapshot = {
  currentQuestion: Question | null;
  sessionQuestions: Question[];
  sessionPhase: ReviewPhase;
  missedQuestions: Question[];
  reviewKind: ReviewKind;
};

export function hasResumableReviewSession(state: Pick<
  ReviewSessionSnapshot,
  "currentQuestion" | "sessionQuestions" | "sessionPhase" | "missedQuestions"
>): boolean {
  if (state.currentQuestion) {
    return true;
  }
  if (state.sessionQuestions.length > 0) {
    return true;
  }
  if (state.sessionPhase === "retry" && state.missedQuestions.length > 0) {
    return true;
  }
  return false;
}

export function resolveNightlyReminderDestination(state: ReviewSessionSnapshot): NightlyReminderDestination {
  if (hasResumableReviewSession(state)) {
    return {
      screen: "review",
      mode: state.reviewKind === "practice" ? "picked" : "auto",
    };
  }
  return { screen: "home" };
}
