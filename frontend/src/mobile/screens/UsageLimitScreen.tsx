import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActionButton } from "../components/ActionButton";
import { ScreenHeader } from "../components/ScreenHeader";
import { ScreenContainer } from "../components/ScreenContainer";
import { TopBar } from "../components/TopBar";
import { useReviewStore } from "../store/reviewStore";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "UsageLimit">;

export function UsageLimitScreen({ route, navigation }: Props) {
  const currentQuestion = useReviewStore((state) => state.currentQuestion);
  const sessionQuestions = useReviewStore((state) => state.sessionQuestions);
  const hasReviewReady = sessionQuestions.length > 0 || Boolean(currentQuestion);

  const isPhotoLimit = route.params.reason === "photo_extract";
  const title = isPhotoLimit ? "That's enough photo reads for tonight" : "You're set for tonight";
  const subtitle = isPhotoLimit
    ? "You can still write the key point yourself and keep tonight moving."
    : route.params.reason === "question_generation_monthly"
      ? "You already made 30 new questions this month. You can keep reviewing what's ready."
      : "You already made 3 new questions tonight. You can keep reviewing what's ready.";

  const iconName = isPhotoLimit ? "photo-library" : "nights-stay";
  const primaryLabel = isPhotoLimit ? "Write it down instead" : hasReviewReady ? "Review what's ready" : "Go home";
  const primaryAction = () => {
    if (isPhotoLimit) {
      navigation.replace("CaptureNote");
      return;
    }
    if (hasReviewReady) {
      navigation.replace("Review", { mode: "auto" });
      return;
    }
    navigation.navigate("Home");
  };

  return (
    <ScreenContainer>
      <TopBar leftIcon="arrow-back" onLeftPress={() => navigation.goBack()} />

      <ScreenHeader iconName={iconName} title={title} subtitle={subtitle} />

      <ActionButton label={primaryLabel} onPress={primaryAction} variant="primary" />
      {!isPhotoLimit ? <ActionButton label="Go to library" onPress={() => navigation.navigate("Library")} variant="secondary" /> : null}
      <ActionButton label="Not now" onPress={() => navigation.navigate("Home")} variant="tertiary" />
    </ScreenContainer>
  );
}
