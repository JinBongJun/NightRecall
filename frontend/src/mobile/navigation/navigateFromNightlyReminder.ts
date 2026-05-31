import { resolveNightlyReminderDestination } from "../utils/nightlyReminderNavigation";
import { useReviewStore } from "../store/reviewStore";
import { navigationRef } from "./navigationRef";

const NAVIGATION_READY_TIMEOUT_MS = 3000;
const NAVIGATION_READY_POLL_MS = 50;

function navigateToDestination() {
  const destination = resolveNightlyReminderDestination(useReviewStore.getState());

  if (!navigationRef.isReady()) {
    return false;
  }

  if (destination.screen === "review") {
    navigationRef.navigate("Review", { mode: destination.mode });
  } else {
    navigationRef.navigate("MainTabs", {
      screen: "HomeTab",
      params: { screen: "Home" },
    });
  }

  return true;
}

export function navigateFromNightlyReminderTap() {
  if (navigateToDestination()) {
    return;
  }

  const startedAt = Date.now();
  const timer = setInterval(() => {
    if (navigateToDestination() || Date.now() - startedAt >= NAVIGATION_READY_TIMEOUT_MS) {
      clearInterval(timer);
    }
  }, NAVIGATION_READY_POLL_MS);
}
