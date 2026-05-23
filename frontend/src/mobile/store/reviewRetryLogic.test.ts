import { describe, expect, it } from "vitest";

import type { Question } from "../types/models";
import {
  appendMissedQuestion,
  hasMissedRetries,
  hasMoreRetriesAfterCurrent,
  mainRemaining,
  pendingRetryCount,
  pluralQuestion,
  retryPassComplete,
} from "./reviewRetryLogic";

const sampleQuestion = (id: string): Question => ({
  id,
  question_text: `Question ${id}`,
  question_type: "mcq",
  choices: ["A", "B"],
});

describe("reviewRetryLogic", () => {
  it("computes main remaining questions", () => {
    expect(mainRemaining([], 0)).toBe(0);
    expect(mainRemaining([sampleQuestion("1"), sampleQuestion("2"), sampleQuestion("3")], 0)).toBe(2);
    expect(mainRemaining([sampleQuestion("1"), sampleQuestion("2"), sampleQuestion("3")], 2)).toBe(0);
  });

  it("dedupes missed questions by id", () => {
    const first = sampleQuestion("1");
    expect(appendMissedQuestion([], first)).toEqual([first]);
    expect(appendMissedQuestion([first], first)).toEqual([first]);
    expect(appendMissedQuestion([first], sampleQuestion("2")).map((q) => q.id)).toEqual(["1", "2"]);
  });

  it("tracks retry pass completion", () => {
    const missed = [sampleQuestion("1"), sampleQuestion("2")];
    expect(hasMissedRetries(missed)).toBe(true);
    expect(pendingRetryCount(missed, 0, "main")).toBe(2);
    expect(pendingRetryCount(missed, 0, "retry")).toBe(1);
    expect(hasMoreRetriesAfterCurrent(missed, 0, "retry")).toBe(true);
    expect(retryPassComplete(missed, 0, "retry")).toBe(false);
    expect(hasMoreRetriesAfterCurrent(missed, 1, "retry")).toBe(false);
    expect(retryPassComplete(missed, 1, "retry")).toBe(true);
  });

  it("pluralizes question copy", () => {
    expect(pluralQuestion(1)).toBe("question");
    expect(pluralQuestion(2)).toBe("questions");
  });
});
