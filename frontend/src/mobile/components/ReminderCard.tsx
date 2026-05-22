import { StyleSheet, Text, View } from "react-native";

import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { useAppTheme } from "../theme";

type Props = {
  reminderTime?: string | null;
  enabled?: boolean;
};

export function ReminderCard({ reminderTime, enabled }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Night reminder</Text>
      <Text style={styles.body}>
        {enabled ? `Daily at ${reminderTime ?? "--:--"}` : "Reminders are off, but tonight's question still works."}
      </Text>
    </View>
  );
}

function createStyles({ colors, typography }: ThemedStyleContext) {
  return StyleSheet.create({
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
}
