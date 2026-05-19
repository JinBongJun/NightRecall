import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { colors } from "../theme/colors";
import { theme } from "../theme";

type Props = {
  title: string;
  preview: string;
  bookmarkedCount: number;
  imageUri?: string | null;
  imageHeaders?: Record<string, string>;
  onPress: () => void;
  onDelete: () => void;
  deleting?: boolean;
};

export function SavedLearningCard({ title, preview, bookmarkedCount, imageUri, imageHeaders, onPress, onDelete, deleting = false }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      {imageUri ? (
        <Image source={{ uri: imageUri, headers: imageHeaders }} style={styles.image} />
      ) : (
        <View style={styles.imageFallback}>
          <MaterialIcons name="auto-stories" size={22} color={colors.primary} />
        </View>
      )}

      <View style={styles.copy}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.deleteButton, pressed && styles.deletePressed]}
            onPress={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            hitSlop={8}
          >
            <MaterialIcons name={deleting ? "hourglass-empty" : "delete-outline"} size={16} color={colors.primary} />
          </Pressable>
        </View>

        <Text style={styles.preview} numberOfLines={2}>
          {preview}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <MaterialIcons name="bookmark" size={12} color={colors.primary} />
            <Text style={styles.metaText}>
              {bookmarkedCount} saved point{bookmarkedCount > 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.openPill}>
            <Text style={styles.openText}>Review</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,253,248,0.92)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    flexDirection: "row",
    gap: 10,
    alignItems: "stretch",
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.995 }],
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.md,
    backgroundColor: colors.surfaceHigh,
  },
  imageFallback: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(213,230,220,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 6,
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: theme.typography.section.fontSize,
    lineHeight: theme.typography.section.lineHeight,
    fontWeight: theme.typography.section.fontWeight,
  },
  preview: {
    color: colors.muted,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(213,230,220,0.52)",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  metaText: {
    color: colors.primary,
    fontSize: theme.typography.micro.fontSize,
    fontWeight: "800",
  },
  openPill: {
    borderRadius: 999,
    backgroundColor: colors.surfaceLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  openText: {
    color: colors.primary,
    fontSize: theme.typography.micro.fontSize,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  deleteButton: {
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deletePressed: {
    opacity: 0.92,
    transform: [{ scale: 0.96 }],
  },
});
