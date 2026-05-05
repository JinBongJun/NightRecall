export type { AuthMode, AuthProvider, PlanName } from "./domain";
import type { AuthMode, AuthProvider, PlanName } from "./domain";

export type BootstrapStatus = "bootstrapping" | "ready";

export type UserProfile = {
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
};

export type PersistedSession = {
  userId: string;
  timezone: string;
  authMode: AuthMode;
  accessToken: string;
  refreshToken: string;
  provider: AuthProvider;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
};

export type AuthSession = PersistedSession;
