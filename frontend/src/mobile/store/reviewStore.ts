import { create } from "zustand";

import {
  clearReviewSession,
  localDateKey,
  saveReviewSession,
  type PersistedReviewSession,
} from "../services/reviewSessionStorage";
import { AnswerResponse, Question, Topic } from "../types/models";
import { capSessionQuestions, mergeSessionQuestions } from "./reviewSessionLogic";

export { MAX_SESSION_QUESTIONS } from "./reviewSessionLogic";

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

function snapshotFromState(state: ReviewState): PersistedReviewSession | null {
  if (!state.currentQuestion && !state.sessionQuestions.length) {
    return null;
  }

  return {
    dateKey: localDateKey(),
    sessionQuestions: state.sessionQuestions,
    sessionIndex: state.sessionIndex,
    sessionSource: state.sessionSource,
    tonightQuestion: state.tonightQuestion,
    currentQuestion: state.currentQuestion,
    retryQuestion: state.retryQuestion,
    retryUsed: state.retryUsed,
    currentQuestionMode: state.currentQuestionMode,
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
  setSessionQuestions: (questions) => {
    set(() => {
      const sanitized = capSessionQuestions(questions);
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
  queueRetryQuestion: (question) => {
    set((state) => {
      if (state.retryQuestion || state.retryUsed) {
        return state;
      }

      return {
        retryQuestion: question,
      };
    });
    syncReviewSessionToStorage();
  },
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
    if (consumed) {
      syncReviewSessionToStorage();
    }
    return consumed;
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
      tonightQuestion: null,
      currentQuestion: null,
      retryQuestion: null,
      retryUsed: false,
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
    set({
      sessionQuestions: capSessionQuestions(session.sessionQuestions),
      sessionIndex: Math.min(session.sessionIndex, Math.max(0, session.sessionQuestions.length - 1)),
      sessionSource: session.sessionSource,
      tonightQuestion: session.tonightQuestion,
      currentQuestion: session.currentQuestion,
      retryQuestion: session.retryQuestion,
      retryUsed: session.retryUsed,
      currentQuestionMode: session.currentQuestionMode,
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
      tonightQuestion: question,
      currentQuestion: question,
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
