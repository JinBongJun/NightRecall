import { describe, expect, it } from "vitest";

import type { Question } from "../types/models";
import {
  hasResumableReviewSession,
  resolveNightlyReminderDestination,
} from "./nightlyReminderNavigation";

const sampleQuestion = { id: "q-1" } as Question;

describe("nightlyReminderNavigation", () => {
  it("detects an in-progress question", () => {
    expect(
      hasResumableReviewSession({
        currentQuestion: sampleQuestion,
        sessionQuestions: [],
        sessionPhase: "main",
        missedQuestions: [],
      }),
    ).toBe(true);
  });

  it("detects a queued local session without a current question", () => {
    expect(
      hasResumableReviewSession({
        currentQuestion: null,
        sessionQuestions: [sampleQuestion],
        sessionPhase: "main",
        missedQuestions: [],
      }),
    ).toBe(true);
  });

  it("detects a retry pass waiting to start", () => {
    expect(
      hasResumableReviewSession({
        currentQuestion: null,
        sessionQuestions: [],
        sessionPhase: "retry",
        missedQuestions: [sampleQuestion],
      }),
    ).toBe(true);
  });

  it("routes to review with ritual mode when a session can resume", () => {
    expect(
      resolveNightlyReminderDestination({
        currentQuestion: sampleQuestion,
        sessionQuestions: [],
        sessionPhase: "main",
        missedQuestions: [],
        reviewKind: "ritual",
      }),
    ).toEqual({ screen: "review", mode: "auto" });
  });

  it("routes to review with practice mode for library sessions", () => {
    expect(
      resolveNightlyReminderDestination({
        currentQuestion: sampleQuestion,
        sessionQuestions: [],
        sessionPhase: "main",
        missedQuestions: [],
        reviewKind: "practice",
      }),
    ).toEqual({ screen: "review", mode: "picked" });
  });

  it("falls back to home when nothing is in progress", () => {
    expect(
      resolveNightlyReminderDestination({
        currentQuestion: null,
        sessionQuestions: [],
        sessionPhase: "main",
        missedQuestions: [],
        reviewKind: "ritual",
      }),
    ).toEqual({ screen: "home" });
  });
});
