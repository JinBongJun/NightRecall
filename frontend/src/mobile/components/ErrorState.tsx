import { StyleSheet, Text, View } from "react-native";

import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { useAppTheme } from "../theme";

type Props = {
  message: string;
};

export function ErrorState({ message }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.body}>{message}</Text>
    </View>
  );
}

function createStyles({ colors, typography }: ThemedStyleContext) {
  return StyleSheet.create({
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
}
