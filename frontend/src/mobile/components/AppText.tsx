import { Text, TextProps, TextStyle } from "react-native";

import { useAppTheme } from "../theme/ThemeContext";
import type { AppTypography } from "../theme/typography";
import { MAX_FONT_SCALE } from "../theme/typography";
import type { ColorPalette } from "../theme/colors";

type TypographyVariant = keyof AppTypography;

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: keyof ColorPalette;
  muted?: boolean;
};

export function AppText({ variant = "body", color, muted = false, style, children, ...rest }: Props) {
  const { colors, typography } = useAppTheme();
  const preset = typography[variant];
  const textColor = color ? colors[color] : muted ? colors.muted : colors.text;

  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      style={[preset as TextStyle, { color: textColor }, style]}
      {...rest}
    />
  );
}
