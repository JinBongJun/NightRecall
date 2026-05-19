import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { BottomDock } from "../components/BottomDock";
import { TopBar } from "../components/TopBar";
import { ScreenContainer } from "../components/ScreenContainer";
import { useTonightQuestion } from "../hooks/useTonightQuestion";
import { useUsageLimits } from "../hooks/useUsageLimits";
import { fetchStats } from "../services/statsService";
import { useReminderStore } from "../store/reminderStore";
import { useReviewStore } from "../store/reviewStore";
import { useStatsStore } from "../store/statsStore";
import { colors } from "../theme/colors";
import { theme } from "../theme";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const loadTonightQuestion = useTonightQuestion();
  const usageLimits = useUsageLimits();
  const reminderTime = useReminderStore((state) => state.reminderTime);
  const sessionSource = useReviewStore((state) => state.sessionSource);
  const currentQuestion = useReviewStore((state) => state.currentQuestion);
  const sessionQuestions = useReviewStore((state) => state.sessionQuestions);
  const streak = useStatsStore((state) => state.streak);
  const answeredToday = useStatsStore((state) => state.answeredToday);
  const setStats = useStatsStore((state) => state.setStats);

  const heroAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadTonightQuestion();
      void fetchStats()
        .then((stats) => {
          if (!active) {
            return;
          }

          setStats({
            streak: stats.current_streak,
            totalAnswered: stats.total_answered,
            accuracy: stats.accuracy,
            answeredToday: stats.answered_today,
            recentWrongTopics: stats.recent_wrong_topics,
            answeredDatesThisMonth: stats.answered_dates_this_month,
          });
        })
        .catch(() => {
          // Keep the last known stats if refresh fails.
        });

      return () => {
        active = false;
      };
    }, [loadTonightQuestion, setStats]),
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
  const remainingQuestionsTonight = usageLimits?.question_generation_daily.remaining ?? 3;
  const remainingPhotoReadsTonight = usageLimits?.photo_extract_daily.remaining ?? 3;
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date()),
    [],
  );

  const tonightState = currentQuestion
    ? {
        eyebrow: "Ready",
        title: "Start tonight's recall",
        body:
          queuedQuestionCount > 1
            ? `${queuedQuestionCount} questions queued.`
            : "Pull it back before sleep.",
        primaryLabel: "Start recall",
        primaryAction: () => navigation.navigate("Review", { mode: "auto" }),
        secondaryLabel: remainingQuestionsTonight > 0 ? "Add question" : null,
        secondaryAction: remainingQuestionsTonight > 0 ? () => navigation.navigate("Capture") : null,
      }
    : answeredToday
      ? {
          eyebrow: "Done",
          title: "Tonight's recall is complete",
          body: "Come back tomorrow, or add one more question.",
          primaryLabel: null,
          primaryAction: null,
          secondaryLabel: remainingQuestionsTonight > 0 ? "Add question" : null,
          secondaryAction: remainingQuestionsTonight > 0 ? () => navigation.navigate("Capture") : null,
        }
      : {
          eyebrow: "Tonight",
          title: "Make a question for tonight",
          body: "Photo, note, or saved learning — one focused recall.",
          primaryLabel: "Create question",
          primaryAction: () => navigation.navigate("Capture"),
          secondaryLabel: "Saved learning",
          secondaryAction: () => navigation.navigate("Library"),
        };

  return (
    <ScreenContainer footer={<BottomDock active="Home" navigation={navigation} />}>
      <TopBar
        leftIcon="settings"
        onLeftPress={() => navigation.navigate("Settings")}
        rightIcon="account-circle"
        onRightPress={() => navigation.navigate("Account")}
      />

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

        <View style={styles.summaryStrip}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>{remainingQuestionsTonight}</Text>
            <Text style={styles.summaryText}>Questions</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>{remainingPhotoReadsTonight}</Text>
            <Text style={styles.summaryText}>Photos</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>{queuedQuestionCount}</Text>
            <Text style={styles.summaryText}>Ready</Text>
          </View>
        </View>

        <Text style={styles.streakText}>{streak}-day streak</Text>

        <View style={styles.tonightCopy}>
          <Text style={styles.tonightEyebrow}>{tonightState.eyebrow}</Text>
          <Text style={styles.tonightTitle}>{tonightState.title}</Text>
          <Text style={styles.tonightBody}>{tonightState.body}</Text>
        </View>

        {tonightState.primaryLabel && tonightState.primaryAction ? (
          <View style={styles.heroActions}>
            <Pressable style={styles.heroPrimaryButton} onPress={tonightState.primaryAction}>
              <Text style={styles.heroPrimaryText}>{tonightState.primaryLabel}</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
            </Pressable>

            {tonightState.secondaryLabel && tonightState.secondaryAction ? (
              <Pressable style={styles.heroSecondaryButton} onPress={tonightState.secondaryAction}>
                <Text style={styles.heroSecondaryText}>{tonightState.secondaryLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : tonightState.secondaryLabel && tonightState.secondaryAction ? (
          <Pressable style={styles.heroPrimaryButton} onPress={tonightState.secondaryAction}>
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
    fontSize: 12,
    fontWeight: "700",
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reminderText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  summaryStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceLow,
    borderRadius: theme.radius.md,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  summaryStat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  summaryValue: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "800",
  },
  summaryText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  summaryDivider: {
    width: 1,
    height: 26,
    backgroundColor: colors.line,
  },
  streakText: {
    color: colors.mutedSoft,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  tonightCopy: {
    gap: 3,
    paddingTop: 2,
  },
  tonightEyebrow: {
    color: colors.mutedSoft,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tonightTitle: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
  },
  tonightBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  heroActions: {
    gap: 8,
    paddingTop: 4,
  },
  heroPrimaryButton: {
    minHeight: 44,
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
    fontSize: 15,
    fontWeight: "800",
  },
  heroSecondaryButton: {
    minHeight: 40,
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
    fontSize: 13,
    fontWeight: "700",
  },
});
