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

export function formatAddAnotherLabel(remaining: number | null): string {
  if (remaining === null) {
    return "Capture another";
  }
  if (remaining <= 0) {
    return "";
  }
  return `Capture another (${remaining} left)`;
}

export function formatTonightLimitsLine(usageLimits: UsageLimits | null): string | null {
  const remainingQuestions = remainingQuestionGenerations(usageLimits);
  const remainingPhotos = remainingPhotoReads(usageLimits);

  if (remainingQuestions === null && remainingPhotos === null) {
    return null;
  }

  const questionPart =
    remainingQuestions === null
      ? null
      : `${remainingQuestions} question${remainingQuestions === 1 ? "" : "s"}`;
  const photoPart =
    remainingPhotos === null
      ? null
      : `${remainingPhotos} photo read${remainingPhotos === 1 ? "" : "s"}`;

  const parts = [questionPart, photoPart].filter(Boolean);
  return parts.length ? `${parts.join(" · ")} left tonight` : null;
}
