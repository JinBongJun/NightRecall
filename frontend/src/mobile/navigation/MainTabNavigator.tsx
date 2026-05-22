import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { CaptureStack } from "./CaptureStack";
import { CustomTabBar } from "./CustomTabBar";
import { HomeStack } from "./HomeStack";
import { LibraryStack } from "./LibraryStack";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: true,
      }}
      initialRouteName="HomeTab"
    >
      <Tab.Screen name="CaptureTab" component={CaptureStack} options={{ title: "Capture" }} />
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: "Home" }} />
      <Tab.Screen name="LibraryTab" component={LibraryStack} options={{ title: "Library" }} />
    </Tab.Navigator>
  );
}
