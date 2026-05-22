import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { colors } from "../theme/colors";
import { theme } from "../theme";

type Props = {
  title: string;
  body: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, body, iconName = "auto-stories", actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBadge}>
        <MaterialIcons name={iconName} size={20} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {actionLabel && onAction ? (
        <Pressable style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
          <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(255,253,248,0.88)",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  title: {
    color: colors.text,
    fontWeight: theme.typography.section.fontWeight,
    fontSize: theme.typography.section.fontSize,
  },
  body: {
    color: colors.muted,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
  },
  actionButton: {
    marginTop: 4,
    minHeight: theme.control.buttonMinHeightCompact,
    backgroundColor: colors.primary,
    borderRadius: theme.radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  actionButtonPressed: {
    opacity: 0.92,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: theme.typography.button.fontSize,
    fontWeight: theme.typography.button.fontWeight,
  },
});
