import { StyleSheet, Text, View } from "react-native";

import { useUsageLimits } from "../hooks/useUsageLimits";
import { colors } from "../theme/colors";
import { theme } from "../theme";

export function TonightLimitsBar() {
  const usageLimits = useUsageLimits();
  const remainingQuestions = usageLimits?.question_generation_daily.remaining ?? 3;
  const remainingPhotoReads = usageLimits?.photo_extract_daily.remaining ?? 3;

  return (
    <View style={styles.bar}>
      <Text style={styles.text}>
        {remainingQuestions} question{remainingQuestions === 1 ? "" : "s"} · {remainingPhotoReads} photo read
        {remainingPhotoReads === 1 ? "" : "s"} left tonight
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surfaceLow,
    borderRadius: theme.radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  text: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});
