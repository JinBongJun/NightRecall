import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types/navigation";
import { CaptureScreen } from "../screens/CaptureScreen";
import { CaptureNoteScreen } from "../screens/CaptureNoteScreen";
import { EditPointsScreen } from "../screens/EditPointsScreen";
import { ExtractionHelpScreen } from "../screens/ExtractionHelpScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LibraryScreen } from "../screens/LibraryScreen";
import { AccountScreen } from "../screens/ProfileScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { ProcessingScreen } from "../screens/ProcessingScreen";
import { PrivacyPolicyScreen } from "../screens/PrivacyPolicyScreen";
import { QuestionGeneratingScreen } from "../screens/QuestionGeneratingScreen";
import { CreateScreen } from "../screens/QuestionSourceScreen";
import { ResultScreen } from "../screens/ResultScreen";
import { ReviewScreen } from "../screens/ReviewScreen";
import { SavedCardDetailScreen } from "../screens/SavedMakeQuestionsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { StatsScreen } from "../screens/StatsScreen";
import { UsageLimitScreen } from "../screens/UsageLimitScreen";
import { useAuthStore } from "../store/authStore";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const userId = useAuthStore((state) => state.userId);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
      {!userId ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Create" component={CreateScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="Capture" component={CaptureScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="CaptureNote" component={CaptureNoteScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="Processing" component={ProcessingScreen} options={{ animation: "fade_from_bottom", animationDuration: 280 }} />
          <Stack.Screen name="ExtractionHelp" component={ExtractionHelpScreen} options={{ animation: "fade_from_bottom", animationDuration: 260 }} />
          <Stack.Screen name="UsageLimit" component={UsageLimitScreen} options={{ animation: "fade_from_bottom", animationDuration: 260 }} />
          <Stack.Screen name="EditPoints" component={EditPointsScreen} options={{ animation: "fade", animationDuration: 260 }} />
          <Stack.Screen name="QuestionGenerating" component={QuestionGeneratingScreen} options={{ animation: "fade_from_bottom", animationDuration: 260 }} />
          <Stack.Screen name="Library" component={LibraryScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="SavedCardDetail" component={SavedCardDetailScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="Review" component={ReviewScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="Result" component={ResultScreen} options={{ animation: "fade_from_bottom", animationDuration: 260 }} />
          <Stack.Screen name="Stats" component={StatsScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="Account" component={AccountScreen} options={{ animation: "slide_from_right" }} />
        </>
      )}
    </Stack.Navigator>
  );
}
