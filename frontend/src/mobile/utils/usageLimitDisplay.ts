import type { UsageLimits } from "../services/usageService";

export function remainingQuestionGenerations(usageLimits: UsageLimits | null): number | null {
  return usageLimits?.question_generation_daily.remaining ?? null;
}

export function remainingPhotoReads(usageLimits: UsageLimits | null): number | null {
  return usageLimits?.photo_extract_daily.remaining ?? null;
}

export function formatRemainingCount(value: number | null): string {
  return value === null ? "—" : String(value);
}

export function isQuestionGenerationFull(usageLimits: UsageLimits | null): boolean {
  const remaining = remainingQuestionGenerations(usageLimits);
  return remaining !== null && remaining <= 0;
}
