import type { PersistedSession, PlanName } from "../types/authModels";

type BootstrapSessionDependencies = {
  restoreSession: () => Promise<PersistedSession | null>;
  fetchPlan: () => Promise<{ plan: PlanName }>;
  setPlan: (plan: PlanName) => void;
  finishBootstrap: () => void;
};

type RestoredSession = Awaited<ReturnType<BootstrapSessionDependencies["restoreSession"]>>;

export async function bootstrapSession({
  restoreSession,
  fetchPlan,
  setPlan,
  finishBootstrap,
}: BootstrapSessionDependencies): Promise<RestoredSession> {
  let session: RestoredSession = null;
  try {
    session = await restoreSession();
    if (!session) {
      return null;
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

  return session;
}
