type ExtractMode = "photo" | "paste" | "manual";

export function extractKeyPoints(sourceText: string, mode: ExtractMode): string[] {
  const normalized = sourceText
    .replace(/\r/g, "\n")
    .replace(/[•·]/g, "\n")
    .replace(/\t/g, " ")
    .trim();

  const rawParts =
    mode === "manual"
      ? normalized.split(/,|\n/)
      : normalized
          .split(/\n|(?<=[.!?])\s+/)
          .flatMap((part) => part.split(/;|:/));

  const deduped = new Set<string>();

  for (const part of rawParts) {
    const cleaned = part.replace(/\s+/g, " ").trim();
    if (!cleaned) {
      continue;
    }
    if (cleaned.length < 4) {
      continue;
    }
    const compact = cleaned.length > 90 ? `${cleaned.slice(0, 87).trim()}...` : cleaned;
    deduped.add(compact);
    if (deduped.size >= 6) {
      break;
    }
  }

  return Array.from(deduped);
}
