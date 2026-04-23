import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CenteredHeroCard } from "../components/CenteredHeroCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { ScreenContainer } from "../components/ScreenContainer";
import { TopBar } from "../components/TopBar";
import { useUsageLimits } from "../hooks/useUsageLimits";
import { useReviewStore } from "../store/reviewStore";
import { colors } from "../theme/colors";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Create">;

export function CreateScreen({ navigation }: Props) {
  const usageLimits = useUsageLimits();
  const currentQuestion = useReviewStore((state) => state.currentQuestion);
  const sessionQuestions = useReviewStore((state) => state.sessionQuestions);
  const activeQuestionCount = sessionQuestions.length ? sessionQuestions.length : currentQuestion ? 1 : 0;
  const remainingQuestionsTonight = usageLimits?.question_generation_daily.remaining ?? 3;

  return (
    <ScreenContainer>
      <TopBar leftIcon="arrow-back" onLeftPress={() => navigation.goBack()} />

      <ScreenHeader
        title="Create tonight's question"
        subtitle="Start with something new, or use saved learning from your library."
      />

      <CenteredHeroCard
        badgeLabel="Tonight"
        title={`${remainingQuestionsTonight} of 3 questions left`}
        body={
          remainingQuestionsTonight === 0
            ? "You already made 3 questions tonight."
            : activeQuestionCount > 0
            ? `${activeQuestionCount} question${activeQuestionCount > 1 ? "s are" : " is"} already ready.`
            : "Nothing is queued yet."
        }
        tone="neutral"
        iconName="schedule"
      />

      <Pressable
        style={({ pressed }) => [styles.optionCard, styles.optionCardPrimary, remainingQuestionsTonight === 0 && styles.optionDisabled, pressed && remainingQuestionsTonight > 0 && styles.optionPressed]}
        onPress={() => {
          if (remainingQuestionsTonight === 0) return;
          navigation.navigate("Capture");
        }}
        disabled={remainingQuestionsTonight === 0}
      >
        <View style={styles.optionGlow} />
        <View style={styles.optionOrbit} />
        <View style={styles.optionIconTile}>
          <MaterialIcons name="add-photo-alternate" size={28} color="#FFFFFF" />
        </View>
        <View style={styles.optionCopy}>
          <Text style={styles.optionTitleLight}>Start from new input</Text>
          <Text style={styles.optionBodyLight}>Take a photo or write a note, then turn it into tonight&apos;s questions.</Text>
        </View>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.optionCard, styles.optionCardSecondary, remainingQuestionsTonight === 0 && styles.optionDisabled, pressed && remainingQuestionsTonight > 0 && styles.optionPressed]}
        onPress={() => {
          if (remainingQuestionsTonight === 0) return;
          navigation.navigate("Library");
        }}
        disabled={remainingQuestionsTonight === 0}
      >
        <View style={styles.optionOrbitSoft} />
        <View style={[styles.optionIconTile, styles.optionIconTileSecondary]}>
          <MaterialIcons name="auto-stories" size={28} color={colors.primary} />
        </View>
        <View style={styles.optionCopy}>
          <Text style={styles.optionTitleDark}>Use saved learning</Text>
          <Text style={styles.optionBodyDark}>Pick something you saved before and shape one fresh question from it.</Text>
        </View>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  optionCard: {
    borderRadius: 30,
    padding: 22,
    gap: 18,
    overflow: "hidden",
    minHeight: 190,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  optionCardPrimary: {
    backgroundColor: colors.primary,
  },
  optionCardSecondary: {
    backgroundColor: "rgba(255,253,248,0.94)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionGlow: {
    position: "absolute",
    top: -60,
    width: 220,
    height: 170,
    borderRadius: 999,
    backgroundColor: "rgba(255,248,236,0.12)",
  },
  optionOrbit: {
    position: "absolute",
    right: -52,
    bottom: -72,
    width: 180,
    height: 180,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  optionOrbitSoft: {
    position: "absolute",
    right: -46,
    top: -34,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(213,230,220,0.18)",
  },
  optionIconTile: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconTileSecondary: {
    backgroundColor: colors.surfaceLow,
    borderColor: "rgba(18,67,67,0.08)",
  },
  optionCopy: {
    gap: 8,
  },
  optionTitleLight: {
    color: "#FFFFFF",
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  optionBodyLight: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    lineHeight: 23,
  },
  optionTitleDark: {
    color: colors.text,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  optionBodyDark: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
  },
  optionPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.992 }],
  },
  optionDisabled: {
    opacity: 0.58,
  },
});
