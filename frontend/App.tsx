import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LoadingState } from "./src/mobile/components/LoadingState";
import { RootNavigator } from "./src/mobile/navigation/RootNavigator";
import { useSessionBootstrap } from "./src/mobile/hooks/useSessionBootstrap";
import { initSentry } from "./src/mobile/sentry";
import { useAuthStore } from "./src/mobile/store/authStore";
import { ThemeProvider, useAppTheme } from "./src/mobile/theme";

initSentry();

function AppNavigation() {
  const bootstrapStatus = useAuthStore((state) => state.bootstrapStatus);
  const { navigationTheme, isDark } = useAppTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <NavigationContainer theme={navigationTheme}>
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
