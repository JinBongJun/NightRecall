import type { QuestionType } from "../types/domain";

export function isChoiceQuestionType(questionType: string): questionType is QuestionType {
  return questionType === "mcq" || questionType === "true_false";
}
