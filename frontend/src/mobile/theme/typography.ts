export const MAX_FONT_SCALE = 1.35;

const scale = (value: number, fontScale: number) => Math.round(value * fontScale);

export const baseTypography = {
  display: { fontSize: 22, lineHeight: 28, fontWeight: "800" as const },
  title: { fontSize: 17, lineHeight: 22, fontWeight: "800" as const },
  section: { fontSize: 14, lineHeight: 18, fontWeight: "800" as const },
  body: { fontSize: 13, lineHeight: 18, fontWeight: "600" as const },
  caption: { fontSize: 11, lineHeight: 15, fontWeight: "700" as const },
  button: { fontSize: 14, lineHeight: 18, fontWeight: "800" as const },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: "700" as const },
};

export type AppTypography = typeof baseTypography;

export function buildTypography(fontScale: number): AppTypography {
  const factor = Math.min(Math.max(fontScale, 1), MAX_FONT_SCALE);
  return {
    display: {
      ...baseTypography.display,
      fontSize: scale(baseTypography.display.fontSize, factor),
      lineHeight: scale(baseTypography.display.lineHeight, factor),
    },
    title: {
      ...baseTypography.title,
      fontSize: scale(baseTypography.title.fontSize, factor),
      lineHeight: scale(baseTypography.title.lineHeight, factor),
    },
    section: {
      ...baseTypography.section,
      fontSize: scale(baseTypography.section.fontSize, factor),
      lineHeight: scale(baseTypography.section.lineHeight, factor),
    },
    body: {
      ...baseTypography.body,
      fontSize: scale(baseTypography.body.fontSize, factor),
      lineHeight: scale(baseTypography.body.lineHeight, factor),
    },
    caption: {
      ...baseTypography.caption,
      fontSize: scale(baseTypography.caption.fontSize, factor),
      lineHeight: scale(baseTypography.caption.lineHeight, factor),
    },
    button: {
      ...baseTypography.button,
      fontSize: scale(baseTypography.button.fontSize, factor),
      lineHeight: scale(baseTypography.button.lineHeight, factor),
    },
    micro: {
      ...baseTypography.micro,
      fontSize: scale(baseTypography.micro.fontSize, factor),
      lineHeight: scale(baseTypography.micro.lineHeight, factor),
    },
  };
}
