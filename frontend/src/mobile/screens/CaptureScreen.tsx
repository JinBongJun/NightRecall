import { useMemo, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { BottomDock } from "../components/BottomDock";
import { SectionRow } from "../components/SectionRow";
import { ScreenHeader } from "../components/ScreenHeader";
import { ScreenContainer } from "../components/ScreenContainer";
import { TonightLimitsBar } from "../components/TonightLimitsBar";
import { TopBar } from "../components/TopBar";
import { useUsageLimits } from "../hooks/useUsageLimits";
import { colors } from "../theme/colors";
import { theme } from "../theme";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Capture">;

export function CaptureScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const usageLimits = useUsageLimits();
  const [selectedImage, setSelectedImage] = useState<{
    label: string;
    base64: string;
    uri: string;
    mimeType?: string | null;
    kind: "camera" | "gallery";
  } | null>(null);
  const canContinue = Boolean(selectedImage?.base64);

  const photoReadsRemaining = usageLimits?.photo_extract_daily.remaining ?? null;
  const photoReadsLocked = photoReadsRemaining === 0;

  const photoLimitCopy = useMemo(() => {
    if (photoReadsRemaining === null) {
      return null;
    }
    if (photoReadsRemaining <= 0) {
      return "Photo reads are full for tonight (3/3). Write it down instead.";
    }
    return `Photo reads left tonight: ${photoReadsRemaining}/3`;
  }, [photoReadsRemaining]);

  const handlePhoto = async (kind: "camera" | "gallery") => {
    try {
      setLoading(true);
      if (kind === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Permission required", "Camera access is required to capture study material.");
          return;
        }
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Permission required", "Photo library access is required to choose an image.");
          return;
        }
      }

      const result =
        kind === "camera"
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.35, base64: true })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.35, base64: true });

      if (result.canceled || !result.assets.length || !result.assets[0].base64) {
        return;
      }

      setSelectedImage({
        label: result.assets[0].fileName ?? (kind === "camera" ? "Captured image" : "Selected image"),
        base64: result.assets[0].base64,
        uri: result.assets[0].uri,
        mimeType: result.assets[0].mimeType,
        kind,
      });
    } finally {
      setLoading(false);
    }
  };

  const onExtract = () => {
    if (!selectedImage?.base64) {
      return;
    }

    navigation.navigate("Processing", {
      mode: "photo",
      sourceText: selectedImage.label,
      imageBase64: selectedImage.base64,
      imageUri: selectedImage.uri,
      imageMimeType: selectedImage.mimeType ?? undefined,
    });
  };

  return (
    <ScreenContainer footer={<BottomDock active="Create" navigation={navigation} />}>
      <TopBar leftIcon="settings" onLeftPress={() => navigation.navigate("Settings")} rightIcon="account-circle" onRightPress={() => navigation.navigate("Account")} />

      <ScreenHeader iconName="add-photo-alternate" title="Capture learning" subtitle="Photo or note for tonight's question." />

      <TonightLimitsBar />

      <Pressable style={styles.libraryLink} onPress={() => navigation.navigate("Library")}>
        <MaterialIcons name="auto-stories" size={18} color={colors.primary} />
        <Text style={styles.libraryLinkText}>Use saved learning instead</Text>
        <MaterialIcons name="chevron-right" size={18} color={colors.mutedSoft} />
      </Pressable>

      <SectionRow title="Quick capture" iconName="photo-camera" />
      {photoLimitCopy && photoReadsLocked ? (
        <Text style={[styles.limitNote, styles.limitNoteLocked]}>{photoLimitCopy}</Text>
      ) : null}
      <View style={styles.actions}>
        <Pressable
          disabled={loading || photoReadsLocked}
          style={({ pressed }) => [
            styles.actionHero,
            styles.actionHeroCamera,
            (loading || photoReadsLocked) && styles.actionDisabled,
            pressed && !(loading || photoReadsLocked) && styles.actionPressed,
          ]}
          onPress={() => void handlePhoto("camera")}
        >
          <MaterialIcons name="photo-camera" size={28} color="#FFFFFF" />
          <Text style={styles.actionTitle}>Camera</Text>
        </Pressable>

        <Pressable
          disabled={loading || photoReadsLocked}
          style={({ pressed }) => [
            styles.actionHero,
            styles.actionHeroGallery,
            (loading || photoReadsLocked) && styles.actionDisabled,
            pressed && !(loading || photoReadsLocked) && styles.actionPressed,
          ]}
          onPress={() => void handlePhoto("gallery")}
        >
          <MaterialIcons name="image" size={28} color="#FFFFFF" />
          <Text style={styles.actionTitle}>Gallery</Text>
        </Pressable>
      </View>

      <SectionRow title="Write instead" iconName="edit-note" />
      <Pressable style={({ pressed }) => [styles.writeEntryCard, pressed && styles.actionPressed]} onPress={() => navigation.navigate("CaptureNote")}>
        <MaterialIcons name="edit-note" size={24} color={colors.primary} />
        <View style={styles.writeEntryCopy}>
          <Text style={styles.writeEntryTitle}>Write a note</Text>
          <Text style={styles.writeEntrySubtitle} numberOfLines={1}>
            Type instead of a photo
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={colors.mutedSoft} />
      </Pressable>

      {selectedImage ? (
        <View style={styles.previewSection}>
          <SectionRow title="Preview" iconName="image-search" />
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewLabel}>{selectedImage.kind === "camera" ? "Photo selected" : "Gallery image selected"}</Text>
              <Pressable style={({ pressed }) => [styles.previewActionButton, pressed && styles.inlineButtonPressed]} onPress={() => setSelectedImage(null)}>
                <Text style={styles.previewAction}>Clear</Text>
              </Pressable>
            </View>
            <View style={styles.previewBody}>
              <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
              <View style={styles.previewCopy}>
                <Text style={styles.previewTitle}>{selectedImage.label}</Text>
                <Text style={styles.previewSubtitle}>Looks good? Extract the key points when you&apos;re ready.</Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {canContinue ? (
        <Pressable
          style={({ pressed }) => [
            styles.extractButton,
            (loading || photoReadsLocked) && styles.extractButtonDisabled,
            pressed && !(loading || photoReadsLocked) && styles.extractPressed,
          ]}
          onPress={onExtract}
          disabled={loading || photoReadsLocked}
        >
          <Text style={styles.extractButtonText}>
            {loading ? "Preparing..." : photoReadsLocked ? "Photo reads full for tonight" : "Extract key points"}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.ctaPlaceholder}>
          <Text style={styles.ctaPlaceholderText}>Choose a photo or open the note screen to continue.</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  libraryLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  libraryLinkText: {
    flex: 1,
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  limitNote: {
    marginTop: -4,
    marginBottom: 4,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  limitNoteLocked: {
    color: colors.primary,
  },
  actionHero: {
    flex: 1,
    minHeight: 96,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  actionDisabled: {
    opacity: 0.45,
  },
  actionHeroCamera: {
    backgroundColor: colors.primary,
  },
  actionHeroGallery: {
    backgroundColor: colors.primaryContainer,
  },
  actionTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  writeEntryCard: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  writeEntryCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  writeEntryTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  writeEntrySubtitle: {
    color: colors.muted,
    fontSize: 12,
    flexShrink: 1,
  },
  previewSection: {
    gap: 12,
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  previewLabel: {
    color: colors.primary,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontSize: 12,
  },
  previewActionButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    justifyContent: "center",
    backgroundColor: colors.surfaceLow,
  },
  previewAction: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 13,
  },
  previewBody: {
    gap: 16,
  },
  previewImage: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    backgroundColor: colors.surfaceLow,
  },
  previewCopy: {
    gap: 4,
  },
  previewTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  previewSubtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  extractButton: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 18,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  extractButtonDisabled: {
    opacity: 0.5,
  },
  extractButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  ctaPlaceholder: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,253,248,0.94)",
  },
  ctaPlaceholderText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  actionPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.992 }],
  },
  inlineButtonPressed: {
    opacity: 0.92,
  },
  extractPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.992 }],
  },
});
