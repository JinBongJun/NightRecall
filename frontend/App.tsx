import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RootNavigator } from "./src/mobile/navigation/RootNavigator";
import { useSessionBootstrap } from "./src/mobile/hooks/useSessionBootstrap";
import { initSentry } from "./src/mobile/sentry";

initSentry();

export default function App() {
  useSessionBootstrap();

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
