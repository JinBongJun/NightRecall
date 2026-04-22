import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

type Props = {
  message: string;
};

export function ErrorState({ message }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.body}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F7E5E2",
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  title: {
    color: colors.danger,
    fontWeight: "800",
  },
  body: {
    color: colors.text,
  },
});
