import { create } from "zustand";

type AuthMode = "guest" | "signed_in";
type PlanName = "free" | "plus";
type BootstrapStatus = "bootstrapping" | "ready";

const defaultAuthState = {
  userId: null,
  authMode: "guest" as AuthMode,
  plan: "free" as PlanName,
  locale: "en",
  timezone: "UTC",
  accessToken: null,
  refreshToken: null,
  provider: null as "guest" | "google" | null,
  email: null,
  displayName: null,
  avatarUrl: null,
};

type AuthState = {
  bootstrapStatus: BootstrapStatus;
  userId: string | null;
  authMode: AuthMode;
  plan: PlanName;
  locale: string;
  timezone: string;
  accessToken: string | null;
  refreshToken: string | null;
  provider: "guest" | "google" | null;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  setPlan: (plan: PlanName) => void;
  setProfile: (profile: { email?: string | null; displayName?: string | null; avatarUrl?: string | null }) => void;
  finishBootstrap: () => void;
  setSession: (input: {
    userId: string;
    timezone: string;
    authMode: AuthMode;
    accessToken: string;
    refreshToken: string;
    provider: "guest" | "google";
    email?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
  }) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  bootstrapStatus: "bootstrapping",
  ...defaultAuthState,
  setPlan: (plan) => set({ plan }),
  setProfile: ({ email, displayName, avatarUrl }) =>
    set((state) => ({
      email: email !== undefined ? email : state.email,
      displayName: displayName !== undefined ? displayName : state.displayName,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : state.avatarUrl,
    })),
  finishBootstrap: () => set({ bootstrapStatus: "ready" }),
  setSession: ({ userId, timezone, authMode, accessToken, refreshToken, provider, email, displayName, avatarUrl }) =>
    set({
      userId,
      timezone,
      authMode,
      accessToken,
      refreshToken,
      provider,
      email: email ?? null,
      displayName: displayName ?? null,
      avatarUrl: avatarUrl ?? null,
      bootstrapStatus: "ready",
    }),
  clearSession: () =>
    set({
      ...defaultAuthState,
      bootstrapStatus: "ready",
    }),
}));
