import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

type Props = {
  streak: number;
};

export function StreakCard({ streak }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Current streak</Text>
      <Text style={styles.value}>{streak} nights</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 18,
    gap: 6,
  },
  label: {
    color: "#D6EEF0",
    fontSize: 13,
    fontWeight: "700",
  },
  value: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },
});
