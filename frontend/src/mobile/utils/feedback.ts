import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export async function playAnswerResultHaptic(isCorrect: boolean) {
  if (Platform.OS === "web") {
    return;
  }

  try {
    if (isCorrect) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // Haptics are optional; never block the recall flow.
  }
}

export async function playLightTapHaptic() {
  if (Platform.OS === "web") {
    return;
  }

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Optional feedback only.
  }
}
