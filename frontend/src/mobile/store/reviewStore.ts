import { create } from "zustand";

import {
  clearReviewSession,
  localDateKey,
  normalizePersistedReviewSession,
  saveReviewSession,
  type PersistedReviewSession,
} from "../services/reviewSessionStorage";
import { AnswerResponse, Question, Topic } from "../types/models";
import { capSessionQuestions, mergeSessionQuestions } from "./reviewSessionLogic";
import {
  appendMissedQuestion,
  type ReviewPhase,
} from "./reviewRetryLogic";
import type { ReviewKind } from "../utils/reviewAttemptKind";

export { MAX_SESSION_QUESTIONS } from "./reviewSessionLogic";

type SessionQuestionOptions = {
  reviewKind?: ReviewKind;
};

type ReviewState = {
  sessionQuestions: Question[];
  sessionIndex: number;
  sessionSource: "server" | "local" | null;
  reviewKind: ReviewKind;
  tonightQuestion: Question | null;
  currentQuestion: Question | null;
  sessionPhase: ReviewPhase;
  missedQuestions: Question[];
  retryIndex: number;
  currentQuestionMode: "normal" | "retry";
  pickableTopics: Topic[];
  selectedChoice: number | null;
  fillBlankAnswer: string;
  result: AnswerResponse | null;
  loading: boolean;
  error: string | null;
  setSessionQuestions: (questions: Question[], options?: SessionQuestionOptions) => void;
  addSessionQuestions: (questions: Question[]) => void;
  advanceSessionQuestion: () => boolean;
  recordMissedQuestion: (question: Question) => void;
  beginRetryPass: () => boolean;
  advanceRetryQuestion: () => boolean;
  resetSession: () => void;
  releaseActiveRecall: () => void;
  hydrateFromPersisted: (session: PersistedReviewSession) => void;
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
  reviewKind: "ritual" as ReviewKind,
  tonightQuestion: null,
  currentQuestion: null,
  sessionPhase: "main" as ReviewPhase,
  missedQuestions: [] as Question[],
  retryIndex: 0,
  currentQuestionMode: "normal" as const,
  pickableTopics: [],
  selectedChoice: null,
  fillBlankAnswer: "",
  result: null,
  loading: false,
  error: null,
};

function snapshotFromState(state: ReviewState): PersistedReviewSession | null {
  if (!state.currentQuestion && !state.sessionQuestions.length) {
    return null;
  }

  return {
    dateKey: localDateKey(),
    sessionQuestions: state.sessionQuestions,
    sessionIndex: state.sessionIndex,
    sessionSource: state.sessionSource,
    reviewKind: state.reviewKind,
    tonightQuestion: state.tonightQuestion,
    currentQuestion: state.currentQuestion,
    currentQuestionMode: state.currentQuestionMode,
    sessionPhase: state.sessionPhase,
    missedQuestions: state.missedQuestions,
    retryIndex: state.retryIndex,
  };
}

function syncReviewSessionToStorage() {
  const snapshot = snapshotFromState(useReviewStore.getState());
  if (!snapshot) {
    void clearReviewSession();
    return;
  }

  void saveReviewSession(snapshot);
}

export const useReviewStore = create<ReviewState>((set) => ({
  ...defaultReviewState,
  setSessionQuestions: (questions, options) => {
    set(() => {
      const sanitized = capSessionQuestions(questions);
      const reviewKind = options?.reviewKind ?? "ritual";
      return {
        sessionQuestions: sanitized,
        sessionIndex: 0,
        sessionSource: "local",
        reviewKind,
        tonightQuestion: sanitized[0] ?? null,
        currentQuestion: sanitized[0] ?? null,
        sessionPhase: "main",
        missedQuestions: [],
        retryIndex: 0,
        currentQuestionMode: "normal",
        selectedChoice: null,
        fillBlankAnswer: "",
      };
    });
    syncReviewSessionToStorage();
  },
  addSessionQuestions: (questions) => {
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
      const nextQuestions = mergeSessionQuestions(existingQuestions, incoming);
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
    });
    syncReviewSessionToStorage();
  },
  advanceSessionQuestion: () => {
    let advanced = false;
    set((state) => {
      if (state.sessionPhase !== "main") {
        return state;
      }

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
    if (advanced) {
      syncReviewSessionToStorage();
    }
    return advanced;
  },
  recordMissedQuestion: (question) => {
    set((state) => {
      if (state.sessionPhase !== "main") {
        return state;
      }

      return {
        missedQuestions: appendMissedQuestion(state.missedQuestions, question),
      };
    });
    syncReviewSessionToStorage();
  },
  beginRetryPass: () => {
    let started = false;
    set((state) => {
      if (!state.missedQuestions.length || state.sessionPhase !== "main") {
        return state;
      }

      started = true;
      return {
        sessionPhase: "retry",
        retryIndex: 0,
        currentQuestion: state.missedQuestions[0] ?? null,
        currentQuestionMode: "retry",
        selectedChoice: null,
        fillBlankAnswer: "",
      };
    });
    if (started) {
      syncReviewSessionToStorage();
    }
    return started;
  },
  advanceRetryQuestion: () => {
    let advanced = false;
    set((state) => {
      if (state.sessionPhase !== "retry" || !state.missedQuestions.length) {
        return state;
      }

      const nextIndex = state.retryIndex + 1;
      if (nextIndex >= state.missedQuestions.length) {
        return state;
      }

      advanced = true;
      return {
        retryIndex: nextIndex,
        currentQuestion: state.missedQuestions[nextIndex] ?? null,
        currentQuestionMode: "retry",
        selectedChoice: null,
        fillBlankAnswer: "",
      };
    });
    if (advanced) {
      syncReviewSessionToStorage();
    }
    return advanced;
  },
  resetSession: () => {
    set(() => ({
      ...defaultReviewState,
      pickableTopics: useReviewStore.getState().pickableTopics,
    }));
    void clearReviewSession();
  },
  releaseActiveRecall: () => {
    set((state) => ({
      sessionQuestions: [],
      sessionIndex: 0,
      sessionSource: null,
      reviewKind: "ritual",
      tonightQuestion: null,
      currentQuestion: null,
      sessionPhase: "main",
      missedQuestions: [],
      retryIndex: 0,
      currentQuestionMode: "normal",
      selectedChoice: null,
      fillBlankAnswer: "",
      result: state.result,
      loading: state.loading,
      error: state.error,
      pickableTopics: state.pickableTopics,
    }));
    void clearReviewSession();
  },
  hydrateFromPersisted: (session) => {
    const normalized = normalizePersistedReviewSession(session) ?? session;
    set({
      sessionQuestions: capSessionQuestions(normalized.sessionQuestions),
      sessionIndex: Math.min(normalized.sessionIndex, Math.max(0, normalized.sessionQuestions.length - 1)),
      sessionSource: normalized.sessionSource,
      reviewKind: normalized.reviewKind,
      tonightQuestion: normalized.tonightQuestion,
      currentQuestion: normalized.currentQuestion,
      sessionPhase: normalized.sessionPhase,
      missedQuestions: normalized.missedQuestions,
      retryIndex: Math.min(normalized.retryIndex, Math.max(0, normalized.missedQuestions.length - 1)),
      currentQuestionMode: normalized.currentQuestionMode,
      selectedChoice: null,
      fillBlankAnswer: "",
    });
  },
  resetReview: () => {
    set(() => ({
      ...defaultReviewState,
    }));
    void clearReviewSession();
  },
  setTonightQuestion: (question) => {
    set(() => ({
      sessionSource: question ? "local" : null,
      reviewKind: "ritual",
      tonightQuestion: question,
      currentQuestion: question,
      sessionPhase: "main",
      missedQuestions: [],
      retryIndex: 0,
      currentQuestionMode: "normal",
      selectedChoice: null,
      fillBlankAnswer: "",
    }));
    syncReviewSessionToStorage();
  },
  setServerTonightQuestion: (question) => {
    set((state) => {
      if (state.sessionSource === "local") {
        return state;
      }

      return {
        sessionSource: question ? ("server" as const) : null,
        reviewKind: "ritual" as const,
        tonightQuestion: question,
        currentQuestion: question,
        currentQuestionMode: "normal" as const,
        selectedChoice: null,
        fillBlankAnswer: "",
      };
    });
    syncReviewSessionToStorage();
  },
  setPickableTopics: (topics) => set({ pickableTopics: topics }),
  setSelectedChoice: (selectedChoice) => set({ selectedChoice }),
  setFillBlankAnswer: (fillBlankAnswer) => set({ fillBlankAnswer }),
  setResult: (result) => set({ result }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
