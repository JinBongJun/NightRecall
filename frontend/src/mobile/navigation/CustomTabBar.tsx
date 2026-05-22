import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme, useAppTheme } from "../theme";
import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import type { MainTabParamList } from "./types";

const TAB_CONFIG: Array<{
  route: keyof MainTabParamList;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}> = [
  { route: "CaptureTab", label: "Capture", icon: "add-circle" },
  { route: "HomeTab", label: "Home", icon: "home" },
  { route: "LibraryTab", label: "Library", icon: "auto-stories" },
];

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const config = TAB_CONFIG.find((tab) => tab.route === route.name);
        if (!config) {
          return null;
        }

        const selected = state.index === index;
        const tabNavigation = navigation as typeof navigation & {
          emit: (options: { type: string; target: string; canPreventDefault?: boolean }) => { defaultPrevented: boolean };
        };

        const onPress = () => {
          const event = tabNavigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (selected && !event.defaultPrevented) {
            const nestedState = route.state;
            if (nestedState && "index" in nestedState && typeof nestedState.index === "number" && nestedState.index > 0) {
              tabNavigation.navigate(route.name, { screen: getTabRootScreen(route.name) });
            }
            return;
          }

          if (!event.defaultPrevented) {
            tabNavigation.navigate(route.name, { screen: getTabRootScreen(route.name) });
          }
        };

        return (
          <Pressable
            key={route.key}
            style={styles.itemFrame}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityLabel={config.label}
            accessibilityState={{ selected }}
          >
            <View style={[styles.item, selected && styles.itemActive]}>
              <MaterialIcons name={config.icon} size={18} color={selected ? "#FFFFFF" : colors.mutedSoft} />
              <Text style={[styles.label, selected && styles.labelActive]}>{config.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function getTabRootScreen(routeName: string) {
  if (routeName === "CaptureTab") {
    return "Capture";
  }
  if (routeName === "LibraryTab") {
    return "Library";
  }
  return "Home";
}

function createStyles({ colors, typography }: ThemedStyleContext) {
  return StyleSheet.create({
  wrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: "rgba(15,76,63,0.08)",
    paddingHorizontal: 6,
    paddingTop: 6,
  },
  itemFrame: {
    flex: 1,
    alignItems: "center",
  },
  item: {
    width: "100%",
    maxWidth: 100,
    borderRadius: theme.radius.md,
    minHeight: theme.control.touchTarget,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  itemActive: {
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.mutedSoft,
    fontSize: typography.micro.fontSize,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  labelActive: {
    color: "#FFFFFF",
  },
});
}
