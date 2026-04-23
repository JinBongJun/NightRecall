import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LoadingState } from "./src/mobile/components/LoadingState";
import { RootNavigator } from "./src/mobile/navigation/RootNavigator";
import { useSessionBootstrap } from "./src/mobile/hooks/useSessionBootstrap";
import { initSentry } from "./src/mobile/sentry";
import { useAuthStore } from "./src/mobile/store/authStore";

initSentry();

export default function App() {
  useSessionBootstrap();
  const bootstrapStatus = useAuthStore((state) => state.bootstrapStatus);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {bootstrapStatus === "ready" ? <RootNavigator /> : <LoadingState fullScreen />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
