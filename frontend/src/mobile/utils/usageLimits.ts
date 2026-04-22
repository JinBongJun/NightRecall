export type UsageLimitReason = "photo_extract" | "question_generation_daily" | "question_generation_monthly";

export function asUsageLimitReason(detail: string | null | undefined): UsageLimitReason | null {
  if (!detail) {
    return null;
  }
  if (detail === "photo_extraction_limit_reached") {
    return "photo_extract";
  }
  if (detail === "question_generation_daily_limit_reached") {
    return "question_generation_daily";
  }
  if (detail === "question_generation_monthly_limit_reached") {
    return "question_generation_monthly";
  }
  return null;
}
