export type ColorPalette = {
  background: string;
  backgroundStrong: string;
  surface: string;
  surfaceLow: string;
  surfaceMuted: string;
  surfaceHigh: string;
  text: string;
  muted: string;
  mutedSoft: string;
  primary: string;
  primaryContainer: string;
  primarySoft: string;
  secondary: string;
  secondarySoft: string;
  tertiary: string;
  tertiarySoft: string;
  accent: string;
  accentSoft: string;
  success: string;
  danger: string;
  dangerSoft: string;
  border: string;
  line: string;
  shadow: string;
};

export const lightColors: ColorPalette = {
  background: "#F5F0E6",
  backgroundStrong: "#ECE3D2",
  surface: "#FFFDF8",
  surfaceLow: "#F2EBDD",
  surfaceMuted: "#EBE2D1",
  surfaceHigh: "#E0D4C0",
  text: "#17332C",
  muted: "#56655F",
  mutedSoft: "#7C8A82",
  primary: "#0F4C3F",
  primaryContainer: "#1A5B4A",
  primarySoft: "#D5E6DC",
  secondary: "#6F7D71",
  secondarySoft: "#E2EBE3",
  tertiary: "#9C6A41",
  tertiarySoft: "#F2DDCB",
  accent: "#C77B4A",
  accentSoft: "#F0D7C2",
  success: "#2F6A4D",
  danger: "#BA1A1A",
  dangerSoft: "#FFDAD6",
  border: "#D4C7B3",
  line: "#E7DDCF",
  shadow: "#10231E",
};

export const darkColors: ColorPalette = {
  background: "#121916",
  backgroundStrong: "#1A2220",
  surface: "#1E2825",
  surfaceLow: "#252F2C",
  surfaceMuted: "#2A3531",
  surfaceHigh: "#34403C",
  text: "#E8F0EC",
  muted: "#9BAAA3",
  mutedSoft: "#7A8A83",
  primary: "#4CB397",
  primaryContainer: "#3D9A82",
  primarySoft: "#1F3D34",
  secondary: "#8A9A90",
  secondarySoft: "#263029",
  tertiary: "#C99260",
  tertiarySoft: "#3D2E22",
  accent: "#E09A6A",
  accentSoft: "#3D2B1F",
  success: "#5BAE7E",
  danger: "#FF8A80",
  dangerSoft: "#4A2523",
  border: "#3A4541",
  line: "#2E3834",
  shadow: "#000000",
};

/** @deprecated Prefer `useAppTheme().colors` */
export const colors = lightColors;
