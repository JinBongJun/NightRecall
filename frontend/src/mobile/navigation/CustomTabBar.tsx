import { useEffect, useRef, useState } from "react";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReduceMotion } from "../hooks/useReduceMotion";
import { MOTION_DURATION, MOTION_EASING, MOTION_PRESS } from "../theme/motion";
import { theme, useAppTheme } from "../theme";
import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { playLightTapHaptic } from "../utils/feedback";
import type { MainTabParamList } from "./types";

const TAB_COUNT = 3;

const TAB_CONFIG: Array<{
  route: keyof MainTabParamList;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}> = [
  { route: "CaptureTab", label: "Capture", icon: "add-circle-outline" },
  { route: "HomeTab", label: "Home", icon: "home" },
  { route: "LibraryTab", label: "Library", icon: "auto-stories" },
];

const ACTIVE_ICONS: Record<(typeof TAB_CONFIG)[number]["route"], keyof typeof MaterialIcons.glyphMap> = {
  CaptureTab: "add-circle",
  HomeTab: "home",
  LibraryTab: "auto-stories",
};

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const indicatorX = useRef(new Animated.Value(0)).current;

  const tabWidth = trackWidth > 0 ? trackWidth / TAB_COUNT : 0;

  useEffect(() => {
    if (tabWidth <= 0) {
      return;
    }

    const targetX = state.index * tabWidth;
    if (reduceMotion) {
      indicatorX.setValue(targetX);
      return;
    }

    Animated.timing(indicatorX, {
      toValue: targetX,
      duration: MOTION_DURATION.fast,
      easing: MOTION_EASING.out,
      useNativeDriver: true,
    }).start();
  }, [indicatorX, reduceMotion, state.index, tabWidth]);

  const onTrackLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth !== trackWidth) {
      setTrackWidth(nextWidth);
      indicatorX.setValue(state.index * (nextWidth / TAB_COUNT));
    }
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.track} onLayout={onTrackLayout}>
        {state.routes.map((route, index) => {
          const config = TAB_CONFIG.find((tab) => tab.route === route.name);
          if (!config) {
            return null;
          }

          const selected = state.index === index;
          const tabNavigation = navigation as typeof navigation & {
            emit: (options: { type: string; target: string; canPreventDefault?: boolean }) => {
              defaultPrevented: boolean;
            };
          };

          const onPress = () => {
            void playLightTapHaptic();

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

          const iconName = selected ? ACTIVE_ICONS[config.route] : config.icon;

          return (
            <Pressable
              key={route.key}
              style={styles.item}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityLabel={config.label}
              accessibilityState={{ selected }}
            >
              {({ pressed }) => (
                <View style={[styles.itemInner, pressed && styles.itemPressed]}>
                  <MaterialIcons
                    name={iconName}
                    size={22}
                    color={selected ? colors.primary : colors.mutedSoft}
                  />
                  <Text style={[styles.label, selected && styles.labelActive]}>{config.label}</Text>
                </View>
              )}
            </Pressable>
          );
        })}

        {tabWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              {
                width: tabWidth,
                backgroundColor: colors.primary,
                transform: [{ translateX: indicatorX }],
              },
            ]}
          />
        ) : null}
      </View>
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
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      paddingHorizontal: 4,
      paddingTop: 4,
    },
    track: {
      flexDirection: "row",
      alignItems: "stretch",
      position: "relative",
    },
    item: {
      flex: 1,
    },
    itemInner: {
      minHeight: theme.control.touchTarget,
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    itemPressed: {
      opacity: MOTION_PRESS.opacity,
    },
    label: {
      color: colors.mutedSoft,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
      fontWeight: "600",
    },
    labelActive: {
      color: colors.primary,
      fontWeight: "800",
    },
    indicator: {
      position: "absolute",
      left: 0,
      bottom: 0,
      height: 3,
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
    },
  });
}
