import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { TopBar } from "../components/TopBar";
import { ScreenContainer } from "../components/ScreenContainer";
import { useStatsStore } from "../store/statsStore";
import { colors } from "../theme/colors";
import { theme } from "../theme";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Stats">;

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function StatsScreen({ navigation }: Props) {
  const streak = useStatsStore((state) => state.streak);
  const totalAnswered = useStatsStore((state) => state.totalAnswered);
  const accuracy = useStatsStore((state) => state.accuracy);
  const answeredToday = useStatsStore((state) => state.answeredToday);
  const answeredDatesThisMonth = useStatsStore((state) => state.answeredDatesThisMonth);

  const today = new Date();
  const currentMonthLabel = today.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const completedDateKeys = new Set(answeredDatesThisMonth);
  const calendarDays = buildCalendarDays(today, completedDateKeys, answeredToday);
  const ritualStatus = answeredToday ? "1/1" : "0/1";

  return (
    <ScreenContainer>
      <TopBar leftIcon="arrow-back" onLeftPress={() => navigation.goBack()} title="Stats" />

      <View style={styles.header}>
        <Text style={styles.sectionEyebrow}>Progress</Text>
        <Text style={styles.title}>Streak & recall</Text>
        <Text style={styles.subtitle}>How your nightly habit is going.</Text>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroContent}>
          <Text style={styles.heroLabel}>Current streak</Text>
          <View style={styles.heroValueRow}>
            <Text style={styles.heroValue}>{streak}</Text>
            <Text style={styles.heroUnit}>nights</Text>
          </View>
          <Text style={styles.heroBody}>{answeredToday ? "You checked in tonight." : "Still time to recall tonight."}</Text>
          <View style={styles.heroStatusRow}>
            <View style={[styles.heroStatusDot, answeredToday ? styles.heroStatusDotOn : styles.heroStatusDotOff]} />
            <Text style={styles.heroStatusText}>{`${ritualStatus} tonight`}</Text>
          </View>
        </View>
        <View style={styles.heroIconWrap}>
          <MaterialIcons name="local-fire-department" size={28} color="rgba(255,255,255,0.35)" />
        </View>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <View>
            <Text style={styles.calendarTitle}>This month</Text>
            <Text style={styles.calendarHelper}>Highlighted nights show when you completed recall this month.</Text>
          </View>
          <Text style={styles.calendarMonth}>{currentMonthLabel}</Text>
        </View>

        <View style={styles.calendarWeekHeader}>
          {WEEKDAY_LABELS.map((label) => (
            <Text key={label} style={styles.calendarWeekday}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            const isCompleted = day.state === "complete" || day.state === "today_complete";
            const isTodayComplete = day.state === "today_complete";
            const isTodayPending = day.state === "today_pending";
            return (
              <View
                key={`${day.isoKey ?? "empty"}-${index}`}
                style={[
                  styles.calendarCell,
                  day.inCurrentMonth && styles.calendarCellActiveMonth,
                  isCompleted && styles.calendarCellCompleted,
                  isTodayComplete && styles.calendarCellTodayComplete,
                  isTodayPending && styles.calendarCellTodayPending,
                ]}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    !day.inCurrentMonth && styles.calendarDayTextOutside,
                    isCompleted && styles.calendarDayTextCompleted,
                    isTodayComplete && styles.calendarDayTextTodayComplete,
                    isTodayPending && styles.calendarDayTextTodayPending,
                  ]}
                >
                  {day.dayNumber}
                </Text>
                {day.inCurrentMonth ? (
                  <View
                    style={[
                      styles.calendarDot,
                      isCompleted && styles.calendarDotCompleted,
                      isTodayComplete && styles.calendarDotTodayComplete,
                      isTodayPending && styles.calendarDotTodayPending,
                    ]}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          label="Ritual status"
          value={ritualStatus}
          helper=""
          icon="radio-button-checked"
        />
        <StatCard
          label="Memory Accuracy"
          value={`${Math.round(accuracy * 100)}%`}
          helper=""
          icon="track-changes"
        />
        <StatCard
          label="Total recalled"
          value={formatCount(totalAnswered)}
          helper=""
          icon="timeline"
        />
      </View>

      <View style={styles.footerNoteWrap}>
        <Text style={styles.footerNote}>NightRecall works best when you come back before it fades.</Text>
      </View>
    </ScreenContainer>
  );
}

function StatCard({
  label,
  value,
  helper,
  fullWidth = false,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  fullWidth?: boolean;
  icon: keyof typeof MaterialIcons.glyphMap;
}) {
  return (
    <View style={[styles.statCard, fullWidth && styles.statCardFull]}>
      <View style={styles.statRowLeft}>
        <View style={styles.statIconWrap}>
          <MaterialIcons name={icon} size={16} color={colors.primary} />
        </View>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <View style={styles.statRowRight}>
        <Text style={styles.statValue}>{value}</Text>
        {helper ? <Text style={styles.statHelper}>{helper}</Text> : null}
      </View>
    </View>
  );
}

type CalendarCell = {
  dayNumber: number;
  inCurrentMonth: boolean;
  isoKey: string | null;
  state: "inactive" | "complete" | "today_complete" | "today_pending";
};

function buildCalendarDays(today: Date, completedDateKeys: Set<string>, answeredToday: boolean): CalendarCell[] {
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];
  const todayKey = toDateKey(today);

  for (let index = 0; index < firstWeekday; index += 1) {
    const dayNumber = daysInPrevMonth - firstWeekday + index + 1;
    cells.push({
      dayNumber,
      inCurrentMonth: false,
      isoKey: null,
      state: "inactive",
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const current = new Date(year, month, day);
    const isoKey = toDateKey(current);
    const isToday = isoKey === todayKey;
    const isCompleted = completedDateKeys.has(isoKey);
    cells.push({
      dayNumber: day,
      inCurrentMonth: true,
      isoKey,
      state: isCompleted ? (isToday ? "today_complete" : "complete") : isToday && !answeredToday ? "today_pending" : "inactive",
    });
  }

  while (cells.length % 7 !== 0) {
    const nextDay = cells.length - (firstWeekday + daysInMonth) + 1;
    cells.push({
      dayNumber: nextDay,
      inCurrentMonth: false,
      isoKey: null,
      state: "inactive",
    });
  }

  return cells;
}

function toDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  sectionEyebrow: {
    color: colors.mutedSoft,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: theme.typography.title.fontSize,
    fontWeight: "800",
    lineHeight: theme.typography.title.lineHeight,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroContent: {
    flex: 1,
    gap: 6,
  },
  heroLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  heroValueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  heroValue: {
    color: "#FFFFFF",
    fontSize: 44,
    lineHeight: 48,
    fontWeight: "800",
    letterSpacing: -1,
  },
  heroUnit: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  heroBody: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  heroStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  heroStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  heroStatusDotOn: {
    backgroundColor: colors.primarySoft,
  },
  heroStatusDotOff: {
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  heroStatusText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "700",
  },
  heroIconWrap: {
    justifyContent: "center",
    paddingLeft: 4,
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  calendarTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  calendarHelper: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
    maxWidth: 200,
  },
  calendarMonth: {
    color: colors.mutedSoft,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  calendarWeekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 0,
  },
  calendarWeekday: {
    width: 36,
    textAlign: "center",
    color: colors.mutedSoft,
    fontSize: 10,
    fontWeight: "700",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 6,
  },
  calendarCell: {
    width: 36,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  calendarCellActiveMonth: {
    backgroundColor: "transparent",
  },
  calendarCellCompleted: {
    backgroundColor: "transparent",
  },
  calendarCellTodayComplete: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: "rgba(18,67,67,0.12)",
  },
  calendarCellTodayPending: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceLow,
  },
  calendarDayText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  calendarDayTextOutside: {
    color: colors.mutedSoft,
    opacity: 0.35,
  },
  calendarDayTextCompleted: {
    color: "rgba(18,67,67,0.85)",
  },
  calendarDayTextTodayComplete: {
    color: "#FFFFFF",
  },
  calendarDayTextTodayPending: {
    color: colors.primary,
  },
  calendarDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(18,67,67,0.2)",
  },
  calendarDotCompleted: {
    backgroundColor: colors.primary,
    opacity: 0.4,
  },
  calendarDotTodayComplete: {
    backgroundColor: "#FFFFFF",
    opacity: 1,
  },
  calendarDotTodayPending: {
    backgroundColor: colors.primary,
    opacity: 0.55,
  },
  statsGrid: {
    gap: 10,
  },
  statCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statCardFull: {
    width: "100%",
  },
  statRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceLow,
  },
  statLabel: {
    color: colors.muted,
    fontWeight: "700",
    fontSize: 11,
    flexShrink: 1,
  },
  statRowRight: {
    alignItems: "flex-end",
  },
  statValue: {
    color: colors.primary,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
  },
  statHelper: {
    color: colors.mutedSoft,
    fontSize: 11,
    lineHeight: 15,
  },
  footerNoteWrap: {
    paddingTop: 2,
    paddingBottom: 8,
    alignItems: "center",
  },
  footerNote: {
    color: colors.mutedSoft,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    maxWidth: 280,
  },
});
