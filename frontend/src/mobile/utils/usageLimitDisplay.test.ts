import { describe, expect, it } from "vitest";

import type { UsageLimits } from "../services/usageService";
import type { UsageLimitsLoadState } from "../hooks/useUsageLimits";
import {
  formatAddAnotherLabel,
  formatTonightLimitsLine,
  formatRemainingCount,
  isQuestionGenerationFull,
  isUsageLimitsReady,
  remainingQuestionGenerationsWhenReady,
} from "./usageLimitDisplay";

const limits: UsageLimits = {
  question_generation_daily: { remaining: 2, limit: 3, used: 1 },
  question_generation_monthly: { remaining: 10, limit: 30, used: 20 },
  photo_extract_daily: { remaining: 1, limit: 3, used: 2 },
};

describe("usageLimitDisplay", () => {
  it("formats unknown counts as em dash", () => {
    expect(formatRemainingCount(null)).toBe("—");
  });

  it("formats add-another copy from remaining questions", () => {
    expect(formatAddAnotherLabel(2)).toBe("Capture another (2 left)");
    expect(formatAddAnotherLabel(null)).toBe("Capture another");
    expect(formatAddAnotherLabel(0)).toBe("");
  });

  it("formats tonight limits line when data is available", () => {
    expect(formatTonightLimitsLine(limits)).toBe("2 questions · 1 photo read left tonight");
    expect(formatTonightLimitsLine(null)).toBeNull();
    expect(formatTonightLimitsLine(null, "error")).toBe("Usage limits unavailable. Try again in a moment.");
    expect(formatTonightLimitsLine(null, "loading")).toBe("Checking tonight's limits...");
  });

  it("treats unknown limits as blocked for generation", () => {
    expect(isUsageLimitsReady("ready")).toBe(true);
    expect(remainingQuestionGenerationsWhenReady(limits, "error")).toBe(0);
    expect(isQuestionGenerationFull(limits, "error")).toBe(true);
  });
});
