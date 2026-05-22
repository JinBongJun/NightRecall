import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AccountScreen } from "../screens/ProfileScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { PrivacyPolicyScreen } from "../screens/PrivacyPolicyScreen";
import { RefundPolicyScreen } from "../screens/RefundPolicyScreen";
import { ResultScreen } from "../screens/ResultScreen";
import { ReviewScreen } from "../screens/ReviewScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { useAuthStore } from "../store/authStore";
import { MainTabNavigator } from "./MainTabNavigator";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const userId = useAuthStore((state) => state.userId);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
      {!userId ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="Review" component={ReviewScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="Result" component={ResultScreen} options={{ animation: "fade_from_bottom", animationDuration: 260 }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="RefundPolicy" component={RefundPolicyScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="Account" component={AccountScreen} options={{ animation: "slide_from_right" }} />
        </>
      )}
    </Stack.Navigator>
  );
}
