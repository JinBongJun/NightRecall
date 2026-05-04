import { create } from "zustand";

import { SavedStudyInputSummary, Topic } from "../types/models";

type TopicsState = {
  recentTopics: Topic[];
  starredTopics: Topic[];
  pickableTopics: Topic[];
  savedInputsCache: SavedStudyInputSummary[];
  setTopics: (topics: Topic[]) => void;
  setPickableTopics: (topics: Topic[]) => void;
  upsertSavedInput: (item: SavedStudyInputSummary) => void;
  setSavedInputsCache: (items: SavedStudyInputSummary[]) => void;
  removeSavedInput: (studyInputId: string) => void;
  removeTopic: (topicId: string) => void;
  resetTopics: () => void;
};

const mergeTopics = (existing: Topic[], incoming: Topic[]) => {
  const merged = [...incoming, ...existing];
  const deduped = new Map<string, Topic>();
  merged.forEach((topic) => {
    if (!deduped.has(topic.id)) {
      deduped.set(topic.id, topic);
    }
  });
  return Array.from(deduped.values());
};

export const useTopicsStore = create<TopicsState>((set) => ({
  recentTopics: [],
  starredTopics: [],
  pickableTopics: [],
  savedInputsCache: [],
  setTopics: (topics) =>
    set((state) => {
      const recentTopics = mergeTopics(state.recentTopics, topics);
      const starredTopics = mergeTopics(
        state.starredTopics,
        topics.filter((topic) => topic.is_starred),
      );

      return {
        recentTopics,
        starredTopics,
      };
    }),
  setPickableTopics: (pickableTopics) =>
    set(() => ({
      pickableTopics,
    })),
  upsertSavedInput: (item) =>
    set((state) => ({
      savedInputsCache: [item, ...state.savedInputsCache.filter((existing) => existing.study_input_id !== item.study_input_id)],
    })),
  setSavedInputsCache: (items) =>
    set(() => ({
      savedInputsCache: items,
    })),
  removeSavedInput: (studyInputId) =>
    set((state) => ({
      savedInputsCache: state.savedInputsCache.filter((item) => item.study_input_id !== studyInputId),
    })),
  removeTopic: (topicId) =>
    set((state) => ({
      recentTopics: state.recentTopics.filter((topic) => topic.id !== topicId),
      starredTopics: state.starredTopics.filter((topic) => topic.id !== topicId),
      pickableTopics: state.pickableTopics.filter((topic) => topic.id !== topicId),
    })),
  resetTopics: () =>
    set(() => ({
      recentTopics: [],
      starredTopics: [],
      pickableTopics: [],
      savedInputsCache: [],
    })),
}));
