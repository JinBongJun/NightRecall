import { describe, expect, it } from "vitest";

import { AnswerSubmitRequestAttempt_kind } from "../types/generated-api";
import { resolveAttemptKind } from "./reviewAttemptKind";

describe("resolveAttemptKind", () => {
  it("maps ritual main pass to ritual_main", () => {
    expect(resolveAttemptKind("ritual", "main")).toBe(AnswerSubmitRequestAttempt_kind.ritual_main);
  });

  it("maps ritual retry pass to ritual_retry", () => {
    expect(resolveAttemptKind("ritual", "retry")).toBe(AnswerSubmitRequestAttempt_kind.ritual_retry);
  });

  it("maps practice sessions to practice", () => {
    expect(resolveAttemptKind("practice", "main")).toBe(AnswerSubmitRequestAttempt_kind.practice);
    expect(resolveAttemptKind("practice", "retry")).toBe(AnswerSubmitRequestAttempt_kind.practice);
  });
});
