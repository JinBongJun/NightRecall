type BootstrapSessionDependencies = {
  restoreSession: () => Promise<{
    userId: string;
    timezone: string;
    authMode: "guest" | "signed_in";
    accessToken: string;
    refreshToken: string;
    provider: "guest" | "google";
    email?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null>;
  fetchPlan: () => Promise<{ plan: "free" | "plus" }>;
  setPlan: (plan: "free" | "plus") => void;
  finishBootstrap: () => void;
};

export async function bootstrapSession({
  restoreSession,
  fetchPlan,
  setPlan,
  finishBootstrap,
}: BootstrapSessionDependencies) {
  try {
    const session = await restoreSession();
    if (!session) {
      return;
    }

    try {
      const entitlements = await fetchPlan();
      setPlan(entitlements.plan);
    } catch {
      // Keep defaults if the contract is unavailable.
    }
  } finally {
    finishBootstrap();
  }
}
