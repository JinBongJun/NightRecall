import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { Topic } from "../types/models";
import { colors } from "../theme/colors";

type Props = {
  topic: Topic;
  onPress: () => void;
  ctaLabel?: string;
  subtitle?: string;
  disabled?: boolean;
  titleOverride?: string;
};

export function TopicCard({ topic, onPress, ctaLabel = "Pick", subtitle, disabled = false, titleOverride }: Props) {
  const rawTitle =
    (typeof topic.text === "string" && topic.text.trim()) ||
    (typeof topic.topic_text === "string" && topic.topic_text.trim()) ||
    "";
  const title = (titleOverride && titleOverride.trim()) || rawTitle.trim() || "Saved learning";

  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.card, disabled && styles.cardDisabled, pressed && !disabled && styles.cardPressed]}>
      <View style={styles.iconWrap}>
        <MaterialIcons name={topic.is_starred ? "star" : "history"} size={20} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <View style={styles.row}>
          <Text style={styles.title}>{title}</Text>
          {topic.is_starred ? <Text style={styles.badge}>Saved</Text> : null}
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.cta}>
        <Text style={styles.ctaText}>{ctaLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,253,248,0.92)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  cardDisabled: {
    opacity: 0.45,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "rgba(213,230,220,0.76)",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  row: {
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    flexShrink: 1,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
    fontWeight: "700",
    fontSize: 12,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  cta: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ctaText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
