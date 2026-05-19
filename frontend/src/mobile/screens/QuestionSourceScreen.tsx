import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenHeader } from "../components/ScreenHeader";
import { ScreenContainer } from "../components/ScreenContainer";
import { TopBar } from "../components/TopBar";
import { useUsageLimits } from "../hooks/useUsageLimits";
import { colors } from "../theme/colors";
import { theme } from "../theme";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Create">;

export function CreateScreen({ navigation }: Props) {
  const usageLimits = useUsageLimits();
  const remainingQuestionsTonight = usageLimits?.question_generation_daily.remaining ?? 3;

  return (
    <ScreenContainer>
      <TopBar
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        rightIcon="account-circle"
        onRightPress={() => navigation.navigate("Account")}
      />

      <ScreenHeader
        iconName="route"
        title="Create tonight's question"
        subtitle={
          remainingQuestionsTonight > 0
            ? `${remainingQuestionsTonight} question${remainingQuestionsTonight === 1 ? "" : "s"} left tonight.`
            : "Tonight's question limit is full."
        }
      />

      <Pressable
        style={({ pressed }) => [
          styles.optionCard,
          styles.optionCardPrimary,
          remainingQuestionsTonight === 0 && styles.optionDisabled,
          pressed && remainingQuestionsTonight > 0 && styles.optionPressed,
        ]}
        onPress={() => {
          if (remainingQuestionsTonight === 0) return;
          navigation.navigate("Capture");
        }}
        disabled={remainingQuestionsTonight === 0}
      >
        <View style={styles.optionIconTile}>
          <MaterialIcons name="add-photo-alternate" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.optionCopy}>
          <Text style={styles.optionTitleLight}>New input</Text>
          <Text style={styles.optionBodyLight}>Photo or note</Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.optionCard,
          styles.optionCardSecondary,
          remainingQuestionsTonight === 0 && styles.optionDisabled,
          pressed && remainingQuestionsTonight > 0 && styles.optionPressed,
        ]}
        onPress={() => {
          if (remainingQuestionsTonight === 0) return;
          navigation.navigate("Library");
        }}
        disabled={remainingQuestionsTonight === 0}
      >
        <View style={[styles.optionIconTile, styles.optionIconTileSecondary]}>
          <MaterialIcons name="auto-stories" size={24} color={colors.primary} />
        </View>
        <View style={styles.optionCopy}>
          <Text style={styles.optionTitleDark}>Saved learning</Text>
          <Text style={styles.optionBodyDark}>From your library</Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={colors.mutedSoft} />
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  optionCard: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 72,
  },
  optionCardPrimary: {
    backgroundColor: colors.primary,
  },
  optionCardSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionIconTile: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconTileSecondary: {
    backgroundColor: colors.surfaceLow,
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionTitleLight: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  optionBodyLight: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
  },
  optionTitleDark: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  optionBodyDark: {
    color: colors.muted,
    fontSize: 12,
  },
  optionPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.992 }],
  },
  optionDisabled: {
    opacity: 0.58,
  },
});
