import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { CaptureNoteScreen } from "../screens/CaptureNoteScreen";
import { CaptureScreen } from "../screens/CaptureScreen";
import { EditPointsScreen } from "../screens/EditPointsScreen";
import { ExtractionHelpScreen } from "../screens/ExtractionHelpScreen";
import { ProcessingScreen } from "../screens/ProcessingScreen";
import { QuestionGeneratingScreen } from "../screens/QuestionGeneratingScreen";
import { UsageLimitScreen } from "../screens/UsageLimitScreen";
import type { CaptureStackParamList } from "./types";

const Stack = createNativeStackNavigator<CaptureStackParamList>();

export function CaptureStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="Capture" component={CaptureScreen} />
      <Stack.Screen name="CaptureNote" component={CaptureNoteScreen} options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="Processing" component={ProcessingScreen} options={{ animation: "fade_from_bottom", animationDuration: 280 }} />
      <Stack.Screen name="ExtractionHelp" component={ExtractionHelpScreen} options={{ animation: "fade_from_bottom", animationDuration: 260 }} />
      <Stack.Screen name="UsageLimit" component={UsageLimitScreen} options={{ animation: "fade_from_bottom", animationDuration: 260 }} />
      <Stack.Screen name="EditPoints" component={EditPointsScreen} options={{ animation: "fade", animationDuration: 260 }} />
      <Stack.Screen
        name="QuestionGenerating"
        component={QuestionGeneratingScreen}
        options={{ animation: "fade_from_bottom", animationDuration: 260 }}
      />
    </Stack.Navigator>
  );
}
