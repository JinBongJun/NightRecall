import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LoadingState } from "./src/mobile/components/LoadingState";
import { RootNavigator } from "./src/mobile/navigation/RootNavigator";
import { useReminderNotificationTap } from "./src/mobile/hooks/useReminderNotificationTap";
import { useReminderResyncOnForeground } from "./src/mobile/hooks/useReminderResyncOnForeground";
import { useSessionBootstrap } from "./src/mobile/hooks/useSessionBootstrap";
import { navigationRef } from "./src/mobile/navigation/navigationRef";
import { initSentry } from "./src/mobile/sentry";
import { useAuthStore } from "./src/mobile/store/authStore";
import { ThemeProvider, useAppTheme } from "./src/mobile/theme";

initSentry();

function AppNavigation() {
  const bootstrapStatus = useAuthStore((state) => state.bootstrapStatus);
  const { navigationTheme, isDark } = useAppTheme();
  useReminderNotificationTap();
  useReminderResyncOnForeground();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        {bootstrapStatus === "ready" ? <RootNavigator /> : <LoadingState fullScreen />}
      </NavigationContainer>
    </>
  );
}

export default function App() {
  useSessionBootstrap();

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppNavigation />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
