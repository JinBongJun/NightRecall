import { useMemo } from "react";

import type { ColorPalette } from "./colors";
import type { AppTypography } from "./typography";
import { useAppTheme } from "./ThemeContext";

export type ThemedStyleContext = {
  colors: ColorPalette;
  typography: AppTypography;
  isDark: boolean;
};

export function useThemedStyles<T>(factory: (ctx: ThemedStyleContext) => T): T {
  const { colors, typography, isDark } = useAppTheme();
  return useMemo(() => factory({ colors, typography, isDark }), [colors, typography, isDark]);
}
