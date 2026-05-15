import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { colors } from "../theme/colors";

type Props = {
  title: string;
  body: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
};

export function EmptyState({ title, body, iconName = "auto-stories" }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBadge}>
        <MaterialIcons name={iconName} size={24} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255,253,248,0.88)",
    gap: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  title: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16,
  },
  body: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
