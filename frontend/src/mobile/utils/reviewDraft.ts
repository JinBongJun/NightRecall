import { ReviewDraftPoint } from "../types/reviewDraft";

export function getUsableDraftPoints(points: ReviewDraftPoint[]) {
  return points.filter((point) => point.text.trim());
}

export function toStudyInputPayload(points: ReviewDraftPoint[]) {
  const usablePoints = getUsableDraftPoints(points);

  return {
    usablePoints,
    payload: {
      input_type: "keywords" as const,
      content: usablePoints.map((point) => point.text.trim()),
      starred_indices: usablePoints.flatMap((point, index) => (point.isStarred ? [index] : [])),
    },
  };
}
