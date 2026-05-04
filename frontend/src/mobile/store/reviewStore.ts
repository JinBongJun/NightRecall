import { create } from "zustand";

import { AnswerResponse, Question, Topic } from "../types/models";

type ReviewState = {
  sessionQuestions: Question[];
  sessionIndex: number;
  sessionSource: "server" | "local" | null;
  tonightQuestion: Question | null;
  currentQuestion: Question | null;
  retryQuestion: Question | null;
  retryUsed: boolean;
  currentQuestionMode: "normal" | "retry";
  pickableTopics: Topic[];
  selectedChoice: number | null;
  fillBlankAnswer: string;
  result: AnswerResponse | null;
  loading: boolean;
  error: string | null;
  setSessionQuestions: (questions: Question[]) => void;
  addSessionQuestions: (questions: Question[]) => void;
  advanceSessionQuestion: () => boolean;
  queueRetryQuestion: (question: Question) => void;
  consumeRetryQuestion: () => boolean;
  resetSession: () => void;
  setTonightQuestion: (question: Question | null) => void;
  setServerTonightQuestion: (question: Question | null) => void;
  setPickableTopics: (topics: Topic[]) => void;
  setSelectedChoice: (choice: number | null) => void;
  setFillBlankAnswer: (value: string) => void;
  setResult: (result: AnswerResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetReview: () => void;
};

const defaultReviewState = {
  sessionQuestions: [],
  sessionIndex: 0,
  sessionSource: null,
  tonightQuestion: null,
  currentQuestion: null,
  retryQuestion: null,
  retryUsed: false,
  currentQuestionMode: "normal" as const,
  pickableTopics: [],
  selectedChoice: null,
  fillBlankAnswer: "",
  result: null,
  loading: false,
  error: null,
};

export const useReviewStore = create<ReviewState>((set) => ({
  ...defaultReviewState,
  setSessionQuestions: (questions) =>
    set(() => {
      const sanitized = questions.filter(Boolean).slice(0, 3);
      return {
        sessionQuestions: sanitized,
        sessionIndex: 0,
        sessionSource: "local",
        tonightQuestion: sanitized[0] ?? null,
        currentQuestion: sanitized[0] ?? null,
        retryQuestion: null,
        retryUsed: false,
        currentQuestionMode: "normal",
        selectedChoice: null,
        fillBlankAnswer: "",
      };
    }),
  addSessionQuestions: (questions) =>
    set((state) => {
      const incoming = questions.filter(Boolean);
      if (!incoming.length) {
        return state;
      }

      const existingQuestions = state.sessionQuestions.length
        ? state.sessionQuestions
        : state.currentQuestion
          ? [state.currentQuestion]
          : [];
      // Multiple generation sessions can happen in a night; the server enforces limits.
      const nextQuestions = [...existingQuestions, ...incoming];
      const nextIndex = Math.min(state.sessionIndex, Math.max(0, nextQuestions.length - 1));

      return {
        sessionQuestions: nextQuestions,
        sessionIndex: nextIndex,
        sessionSource: "local",
        tonightQuestion: nextQuestions[0] ?? null,
        currentQuestion: nextQuestions[nextIndex] ?? null,
        currentQuestionMode: "normal",
        selectedChoice: null,
        fillBlankAnswer: "",
      };
    }),
  advanceSessionQuestion: () => {
    let advanced = false;
    set((state) => {
      const nextIndex = state.sessionIndex + 1;
      if (nextIndex >= state.sessionQuestions.length) {
        return state;
      }
      advanced = true;
      return {
        sessionIndex: nextIndex,
        currentQuestion: state.sessionQuestions[nextIndex] ?? null,
        currentQuestionMode: "normal",
        selectedChoice: null,
        fillBlankAnswer: "",
      };
    });
    return advanced;
  },
  queueRetryQuestion: (question) =>
    set((state) => {
      if (state.retryQuestion || state.retryUsed) {
        return state;
      }

      return {
        retryQuestion: question,
      };
    }),
  consumeRetryQuestion: () => {
    let consumed = false;
    set((state) => {
      if (!state.retryQuestion || state.retryUsed) {
        return state;
      }

      consumed = true;
      return {
        currentQuestion: state.retryQuestion,
        currentQuestionMode: "retry",
        retryQuestion: null,
        retryUsed: true,
        selectedChoice: null,
        fillBlankAnswer: "",
      };
    });
    return consumed;
  },
  resetSession: () =>
    set(() => ({
      ...defaultReviewState,
      pickableTopics: useReviewStore.getState().pickableTopics,
    })),
  resetReview: () =>
    set(() => ({
      ...defaultReviewState,
    })),
  setTonightQuestion: (question) =>
    set(() => ({
      sessionSource: question ? "local" : null,
      tonightQuestion: question,
      currentQuestion: question,
      currentQuestionMode: "normal",
      selectedChoice: null,
      fillBlankAnswer: "",
    })),
  setServerTonightQuestion: (question) =>
    set((state) => {
      if (state.sessionSource === "local") {
        return state;
      }

      return {
        sessionSource: question ? "server" : null,
        tonightQuestion: question,
        currentQuestion: question,
        currentQuestionMode: "normal",
        selectedChoice: null,
        fillBlankAnswer: "",
      };
    }),
  setPickableTopics: (topics) => set({ pickableTopics: topics }),
  setSelectedChoice: (selectedChoice) => set({ selectedChoice }),
  setFillBlankAnswer: (fillBlankAnswer) => set({ fillBlankAnswer }),
  setResult: (result) => set({ result }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
