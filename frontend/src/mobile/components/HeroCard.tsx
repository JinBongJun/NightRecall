import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { colors } from "../theme/colors";

type HeroTone = "primary" | "accent";

type Props = {
  overline: string;
  title: string;
  tone?: HeroTone;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  iconSlot?: ReactNode;
  body?: string;
  meta?: string;
  titleMaxWidth?: number;
  children?: ReactNode;
};

const toneBackground = {
  primary: colors.primary,
  accent: colors.accent,
} as const;

export function HeroCard({
  overline,
  title,
  tone = "primary",
  iconName,
  iconSlot,
  body,
  meta,
  titleMaxWidth,
  children,
}: Props) {
  return (
    <View style={[styles.card, { backgroundColor: toneBackground[tone] }]}>
      <View style={styles.glowLarge} />
      <View style={styles.glowSmall} />
      <View style={styles.orbitArc} />

      <View style={styles.header}>
        <View>
          <Text style={styles.overline}>{overline}</Text>
          <Text style={[styles.title, titleMaxWidth ? { maxWidth: titleMaxWidth } : null]}>{title}</Text>
        </View>
        <View style={styles.iconTile}>
          {iconSlot ?? (iconName ? <MaterialIcons name={iconName} size={24} color="#FFFFFF" /> : null)}
        </View>
      </View>

      {body ? <Text style={styles.body}>{body}</Text> : null}
      {children}
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 32,
    padding: 24,
    gap: 18,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
  },
  glowLarge: {
    position: "absolute",
    top: -72,
    left: -24,
    width: 250,
    height: 170,
    borderRadius: 999,
    backgroundColor: "rgba(255,248,236,0.12)",
  },
  glowSmall: {
    position: "absolute",
    right: -30,
    top: 70,
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  orbitArc: {
    position: "absolute",
    right: -56,
    bottom: -64,
    width: 190,
    height: 190,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  overline: {
    color: "rgba(255,248,236,0.74)",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  iconTile: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "rgba(255,252,247,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    color: "rgba(255,252,247,0.84)",
    fontSize: 16,
    lineHeight: 24,
  },
  meta: {
    color: "rgba(255,248,236,0.72)",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
  },
});
