import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { EditPointsScreen } from "../screens/EditPointsScreen";
import { LibraryScreen } from "../screens/LibraryScreen";
import type { LibraryStackParamList } from "./types";

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export function LibraryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="Library" component={LibraryScreen} />
      <Stack.Screen name="EditPoints" component={EditPointsScreen} options={{ animation: "fade", animationDuration: 260 }} />
    </Stack.Navigator>
  );
}
