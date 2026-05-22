import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { TopBar } from "../components/TopBar";
import { navigateToAccount, navigateToCapture, navigateToLibrary, navigateToReview } from "../navigation/navigationHelpers";
import type { HomeStackParamList } from "../navigation/types";
import { ScreenContainer } from "../components/ScreenContainer";
import { useStatsRefresh } from "../hooks/useStatsRefresh";
import { useTonightQuestion } from "../hooks/useTonightQuestion";
import { useUsageLimits } from "../hooks/useUsageLimits";
import {
  formatAddAnotherLabel,
  formatTonightLimitsLine,
  remainingQuestionGenerations,
} from "../utils/usageLimitDisplay";
import { useReminderStore } from "../store/reminderStore";
import { useReviewStore } from "../store/reviewStore";
import { useStatsStore } from "../store/statsStore";
import { colors } from "../theme/colors";
import { theme } from "../theme";
type Props = NativeStackScreenProps<HomeStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const loadTonightQuestion = useTonightQuestion();
  const usageLimits = useUsageLimits();
  const reminderTime = useReminderStore((state) => state.reminderTime);
  const sessionSource = useReviewStore((state) => state.sessionSource);
  const currentQuestion = useReviewStore((state) => state.currentQuestion);
  const sessionQuestions = useReviewStore((state) => state.sessionQuestions);
  const streak = useStatsStore((state) => state.streak);
  const answeredToday = useStatsStore((state) => state.answeredToday);

  const heroAnim = useRef(new Animated.Value(0)).current;

  useStatsRefresh();

  useFocusEffect(
    useCallback(() => {
      void loadTonightQuestion();
    }, [loadTonightQuestion]),
  );

  useEffect(() => {
    heroAnim.setValue(0);
    Animated.timing(heroAnim, {
      toValue: 1,
      duration: 360,
      useNativeDriver: true,
    }).start();
  }, [heroAnim]);

  const queuedQuestionCount =
    sessionSource === "local"
      ? sessionQuestions.length
        ? sessionQuestions.length
        : currentQuestion
          ? 1
          : 0
      : currentQuestion
        ? 1
        : 0;

  const remainingQuestionsTonight = remainingQuestionGenerations(usageLimits);
  const addAnotherLabel = formatAddAnotherLabel(remainingQuestionsTonight);
  const canAddQuestionTonight = Boolean(addAnotherLabel);
  const limitsLine = formatTonightLimitsLine(usageLimits);
  const ritualStatus = answeredToday ? "1/1 tonight" : "0/1 tonight";

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date()),
    [],
  );

  const readyStatusLabel =
    queuedQuestionCount > 0
      ? `${queuedQuestionCount} ready for recall`
      : answeredToday
        ? ritualStatus
        : "Nothing ready yet";

  const tonightState = currentQuestion
    ? {
        eyebrow: "Ready",
        title: "Start tonight's recall",
        body:
          queuedQuestionCount > 1
            ? `${queuedQuestionCount} questions queued.`
            : "Pull it back before sleep.",
        primaryLabel: "Start recall",
        primaryAction: () => navigateToReview(navigation, "auto"),
        secondaryLabel: canAddQuestionTonight ? addAnotherLabel : null,
        secondaryAction: canAddQuestionTonight ? () => navigateToCapture(navigation) : null,
      }
    : answeredToday
      ? {
          eyebrow: "Done",
          title: "Tonight's recall is complete",
          body: "Come back tomorrow, or capture one more if you still have room.",
          primaryLabel: null,
          primaryAction: null,
          secondaryLabel: canAddQuestionTonight ? addAnotherLabel : null,
          secondaryAction: canAddQuestionTonight ? () => navigateToCapture(navigation) : null,
        }
      : {
          eyebrow: "Tonight",
          title: "Capture learning for tonight",
          body: "Photo, note, or saved learning — one focused recall.",
          primaryLabel: "Capture for tonight",
          primaryAction: () => navigateToCapture(navigation),
          secondaryLabel: "Saved learning",
          secondaryAction: () => navigateToLibrary(navigation),
        };

  return (
    <ScreenContainer>
      <TopBar rightIcon="account-circle" onRightPress={() => navigateToAccount(navigation)} />

      <Animated.View
        style={[
          styles.tonightCard,
          {
            opacity: heroAnim,
            transform: [
              {
                translateY: heroAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.cardTop}>
          <Text style={styles.dateLabel}>{todayLabel}</Text>
          <View style={styles.reminderRow}>
            <MaterialIcons name="schedule" size={14} color={colors.primary} />
            <Text style={styles.reminderText}>{reminderTime}</Text>
          </View>
        </View>

        <Pressable
          style={styles.streakCard}
          onPress={() => navigation.navigate("Stats")}
          accessibilityRole="button"
          accessibilityLabel={`${streak} night streak. View progress.`}
        >
          <View style={styles.streakMain}>
            <MaterialIcons name="local-fire-department" size={22} color={colors.primary} />
            <View style={styles.streakCopy}>
              <Text style={styles.streakValue}>{streak}</Text>
              <Text style={styles.streakUnit}>night streak</Text>
            </View>
          </View>
          <View style={styles.streakMeta}>
            <Text style={styles.ritualText}>{ritualStatus}</Text>
            <Text style={styles.statsLink}>Progress</Text>
          </View>
        </Pressable>

        <View style={styles.statusChip}>
          <Text style={styles.statusChipText}>{readyStatusLabel}</Text>
        </View>

        {limitsLine ? <Text style={styles.limitsLine}>{limitsLine}</Text> : null}

        <View style={styles.tonightCopy}>
          <Text style={styles.tonightEyebrow}>{tonightState.eyebrow}</Text>
          <Text style={styles.tonightTitle}>{tonightState.title}</Text>
          <Text style={styles.tonightBody}>{tonightState.body}</Text>
        </View>

        {tonightState.primaryLabel && tonightState.primaryAction ? (
          <View style={styles.heroActions}>
            <Pressable
              style={styles.heroPrimaryButton}
              onPress={tonightState.primaryAction}
              accessibilityRole="button"
              accessibilityLabel={tonightState.primaryLabel}
            >
              <Text style={styles.heroPrimaryText}>{tonightState.primaryLabel}</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
            </Pressable>

            {tonightState.secondaryLabel && tonightState.secondaryAction ? (
              <Pressable
                style={styles.heroSecondaryButton}
                onPress={tonightState.secondaryAction}
                accessibilityRole="button"
                accessibilityLabel={tonightState.secondaryLabel}
              >
                <Text style={styles.heroSecondaryText}>{tonightState.secondaryLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : tonightState.secondaryLabel && tonightState.secondaryAction ? (
          <Pressable
            style={styles.heroPrimaryButton}
            onPress={tonightState.secondaryAction}
            accessibilityRole="button"
            accessibilityLabel={tonightState.secondaryLabel}
          >
            <Text style={styles.heroPrimaryText}>{tonightState.secondaryLabel}</Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tonightCard: {
    backgroundColor: colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateLabel: {
    color: colors.mutedSoft,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "700",
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reminderText: {
    color: colors.primary,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "700",
  },
  streakCard: {
    backgroundColor: colors.surfaceLow,
    borderRadius: theme.radius.md,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  streakMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  streakCopy: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  streakValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 26,
  },
  streakUnit: {
    color: colors.muted,
    fontSize: theme.typography.body.fontSize,
    fontWeight: "700",
  },
  streakMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ritualText: {
    color: colors.mutedSoft,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "700",
  },
  statsLink: {
    color: colors.primary,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "800",
  },
  statusChip: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(15,76,63,0.12)",
  },
  statusChipText: {
    color: colors.secondary,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "800",
  },
  limitsLine: {
    color: colors.muted,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "600",
    lineHeight: theme.typography.caption.lineHeight,
  },
  tonightCopy: {
    gap: 6,
    paddingTop: 2,
  },
  tonightEyebrow: {
    color: colors.mutedSoft,
    fontSize: theme.typography.micro.fontSize,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tonightTitle: {
    color: colors.text,
    fontSize: theme.typography.title.fontSize,
    lineHeight: theme.typography.title.lineHeight,
    fontWeight: "800",
  },
  tonightBody: {
    color: colors.muted,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
  },
  heroActions: {
    gap: theme.spacing.sm,
    paddingTop: 4,
  },
  heroPrimaryButton: {
    minHeight: theme.control.buttonMinHeight,
    backgroundColor: colors.primary,
    borderRadius: theme.radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  heroPrimaryText: {
    color: "#FFFFFF",
    fontSize: theme.typography.button.fontSize,
    fontWeight: theme.typography.button.fontWeight,
  },
  heroSecondaryButton: {
    minHeight: theme.control.buttonMinHeightCompact,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroSecondaryText: {
    color: colors.primary,
    fontSize: theme.typography.body.fontSize,
    fontWeight: "700",
  },
});
