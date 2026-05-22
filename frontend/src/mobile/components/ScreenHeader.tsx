import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { theme, useAppTheme } from "../theme";

type Props = {
  title: string;
  subtitle?: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
};

export function ScreenHeader({ title, subtitle, iconName }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        {iconName ? (
          <View style={styles.iconBadge}>
            <MaterialIcons name={iconName} size={13} color={colors.primary} />
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function createStyles({ colors, typography }: ThemedStyleContext) {
  return StyleSheet.create({
  wrap: {
    gap: 5,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(15,76,63,0.12)",
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: typography.title.fontSize,
    lineHeight: typography.title.lineHeight,
    fontWeight: typography.title.fontWeight,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
});
}
