import { ActivityIndicator, StyleSheet, View } from "react-native";

import { colors } from "../theme/colors";

type LoadingStateProps = {
  fullScreen?: boolean;
};

export function LoadingState({ fullScreen = false }: LoadingStateProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: "center",
  },
  fullScreen: {
    flex: 1,
    justifyContent: "center",
  },
});
