import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { theme, useAppTheme } from "../theme";

type Props = {
  title: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function SectionRow({ title, iconName, actionLabel, onActionPress }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      <View style={styles.titleRow}>
        {iconName ? (
          <View style={styles.iconDot}>
            <MaterialIcons name={iconName} size={14} color={colors.primary} />
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

function createStyles({ colors, typography }: ThemedStyleContext) {
  return StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  iconDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.text,
    fontSize: typography.section.fontSize,
    fontWeight: typography.section.fontWeight,
    letterSpacing: -0.2,
  },
  action: {
    color: colors.muted,
    fontSize: typography.body.fontSize,
    fontWeight: "700",
  },
});
}
