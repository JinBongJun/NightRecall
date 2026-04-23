import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { BottomDock } from "../components/BottomDock";
import { SectionRow } from "../components/SectionRow";
import { TopBar } from "../components/TopBar";
import { ScreenContainer } from "../components/ScreenContainer";
import { useTonightQuestion } from "../hooks/useTonightQuestion";
import { useUsageLimits } from "../hooks/useUsageLimits";
import { fetchStats } from "../services/statsService";
import { useReminderStore } from "../store/reminderStore";
import { useReviewStore } from "../store/reviewStore";
import { useStatsStore } from "../store/statsStore";
import { colors } from "../theme/colors";
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
  const cardsAnim = useRef(new Animated.Value(0)).current;

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
    cardsAnim.setValue(0);

    Animated.stagger(90, [
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(cardsAnim, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardsAnim, heroAnim]);

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
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
      }).format(new Date()),
    [],
  );

  const tonightState = currentQuestion
    ? {
        eyebrow: "Tonight is ready",
        title: "Start your recall while it is still fresh",
        body:
          queuedQuestionCount > 1
            ? `${queuedQuestionCount} questions are queued. Start with the first one and keep the streak moving.`
            : "Take 20 seconds before sleep and pull it back.",
        primaryLabel: "Start recall",
        primaryAction: () => navigation.navigate("Review", { mode: "auto" }),
        secondaryLabel: remainingQuestionsTonight > 0 ? "Create another question" : null,
        secondaryAction: remainingQuestionsTonight > 0 ? () => navigation.navigate("Create") : null,
      }
    : answeredToday
      ? {
          eyebrow: "Tonight complete",
          title: "You already finished tonight's recall",
          body: "Your nightly review is done. You can stop here or make one more prompt for tomorrow.",
          primaryLabel: null,
          primaryAction: null,
          secondaryLabel: remainingQuestionsTonight > 0 ? "Create another question" : null,
          secondaryAction: remainingQuestionsTonight > 0 ? () => navigation.navigate("Create") : null,
        }
      : {
          eyebrow: "Prepare tonight",
          title: "Make your next question before the day fades",
          body: "Start with a photo, note, or saved learning and turn it into a single focused recall.",
          primaryLabel: "Create tonight's question",
          primaryAction: () => navigation.navigate("Create"),
          secondaryLabel: "Use saved learning",
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
          styles.headerSection,
          {
            opacity: heroAnim,
            transform: [
              {
                translateY: heroAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeCopy}>
            <Text style={styles.dateLabel}>{todayLabel}</Text>
            <Text style={styles.welcomeTitle}>Keep tonight clear.</Text>
            <Text style={styles.welcomeSubtitle}>One prompt, one recall, one steady habit before sleep.</Text>
          </View>

          <View style={styles.reminderRow}>
            <MaterialIcons name="schedule" size={16} color={colors.primary} />
            <Text style={styles.reminderText}>Reminder at {reminderTime}</Text>
          </View>

          <View style={styles.summaryStrip}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{remainingQuestionsTonight}</Text>
              <Text style={styles.summaryText}>Questions left</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{streak}</Text>
              <Text style={styles.summaryText}>Day streak</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{queuedQuestionCount}</Text>
              <Text style={styles.summaryText}>Ready now</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.contentStack,
          {
            opacity: cardsAnim,
            transform: [
              {
                translateY: cardsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <SectionRow title="Tonight" />

        <View style={styles.tonightCard}>
          <View style={styles.tonightCardHeader}>
            <View style={styles.tonightIconWrap}>
              <MaterialIcons name="psychology" size={24} color={colors.primary} />
            </View>
            <View style={styles.tonightCopy}>
              <Text style={styles.tonightEyebrow}>{tonightState.eyebrow}</Text>
              <Text style={styles.tonightTitle}>{tonightState.title}</Text>
              <Text style={styles.tonightBody}>{tonightState.body}</Text>
            </View>
          </View>

          {tonightState.primaryLabel && tonightState.primaryAction ? (
            <View style={styles.heroActions}>
              <Pressable style={styles.heroPrimaryButton} onPress={tonightState.primaryAction}>
                <Text style={styles.heroPrimaryText}>{tonightState.primaryLabel}</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>

              {tonightState.secondaryLabel && tonightState.secondaryAction ? (
                <Pressable style={styles.heroSecondaryButton} onPress={tonightState.secondaryAction}>
                  <Text style={styles.heroSecondaryText}>{tonightState.secondaryLabel}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.scheduleCard,
            remainingQuestionsTonight === 0 && styles.scheduleCardDisabled,
            pressed && remainingQuestionsTonight > 0 && styles.cardPressed,
          ]}
          onPress={() => {
            if (remainingQuestionsTonight === 0) {
              return;
            }
            navigation.navigate("Create");
          }}
          disabled={remainingQuestionsTonight === 0}
        >
          <View style={styles.scheduleImageStub}>
            <MaterialIcons name="add-photo-alternate" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.scheduleCopy}>
            <Text style={styles.scheduleTitle}>Create another prompt for tonight</Text>
            <Text style={styles.scheduleBody}>Capture a note or photo and turn it into one clean question.</Text>
            <Text style={styles.scheduleMeta}>
              {remainingQuestionsTonight === 0
                ? "Tonight's questions are full"
                : `${remainingQuestionsTonight} question${remainingQuestionsTonight === 1 ? "" : "s"} left tonight`}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    marginBottom: 4,
  },
  welcomeCard: {
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  welcomeCopy: {
    gap: 4,
  },
  dateLabel: {
    color: colors.mutedSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  welcomeTitle: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  welcomeSubtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reminderText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  summaryStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceLow,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  summaryStat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  summaryValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "800",
  },
  summaryText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  summaryDivider: {
    width: 1,
    height: 42,
    backgroundColor: colors.line,
  },
  contentStack: {
    gap: 16,
  },
  tonightCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 22,
    gap: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tonightCardHeader: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  tonightIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
  },
  tonightCopy: {
    flex: 1,
    gap: 4,
  },
  tonightEyebrow: {
    color: colors.mutedSoft,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  tonightTitle: {
    color: colors.text,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "800",
  },
  tonightBody: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  heroActions: {
    gap: 12,
  },
  heroPrimaryButton: {
    minHeight: 54,
    backgroundColor: colors.primary,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
  },
  heroPrimaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  heroSecondaryButton: {
    minHeight: 52,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroSecondaryText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.992 }],
  },
  scheduleCard: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  scheduleCardDisabled: {
    opacity: 0.68,
  },
  scheduleImageStub: {
    height: 130,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleCopy: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 6,
  },
  scheduleTitle: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
  },
  scheduleBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  scheduleMeta: {
    color: colors.tertiary,
    fontSize: 13,
    fontWeight: "700",
  },
});
