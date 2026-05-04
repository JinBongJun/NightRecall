export type AuthMode = "guest" | "signed_in";
export type AuthProvider = "guest" | "google";
export type PlanName = "free" | "plus";
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
