import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { theme } from "../theme";

type Props = {
  title: string;
  subtitle?: string;
};

export function SectionHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 3,
  },
  title: {
    fontSize: theme.typography.display.fontSize,
    lineHeight: theme.typography.display.lineHeight,
    color: colors.text,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.muted,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
  },
});
