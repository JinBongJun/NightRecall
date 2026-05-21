import {
  clearReviewSession,
  loadReviewSession,
  localDateKey,
} from "./reviewSessionStorage";
import { useReviewStore } from "../store/reviewStore";

export async function restoreReviewSession() {
  const persisted = await loadReviewSession();
  if (!persisted) {
    return;
  }

  if (persisted.dateKey !== localDateKey()) {
    await clearReviewSession();
    return;
  }

  useReviewStore.getState().hydrateFromPersisted(persisted);
}
