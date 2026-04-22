import { create } from "zustand";

type AuthMode = "guest" | "signed_in";
type PlanName = "free" | "plus";

type AuthState = {
  userId: string | null;
  authMode: AuthMode;
  plan: PlanName;
  locale: string;
  timezone: string;
  accessToken: string | null;
  refreshToken: string | null;
  provider: "guest" | "google" | null;
  setPlan: (plan: PlanName) => void;
  setSession: (input: {
    userId: string;
    timezone: string;
    authMode: AuthMode;
    accessToken: string;
    refreshToken: string;
    provider: "guest" | "google";
  }) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  authMode: "guest",
  plan: "free",
  locale: "en",
  timezone: "UTC",
  accessToken: null,
  refreshToken: null,
  provider: null,
  setPlan: (plan) => set({ plan }),
  setSession: ({ userId, timezone, authMode, accessToken, refreshToken, provider }) =>
    set({ userId, timezone, authMode, accessToken, refreshToken, provider }),
  clearSession: () =>
    set({
      userId: null,
      accessToken: null,
      refreshToken: null,
      provider: null,
      authMode: "guest",
      plan: "free",
    }),
}));
