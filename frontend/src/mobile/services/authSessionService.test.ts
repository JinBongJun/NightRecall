import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "../store/authStore";
import { useReminderStore } from "../store/reminderStore";
import { useReviewStore } from "../store/reviewStore";
import { useStatsStore } from "../store/statsStore";
import { useTopicsStore } from "../store/topicsStore";

const sessionStorageMocks = vi.hoisted(() => ({
  clearSessionStorage: vi.fn(),
  loadSession: vi.fn(),
  saveSession: vi.fn(),
}));

vi.mock("./sessionStorage", () => ({
  clearSessionStorage: sessionStorageMocks.clearSessionStorage,
  loadSession: sessionStorageMocks.loadSession,
  saveSession: sessionStorageMocks.saveSession,
}));

import { clearPersistedSession, persistSession, restorePersistedSession } from "./authSessionService";

const sampleSession = {
  userId: "user-1",
  timezone: "Asia/Seoul",
  authMode: "signed_in" as const,
  accessToken: "access",
  refreshToken: "refresh",
  provider: "google" as const,
  email: "user@example.com",
  displayName: "Test User",
  avatarUrl: "https://example.com/avatar.jpg",
};

function resetStore() {
  useAuthStore.setState({
    bootstrapStatus: "bootstrapping",
    userId: null,
    authMode: "guest",
    plan: "free",
    locale: "en",
    timezone: "UTC",
    accessToken: null,
    refreshToken: null,
    provider: null,
    email: null,
    displayName: null,
    avatarUrl: null,
  });
}

describe("authSessionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("persists the session after updating the auth store", async () => {
    await persistSession(sampleSession);

    expect(useAuthStore.getState()).toMatchObject({
      bootstrapStatus: "ready",
      userId: "user-1",
      provider: "google",
    });
    expect(sessionStorageMocks.saveSession).toHaveBeenCalledWith(sampleSession);
  });

  it("restores a stored session into the auth store", async () => {
    sessionStorageMocks.loadSession.mockResolvedValue(sampleSession);

    const restored = await restorePersistedSession();

    expect(restored).toEqual(sampleSession);
    expect(useAuthStore.getState()).toMatchObject({
      bootstrapStatus: "ready",
      userId: "user-1",
      timezone: "Asia/Seoul",
    });
  });

  it("clears persisted and in-memory auth state together", async () => {
    useAuthStore.getState().setSession(sampleSession);
    useTopicsStore.getState().setSavedInputsCache([
      {
        study_input_id: "si_1",
        input_type: "keywords",
        source_kind: "manual",
        source_preview_text: "preview",
        source_image_ref: null,
        title: "Saved point",
        preview: "preview",
        bookmarked_count: 1,
        topic_id: "tp_1",
      },
    ]);
    useReviewStore.getState().setTonightQuestion({
      id: "q_1",
      question_type: "mcq",
      question_text: "Question?",
      choices: ["A", "B"],
      answer_index: 0,
      answer_text: null,
      explanation: "Explanation",
    });
    useStatsStore.getState().setStats({ streak: 4, totalAnswered: 9 });
    useReminderStore.getState().setReminder("21:15", true);

    await clearPersistedSession();

    expect(sessionStorageMocks.clearSessionStorage).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({
      bootstrapStatus: "ready",
      userId: null,
      accessToken: null,
      refreshToken: null,
      provider: null,
    });
    expect(useTopicsStore.getState().savedInputsCache).toEqual([]);
    expect(useReviewStore.getState().currentQuestion).toBeNull();
    expect(useStatsStore.getState().streak).toBe(0);
    expect(useReminderStore.getState()).toMatchObject({ reminderTime: "22:30", notificationsEnabled: false });
  });
});
