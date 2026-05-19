import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { colors } from "../theme/colors";

type Props = {
  title: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function SectionRow({ title, iconName, actionLabel, onActionPress }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.titleRow}>
        {iconName ? (
          <View style={styles.iconDot}>
            <MaterialIcons name={iconName} size={15} color={colors.primary} />
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {actionLabel ? (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  iconDot: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  action: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
});
