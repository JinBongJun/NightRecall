import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";

import { useReduceMotion } from "../hooks/useReduceMotion";
import { MOTION_DURATION, MOTION_EASING, MOTION_PRESS } from "../theme/motion";
import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { theme } from "../theme";

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

export function ChoiceButton({ label, selected, onPress }: Props) {
  const styles = useThemedStyles(createStyles);
  const reduceMotion = useReduceMotion();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!selected || reduceMotion) {
      scaleAnim.setValue(1);
      return;
    }

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.02,
        duration: MOTION_DURATION.fast,
        easing: MOTION_EASING.out,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        easing: MOTION_EASING.inOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reduceMotion, scaleAnim, selected]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: Boolean(selected) }}
      style={({ pressed }) => [styles.button, selected && styles.selected, pressed && styles.pressed]}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function createStyles({ colors, typography, isDark }: ThemedStyleContext) {
  return StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: theme.control.buttonMinHeightCompact,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius.md,
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  selected: {
    backgroundColor: isDark ? colors.primarySoft : "rgba(213,230,220,0.86)",
    borderColor: isDark ? "rgba(114,168,134,0.45)" : "rgba(15,76,63,0.28)",
  },
  pressed: {
    opacity: MOTION_PRESS.opacity,
    transform: [{ scale: MOTION_PRESS.scale }],
  },
  text: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontWeight: "700",
  },
  selectedText: {
    color: colors.primary,
  },
});
}
