import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { colors } from "../theme/colors";

type Props = {
  title: string;
  subtitle?: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
};

export function ScreenHeader({ title, subtitle, iconName }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.kickerRow}>
        {iconName ? (
          <View style={styles.iconBadge}>
            <MaterialIcons name={iconName} size={15} color={colors.primary} />
          </View>
        ) : null}
        <Text style={styles.kicker}>Night recall</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 5,
  },
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBadge: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(15,76,63,0.12)",
  },
  kicker: {
    color: colors.mutedSoft,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.05,
    textTransform: "uppercase",
  },
  title: {
    color: colors.primary,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "800",
    letterSpacing: -0.75,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 290,
  },
});
