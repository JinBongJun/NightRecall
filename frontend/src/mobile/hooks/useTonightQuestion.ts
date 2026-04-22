import { useCallback } from "react";
import axios from "axios";

import { fetchTonightQuestion } from "../services/reviewService";
import { useReviewStore } from "../store/reviewStore";

export function useTonightQuestion() {
  const sessionSource = useReviewStore((state) => state.sessionSource);
  const setServerTonightQuestion = useReviewStore((state) => state.setServerTonightQuestion);
  const setLoading = useReviewStore((state) => state.setLoading);
  const setError = useReviewStore((state) => state.setError);

  return useCallback(async () => {
    if (sessionSource === "local") {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchTonightQuestion();
      setServerTonightQuestion(response.question);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setServerTonightQuestion(null);
        setError("Tonight's question is not ready yet.");
      } else {
        setError("NightRecall could not load tonight's question.");
      }
    } finally {
      setLoading(false);
    }
  }, [sessionSource, setError, setLoading, setServerTonightQuestion]);
}
