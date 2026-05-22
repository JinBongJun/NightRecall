import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { HomeScreen } from "../screens/HomeScreen";
import { StatsScreen } from "../screens/StatsScreen";
import type { HomeStackParamList } from "./types";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} options={{ animation: "slide_from_right" }} />
    </Stack.Navigator>
  );
}
