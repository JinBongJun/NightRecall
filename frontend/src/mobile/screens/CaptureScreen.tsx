import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { BottomDock } from "../components/BottomDock";
import { SectionRow } from "../components/SectionRow";
import { ScreenHeader } from "../components/ScreenHeader";
import { ScreenContainer } from "../components/ScreenContainer";
import { TopBar } from "../components/TopBar";
import { fetchUsageLimits } from "../services/usageService";
import { colors } from "../theme/colors";
import { UsageLimitsResponse } from "../types/api";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Capture">;

export function CaptureScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [usageLimits, setUsageLimits] = useState<UsageLimitsResponse | null>(null);
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

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void fetchUsageLimits()
        .then((limits) => {
          if (active) {
            setUsageLimits(limits);
          }
        })
        .catch(() => {
          // Keep the flow permissive if we cannot load limits; backend still enforces them.
        });

      return () => {
        active = false;
      };
    }, []),
  );

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
    <ScreenContainer footer={<BottomDock active="Capture" navigation={navigation} />}>
      <TopBar leftIcon="settings" onLeftPress={() => navigation.navigate("Settings")} rightIcon="account-circle" onRightPress={() => navigation.navigate("Profile")} />

      <ScreenHeader
        title="Capture today's learning"
        subtitle="Import notes, slides, photos, or quick ideas to prepare tonight's question."
      />

      <SectionRow title="Quick capture" />
      {photoLimitCopy ? <Text style={[styles.limitNote, photoReadsLocked && styles.limitNoteLocked]}>{photoLimitCopy}</Text> : null}
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
          <View style={styles.actionIconTile}>
            <MaterialIcons name="photo-camera" size={34} color="#FFFFFF" />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Take photo</Text>
            <Text style={styles.actionSubtitle}>Capture from camera</Text>
          </View>
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
          <View style={styles.actionIconTile}>
            <MaterialIcons name="image" size={34} color="#FFFFFF" />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Gallery</Text>
            <Text style={styles.actionSubtitle}>Choose an image</Text>
          </View>
        </Pressable>
      </View>

      <SectionRow title="Write instead" />
      <Pressable style={({ pressed }) => [styles.writeEntryCard, pressed && styles.actionPressed]} onPress={() => navigation.navigate("CaptureNote")}>
        <View style={styles.writeEntryIconTile}>
          <MaterialIcons name="edit-note" size={34} color={colors.primary} />
        </View>
        <View style={styles.writeEntryCopy}>
          <Text style={styles.writeEntryTitle}>Write it down</Text>
          <Text style={styles.writeEntrySubtitle} numberOfLines={2}>
            Open a dedicated note screen, then extract the useful point.
          </Text>
        </View>
      </Pressable>

      {selectedImage ? (
        <View style={styles.previewSection}>
          <SectionRow title="Preview" />
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
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  limitNote: {
    marginTop: 10,
    marginBottom: 10,
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  limitNoteLocked: {
    color: colors.primary,
  },
  actionHero: {
    flex: 1,
    minHeight: 146,
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 18,
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
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
  actionIconTile: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionCopy: {
    gap: 5,
  },
  actionTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
  },
  actionSubtitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 140,
  },
  writeEntryCard: {
    borderRadius: 28,
    backgroundColor: "rgba(255,253,248,0.94)",
    paddingHorizontal: 22,
    paddingVertical: 20,
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  writeEntryCopy: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  writeEntryIconTile: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
  },
  writeEntryTitle: {
    color: colors.primary,
    fontSize: 21,
    fontWeight: "800",
  },
  writeEntrySubtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
  },
  previewSection: {
    gap: 12,
  },
  previewCard: {
    backgroundColor: "rgba(255,253,248,0.94)",
    borderRadius: 24,
    padding: 20,
    gap: 16,
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
    height: 220,
    borderRadius: 18,
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
    minHeight: 58,
    borderRadius: 22,
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
    fontSize: 18,
    fontWeight: "800",
  },
  ctaPlaceholder: {
    minHeight: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,253,248,0.94)",
  },
  ctaPlaceholderText: {
    color: colors.muted,
    fontSize: 15,
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
