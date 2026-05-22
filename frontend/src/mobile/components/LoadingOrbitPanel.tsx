import { Animated, StyleSheet, Text, View } from "react-native";

import { useLoadingOrbitMotion } from "../hooks/useLoadingOrbitMotion";
import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { useAppTheme } from "../theme";

type Props = {
  title: string;
  body: string;
  phases: string[];
};

export function LoadingOrbitPanel({ title, body, phases }: Props) {
  const styles = useThemedStyles(createStyles);
  const { isDark } = useAppTheme();
  const { pulse, shimmer, copyFade, phaseLabel } = useLoadingOrbitMotion(phases);

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[
          styles.motionWrap,
          {
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.05],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.motionGlowLarge,
            {
              opacity: shimmer.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0.5],
              }),
              transform: [
                {
                  scale: shimmer.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.92, 1.08],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.motionGlowSmall,
            {
              opacity: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.18, 0.36],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.iconTile,
            {
              transform: [
                {
                  rotate: shimmer.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["-4deg", "4deg"],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.motionRow}>
            <Animated.View
              style={[
                styles.motionBar,
                styles.motionBarShort,
                {
                  opacity: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.motionBar,
                styles.motionBarLong,
                {
                  opacity: shimmer.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, 0.95],
                  }),
                },
              ]}
            />
          </View>
          <Animated.View
            style={[
              styles.motionDot,
              {
                transform: [
                  {
                    translateX: shimmer.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-8, 8],
                    }),
                  },
                ],
              },
            ]}
          />
        </Animated.View>
      </Animated.View>

      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <Animated.Text style={[styles.phase, { opacity: copyFade }]}>{phaseLabel}</Animated.Text>
      </View>
    </View>
  );
}

function createStyles({ colors, isDark }: ThemedStyleContext) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      minHeight: 280,
      justifyContent: "center",
      alignItems: "center",
      gap: 28,
    },
    motionWrap: {
      width: 140,
      height: 140,
      alignItems: "center",
      justifyContent: "center",
    },
    motionGlowLarge: {
      position: "absolute",
      width: 118,
      height: 118,
      borderRadius: 999,
      backgroundColor: isDark ? "rgba(114,168,134,0.2)" : "rgba(45,90,90,0.18)",
    },
    motionGlowSmall: {
      position: "absolute",
      width: 86,
      height: 86,
      borderRadius: 999,
      backgroundColor: isDark ? "rgba(201,149,94,0.22)" : "rgba(188,235,235,0.24)",
    },
    iconTile: {
      width: 88,
      height: 88,
      borderRadius: 28,
      backgroundColor: colors.primaryContainer,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.shadow,
      shadowOpacity: isDark ? 0.2 : 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
    },
    motionRow: {
      gap: 8,
      alignItems: "center",
    },
    motionBar: {
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.surface,
    },
    motionBarShort: {
      width: 18,
    },
    motionBarLong: {
      width: 30,
    },
    motionDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      backgroundColor: colors.surface,
      marginTop: 10,
    },
    copy: {
      alignItems: "center",
      gap: 8,
    },
    title: {
      color: colors.primary,
      fontSize: 22,
      lineHeight: 34,
      fontWeight: "800",
      textAlign: "center",
      letterSpacing: -0.8,
    },
    body: {
      color: colors.muted,
      fontSize: 15,
      lineHeight: 24,
      textAlign: "center",
      maxWidth: 280,
    },
    phase: {
      color: colors.mutedSoft,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1.1,
      marginTop: 8,
    },
  });
}
