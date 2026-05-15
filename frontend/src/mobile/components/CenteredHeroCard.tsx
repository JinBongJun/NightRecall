import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { colors } from "../theme/colors";

type Tone = "ready" | "idle" | "completed" | "neutral";

type Props = {
  badgeLabel: string;
  title: string;
  body?: string;
  tone?: Tone;
  iconName: keyof typeof MaterialIcons.glyphMap;
  children?: ReactNode;
};

const toneStyles = {
  ready: {
    backgroundColor: "#123F35",
    glowTop: "rgba(255,248,236,0.12)",
    glowSide: "rgba(255,255,255,0.06)",
    iconGlow: "rgba(255,245,228,0.18)",
    iconTileBackground: "rgba(255,255,255,0.1)",
    iconTileBorder: "rgba(255,255,255,0.16)",
  },
  idle: {
    backgroundColor: "#566E63",
    glowTop: "rgba(255,249,239,0.14)",
    glowSide: "rgba(246,251,249,0.12)",
    iconGlow: "rgba(244,248,246,0.2)",
    iconTileBackground: "rgba(255,251,245,0.14)",
    iconTileBorder: "rgba(255,251,245,0.22)",
  },
  completed: {
    backgroundColor: "#355A4B",
    glowTop: "rgba(245,239,224,0.16)",
    glowSide: "rgba(228,245,239,0.11)",
    iconGlow: "rgba(236,244,239,0.2)",
    iconTileBackground: "rgba(255,250,243,0.12)",
    iconTileBorder: "rgba(255,250,243,0.22)",
  },
  neutral: {
    backgroundColor: colors.primary,
    glowTop: "rgba(255,248,236,0.14)",
    glowSide: "rgba(255,255,255,0.06)",
    iconGlow: "rgba(255,248,236,0.2)",
    iconTileBackground: "rgba(255,255,255,0.1)",
    iconTileBorder: "rgba(255,255,255,0.18)",
  },
} as const;

export function CenteredHeroCard({ badgeLabel, title, body, tone = "neutral", iconName, children }: Props) {
  const theme = toneStyles[tone];

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundColor }]}>
      <View style={[styles.glowTop, { backgroundColor: theme.glowTop }]} />
      <View style={[styles.glowSide, { backgroundColor: theme.glowSide }]} />
      <View style={styles.orbitArc} />

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      </View>

      <View style={styles.iconOuter}>
        <View style={[styles.iconGlow, { backgroundColor: theme.iconGlow }]} />
        <View
          style={[
            styles.iconTile,
            {
              backgroundColor: theme.iconTileBackground,
              borderColor: theme.iconTileBorder,
            },
          ]}
        >
          <MaterialIcons name={iconName} size={40} color="#FFFFFF" />
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 18,
    alignItems: "center",
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  glowTop: {
    position: "absolute",
    top: -80,
    width: 260,
    height: 200,
    borderRadius: 999,
  },
  glowSide: {
    position: "absolute",
    right: -60,
    top: 80,
    width: 180,
    height: 180,
    borderRadius: 999,
  },
  orbitArc: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    top: -90,
    right: -70,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  badge: {
    backgroundColor: "rgba(255,252,247,0.11)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  iconOuter: {
    width: 74,
    height: 74,
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGlow: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 999,
    opacity: 0.72,
  },
  iconTile: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "1deg" }],
    borderWidth: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    letterSpacing: -0.75,
    textAlign: "center",
    maxWidth: 280,
    marginBottom: 6,
  },
  body: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 260,
    marginBottom: 14,
  },
});
