import { create } from "zustand";
import type { AuthMode, AuthProvider, AuthSession, BootstrapStatus, PlanName, UserProfile } from "../types/authModels";

const defaultAuthState = {
  userId: null,
  authMode: "guest" as AuthMode,
  plan: "free" as PlanName,
  locale: "en",
  timezone: "UTC",
  accessToken: null,
  refreshToken: null,
  provider: null as AuthProvider | null,
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
  provider: AuthProvider | null;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  setPlan: (plan: PlanName) => void;
  setProfile: (profile: UserProfile) => void;
  finishBootstrap: () => void;
  setSession: (input: AuthSession) => void;
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
