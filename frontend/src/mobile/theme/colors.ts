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

/** Warm night — layered surfaces, sage + amber accents (not flat gray or mint). */
export const darkColors: ColorPalette = {
  background: "#14110D",
  backgroundStrong: "#1D1914",
  surface: "#2B261F",
  surfaceLow: "#353024",
  surfaceMuted: "#3F392F",
  surfaceHigh: "#4C4539",
  text: "#F5EFE3",
  muted: "#B5AD9F",
  mutedSoft: "#918A7E",
  primary: "#72A886",
  primaryContainer: "#5F9473",
  primarySoft: "#2E4236",
  secondary: "#9A9488",
  secondarySoft: "#322E27",
  tertiary: "#C9955E",
  tertiarySoft: "#453220",
  accent: "#D49A62",
  accentSoft: "#4A3524",
  success: "#7AB08C",
  danger: "#E88A7E",
  dangerSoft: "#542E28",
  border: "#524B40",
  line: "#423C33",
  shadow: "#000000",
};

/** @deprecated Prefer `useAppTheme().colors` */
export const colors = lightColors;
