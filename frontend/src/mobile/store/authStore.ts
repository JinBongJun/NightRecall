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
  setPlan: (plan: PlanName) => void;
  finishBootstrap: () => void;
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
  bootstrapStatus: "bootstrapping",
  ...defaultAuthState,
  setPlan: (plan) => set({ plan }),
  finishBootstrap: () => set({ bootstrapStatus: "ready" }),
  setSession: ({ userId, timezone, authMode, accessToken, refreshToken, provider }) =>
    set({ userId, timezone, authMode, accessToken, refreshToken, provider, bootstrapStatus: "ready" }),
  clearSession: () =>
    set({
      ...defaultAuthState,
      bootstrapStatus: "ready",
    }),
}));
