import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { colors } from "../theme/colors";

type Props = {
  title: string;
  preview: string;
  bookmarkedCount: number;
  imageUri?: string | null;
  onPress: () => void;
  onDelete: () => void;
  deleting?: boolean;
};

export function SavedLearningCard({ title, preview, bookmarkedCount, imageUri, onPress, onDelete, deleting = false }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : (
        <View style={styles.imageFallback}>
          <MaterialIcons name="auto-stories" size={28} color={colors.primary} />
        </View>
      )}

      <View style={styles.copy}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Pressable style={({ pressed }) => [styles.deleteButton, pressed && styles.deletePressed]} onPress={onDelete} hitSlop={8}>
            <MaterialIcons name={deleting ? "hourglass-empty" : "delete-outline"} size={18} color={colors.primary} />
          </Pressable>
        </View>

        <Text style={styles.preview} numberOfLines={2}>
          {preview}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <MaterialIcons name="bookmark" size={13} color={colors.primary} />
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
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: "row",
    gap: 14,
    alignItems: "stretch",
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.995 }],
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: 18,
    backgroundColor: colors.surfaceHigh,
  },
  imageFallback: {
    width: 96,
    height: 96,
    borderRadius: 18,
    backgroundColor: "rgba(213,230,220,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 10,
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
  },
  preview: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(213,230,220,0.52)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  metaText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  openPill: {
    borderRadius: 999,
    backgroundColor: colors.surfaceLow,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  openText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  deleteButton: {
    width: 34,
    height: 34,
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
