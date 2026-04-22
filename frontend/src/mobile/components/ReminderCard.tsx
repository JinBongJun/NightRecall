import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

type Props = {
  reminderTime?: string | null;
  enabled?: boolean;
};

export function ReminderCard({ reminderTime, enabled }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Night reminder</Text>
      <Text style={styles.body}>
        {enabled ? `Daily at ${reminderTime ?? "--:--"}` : "Reminders are off, but tonight's question still works."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  body: {
    color: colors.muted,
    lineHeight: 20,
  },
});
