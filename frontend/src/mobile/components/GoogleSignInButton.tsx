import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { MOTION_PRESS } from "../theme/motion";
import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { theme } from "../theme";
import { MAX_FONT_SCALE } from "../theme/typography";

const GOOGLE_G_LOGO = require("../../../assets/google-g.png");

type Props = {
  label?: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function GoogleSignInButton({
  label = "Continue with Google",
  onPress,
  disabled = false,
  accessibilityLabel,
}: Props) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.root, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      <View style={styles.content}>
        <Image source={GOOGLE_G_LOGO} style={styles.logo} resizeMode="contain" accessibilityIgnoresInvertColors />
        <Text allowFontScaling maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.label}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function createStyles({ colors, typography }: ThemedStyleContext) {
  return StyleSheet.create({
    root: {
      minHeight: theme.control.buttonMinHeight,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    logo: {
      width: 20,
      height: 20,
    },
    label: {
      color: colors.text,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      fontWeight: "600",
    },
    disabled: {
      opacity: 0.5,
    },
    pressed: {
      opacity: MOTION_PRESS.opacity,
      transform: [{ scale: MOTION_PRESS.scale }],
    },
  });
}
