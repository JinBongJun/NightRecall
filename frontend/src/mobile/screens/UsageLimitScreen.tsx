import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { BrandWordmark } from "../components/BrandWordmark";
import { ScreenHeader } from "../components/ScreenHeader";
import { ScreenContainer } from "../components/ScreenContainer";
import { useReviewStore } from "../store/reviewStore";
import { colors } from "../theme/colors";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "UsageLimit">;

export function UsageLimitScreen({ route, navigation }: Props) {
  const currentQuestion = useReviewStore((state) => state.currentQuestion);
  const sessionQuestions = useReviewStore((state) => state.sessionQuestions);
  const hasReviewReady = sessionQuestions.length > 0 || Boolean(currentQuestion);

  const isPhotoLimit = route.params.reason === "photo_extract";
  const title = isPhotoLimit ? "That's enough photo reads for tonight" : "You're set for tonight";
  const subtitle = isPhotoLimit
    ? "You can still write the key point yourself and keep tonight moving."
    : route.params.reason === "question_generation_monthly"
      ? "You already made enough fresh question sets this month. You can keep reviewing what's ready."
      : "You already made enough fresh question sets for tonight. You can keep reviewing what's ready.";

  const iconName = isPhotoLimit ? "photo-library" : "nights-stay";
  const primaryLabel = isPhotoLimit ? "Write it down instead" : hasReviewReady ? "Review what's ready" : "Go home";
  const primaryAction = () => {
    if (isPhotoLimit) {
      navigation.replace("MakeQuestions", {
        mode: "photo",
        sourceText: route.params.sourceText ?? "",
        extractedPoints: [],
        imageUri: route.params.imageUri,
        imageBase64: route.params.imageBase64,
        imageMimeType: route.params.imageMimeType,
      });
      return;
    }
    if (hasReviewReady) {
      navigation.replace("Home");
      return;
    }
    navigation.navigate("Home");
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

      <ScreenHeader title={title} subtitle={subtitle} />

      <View style={styles.card}>
        <View style={styles.messageRow}>
          <View style={styles.iconTile}>
            <MaterialIcons name={iconName} size={24} color={colors.primary} />
          </View>
          <View style={styles.messageCopy}>
            <Text style={styles.messageTitle}>{isPhotoLimit ? "Keep the loop light" : "Keep the loop going"}</Text>
            <Text style={styles.messageBody}>
              {isPhotoLimit
                ? "Tonight's new photo reads are set. Add one short note yourself, or come back tomorrow for a fresh image pass."
                : "Your new question sets are already in a good place. Review what's ready now, or come back tomorrow for a fresh start."}
            </Text>
          </View>
        </View>
      </View>

      <ActionButton label={primaryLabel} onPress={primaryAction} variant="primary" />
      {!isPhotoLimit ? <ActionButton label="Go to library" onPress={() => navigation.navigate("Library")} variant="secondary" /> : null}
      <ActionButton label="Not now" onPress={() => navigation.navigate("Home")} variant="tertiary" />
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
