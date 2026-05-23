import type { ReviewPhase } from "../store/reviewRetryLogic";
import { AnswerSubmitRequestAttempt_kind } from "../types/generated-api";

export type ReviewKind = "ritual" | "practice";

export function resolveAttemptKind(reviewKind: ReviewKind, sessionPhase: ReviewPhase): AnswerSubmitRequestAttempt_kind {
  if (reviewKind === "practice") {
    return AnswerSubmitRequestAttempt_kind.practice;
  }
  return sessionPhase === "retry"
    ? AnswerSubmitRequestAttempt_kind.ritual_retry
    : AnswerSubmitRequestAttempt_kind.ritual_main;
}
