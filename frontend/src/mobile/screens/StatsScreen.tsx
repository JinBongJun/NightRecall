import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { TopBar } from "../components/TopBar";
import { ScreenContainer } from "../components/ScreenContainer";
import { useStatsStore } from "../store/statsStore";
import { colors } from "../theme/colors";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Stats">;

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const heroLogo = require("../../../assets/logo.png");

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
  const streakStatus = answeredToday ? "Checked in tonight" : "Still time tonight";
  const ritualStatus = answeredToday ? "1/1" : "0/1";

  return (
    <ScreenContainer>
      <TopBar 
        leftIcon="arrow-back" 
        onLeftPress={() => navigation.goBack()} 
      />

      <View style={styles.header}>
        <Text style={styles.sectionEyebrow}>Recall Ritual</Text>
        <Text style={styles.title}>Current Streak</Text>
        <Text style={styles.subtitle}>A quiet summary of your progress.</Text>
      </View>

      <View style={styles.heroCard}>
        <Image source={heroLogo} style={styles.heroDecorationPrimary} resizeMode="cover" />
        <View style={styles.heroContent}>
          <View style={styles.heroLabelRow}>
            <Text style={styles.heroLabel}>Progress Record</Text>
            <View style={styles.heroLabelDivider} />
          </View>
          <View style={styles.heroValueRow}>
            <Text style={styles.heroValue}>{streak}</Text>
            <Text style={styles.heroUnit}>nights</Text>
          </View>
          <Text style={styles.heroBody}>Your memory paths are strengthening.</Text>
          <View style={styles.heroStatusRow}>
            <View style={styles.heroStatusIndicator}>
              <View style={[styles.heroStatusDot, answeredToday ? styles.heroStatusDotOn : styles.heroStatusDotOff]} />
            </View>
            <Text style={styles.heroStatusText}>{`${ritualStatus} Answered tonight`}</Text>
          </View>
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
    gap: 10,
  },
  sectionEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  title: {
    color: colors.text,
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 52,
    letterSpacing: -1.2,
  },
  subtitle: {
    color: colors.mutedSoft,
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 300,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 32,
    overflow: "hidden",
    minHeight: 320,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 24,
    justifyContent: "space-between",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  heroDecorationPrimary: {
    position: "absolute",
    right: -18,
    bottom: -28,
    width: 330,
    height: 330,
    opacity: 0.1,
    tintColor: "#D8F5F5",
    transform: [{ rotate: "-12deg" }, { scale: 1.26 }],
  },
  heroContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  heroLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroLabel: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2.8,
    textTransform: "uppercase",
  },
  heroLabelDivider: {
    width: 30,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  heroValueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 24,
  },
  heroValue: {
    color: "#FFFFFF",
    fontSize: 108,
    lineHeight: 110,
    fontWeight: "800",
    letterSpacing: -4.2,
  },
  heroUnit: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "500",
    fontStyle: "italic",
    marginBottom: 16,
  },
  heroBody: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "500",
    maxWidth: 210,
  },
  heroStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
  },
  heroStatusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(188,235,235,0.3)",
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: "rgba(255,255,255,0.36)",
  },
  heroStatusText: {
    color: "rgba(255,255,255,0.40)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  calendarCard: {
    backgroundColor: colors.surfaceLow,
    borderRadius: 40,
    paddingHorizontal: 26,
    paddingTop: 24,
    paddingBottom: 28,
    gap: 24,
    borderWidth: 1,
    borderColor: "rgba(192,200,199,0.16)",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "baseline",
  },
  calendarTitle: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: "800",
  },
  calendarHelper: {
    color: colors.mutedSoft,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
    maxWidth: 150,
  },
  calendarMonth: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
    opacity: 0.4,
    textTransform: "uppercase",
    letterSpacing: 2.2,
  },
  calendarWeekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 0,
  },
  calendarWeekday: {
    width: 38,
    textAlign: "center",
    color: colors.mutedSoft,
    fontSize: 10,
    fontWeight: "900",
    opacity: 0.28,
    letterSpacing: 0.8,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 18,
    columnGap: 7,
  },
  calendarCell: {
    width: 38,
    height: 40,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
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
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  calendarCellTodayPending: {
    borderWidth: 1,
    borderColor: "rgba(18,67,67,0.12)",
    backgroundColor: "#FFFFFF",
  },
  calendarDayText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  calendarDayTextOutside: {
    color: colors.mutedSoft,
    opacity: 0.14,
  },
  calendarDayTextCompleted: {
    color: "rgba(18,67,67,0.8)",
  },
  calendarDayTextTodayComplete: {
    color: "#FFFFFF",
  },
  calendarDayTextTodayPending: {
    color: colors.primary,
  },
  calendarDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(18,67,67,0.18)",
  },
  calendarDotCompleted: {
    backgroundColor: colors.primary,
    opacity: 0.36,
  },
  calendarDotTodayComplete: {
    backgroundColor: colors.primary,
    opacity: 1,
  },
  calendarDotTodayPending: {
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
  statsGrid: {
    gap: 16,
  },
  statCard: {
    width: "100%",
    backgroundColor: "#FFFEFC",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: "rgba(192,200,199,0.10)",
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
    gap: 14,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(18,67,67,0.10)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  statLabel: {
    color: colors.muted,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 10,
    flexShrink: 1,
  },
  statRowRight: {
    alignItems: "flex-end",
  },
  statValue: {
    color: colors.primary,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -1.2,
  },
  statHelper: {
    color: colors.mutedSoft,
    fontSize: 12,
    lineHeight: 17,
  },
  footerNoteWrap: {
    paddingTop: 2,
    paddingBottom: 12,
    alignItems: "center",
  },
  footerNote: {
    color: colors.mutedSoft,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    fontStyle: "italic",
    opacity: 0.4,
    maxWidth: 280,
  },
});
