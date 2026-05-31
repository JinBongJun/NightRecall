import { describe, expect, it } from "vitest";

import { isChoiceQuestionType } from "./questionType";

describe("questionType", () => {
  it("accepts mcq and true_false", () => {
    expect(isChoiceQuestionType("mcq")).toBe(true);
    expect(isChoiceQuestionType("true_false")).toBe(true);
  });

  it("rejects legacy fill_blank", () => {
    expect(isChoiceQuestionType("fill_blank")).toBe(false);
  });
});
