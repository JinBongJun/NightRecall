import { NavigationProp } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "../theme";
import { colors } from "../theme/colors";
import { RootStackParamList } from "../types/navigation";

type TabKey = "Home" | "Create" | "Library";

type Props = {
  active: TabKey;
  navigation: NavigationProp<RootStackParamList>;
};

const tabs: Array<{ key: TabKey; label: string; icon: keyof typeof MaterialIcons.glyphMap }> = [
  { key: "Create", label: "Create", icon: "add-circle" },
  { key: "Home", label: "Home", icon: "home" },
  { key: "Library", label: "Library", icon: "auto-stories" },
];

function navigateTab(navigation: NavigationProp<RootStackParamList>, key: TabKey) {
  if (key === "Create") {
    navigation.navigate("Capture");
    return;
  }
  if (key === "Library") {
    navigation.navigate("Library");
    return;
  }
  navigation.navigate("Home");
}

export function BottomDock({ active, navigation }: Props) {
  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const selected = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            style={styles.itemFrame}
            onPress={() => navigateTab(navigation, tab.key)}
          >
            <View style={[styles.item, selected && styles.itemActive]}>
              <MaterialIcons name={tab.icon} size={20} color={selected ? "#FFFFFF" : colors.mutedSoft} />
              <Text style={[styles.label, selected && styles.labelActive]}>{tab.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: "rgba(15,76,63,0.08)",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  itemFrame: {
    flex: 1,
    alignItems: "center",
  },
  item: {
    width: "100%",
    maxWidth: 108,
    borderRadius: theme.radius.md,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  itemActive: {
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.mutedSoft,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  labelActive: {
    color: "#FFFFFF",
  },
});
