import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { colors } from "../theme/colors";

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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: "row",
    gap: 12,
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
    width: 84,
    height: 84,
    borderRadius: 16,
    backgroundColor: colors.surfaceHigh,
  },
  imageFallback: {
    width: 84,
    height: 84,
    borderRadius: 16,
    backgroundColor: "rgba(213,230,220,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 8,
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
  preview: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(213,230,220,0.52)",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  metaText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  openPill: {
    borderRadius: 999,
    backgroundColor: colors.surfaceLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  openText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  deleteButton: {
    width: 30,
    height: 30,
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
