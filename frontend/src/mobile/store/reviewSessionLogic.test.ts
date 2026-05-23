import { describe, expect, it } from "vitest";

import type { Question } from "../types/models";
import { MAX_SESSION_QUESTIONS, capSessionQuestions, mergeSessionQuestions } from "./reviewSessionLogic";

const sampleQuestion = (id: string): Question => ({
  id,
  question_text: `Question ${id}`,
  question_type: "mcq",
  choices: ["A", "B"],
});

describe("reviewSessionLogic", () => {
  it("caps session questions at three", () => {
    const merged = mergeSessionQuestions(
      [sampleQuestion("1"), sampleQuestion("2")],
      [sampleQuestion("3"), sampleQuestion("4")],
    );

    expect(merged).toHaveLength(MAX_SESSION_QUESTIONS);
    expect(merged.map((question) => question.id)).toEqual(["1", "2", "3"]);
  });

  it("returns the existing list when no incoming questions are provided", () => {
    const existing = [sampleQuestion("1")];
    expect(mergeSessionQuestions(existing, [])).toEqual(existing);
    expect(capSessionQuestions(existing)).toEqual(existing);
  });
});
