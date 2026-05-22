import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { useAppTheme } from "../theme";

type LoadingStateProps = {
  fullScreen?: boolean;
};

export function LoadingState({ fullScreen = false }: LoadingStateProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

function createStyles({ colors, typography }: ThemedStyleContext) {
  return StyleSheet.create({
  container: {
    padding: 24,
    alignItems: "center",
  },
  fullScreen: {
    flex: 1,
    justifyContent: "center",
  },
});
}
