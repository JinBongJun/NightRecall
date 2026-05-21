import type { Question } from "../types/models";

export const MAX_SESSION_QUESTIONS = 3;

export function capSessionQuestions(questions: Question[]) {
  return questions.filter(Boolean).slice(0, MAX_SESSION_QUESTIONS);
}

export function mergeSessionQuestions(existingQuestions: Question[], incomingQuestions: Question[]) {
  const incoming = incomingQuestions.filter(Boolean);
  if (!incoming.length) {
    return existingQuestions;
  }

  return capSessionQuestions([...existingQuestions, ...incoming]);
}
