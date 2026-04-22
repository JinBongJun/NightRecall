import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { BrandWordmark } from "../components/BrandWordmark";
import { ScreenHeader } from "../components/ScreenHeader";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../theme/colors";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "ExtractionHelp">;

export function ExtractionHelpScreen({ route, navigation }: Props) {
  const { imageUri, imageBase64, imageMimeType, detail, sourceText } = route.params;

  const continueManually = () => {
    navigation.replace("MakeQuestions", {
      mode: "photo",
      sourceText: sourceText.trim(),
      extractedPoints: [],
      imageUri,
      imageBase64,
      imageMimeType,
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <BrandWordmark />
        <View style={styles.iconSpacer} />
      </View>

      <ScreenHeader
        title="Extraction needs help"
        subtitle="NightRecall could not pull out useful points from this image yet. You can describe the key idea yourself or try another photo."
      />

      <View style={styles.card}>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.previewImage} /> : null}
        <View style={styles.messageRow}>
          <View style={styles.iconTile}>
            <MaterialIcons name="image-search" size={22} color={colors.primary} />
          </View>
          <View style={styles.messageCopy}>
            <Text style={styles.messageTitle}>What to do next</Text>
            <Text style={styles.messageBody}>
              {detail?.trim().length
                ? detail
                : "If the image is unclear, add one short note yourself and keep going."}
            </Text>
          </View>
        </View>
      </View>

      <ActionButton label="Describe it yourself" onPress={continueManually} variant="primary" />
      <ActionButton label="Try another photo" onPress={() => navigation.goBack()} variant="secondary" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSpacer: {
    width: 40,
    height: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    gap: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 18,
    backgroundColor: colors.surfaceLow,
  },
  messageRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
  },
  messageCopy: {
    flex: 1,
    gap: 4,
  },
  messageTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  messageBody: {
    color: colors.muted,
    lineHeight: 22,
  },
});
