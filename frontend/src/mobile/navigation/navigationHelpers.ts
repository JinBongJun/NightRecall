import { CommonActions, type NavigationProp, type ParamListBase } from "@react-navigation/native";

import type { MainTabParamList, QuestionGeneratingParams, RootStackParamList } from "./types";

type AppNavigation = NavigationProp<ParamListBase>;

export function navigateToMainTab(
  navigation: AppNavigation,
  tab: keyof MainTabParamList,
  screen?: string,
  params?: object,
) {
  if (screen) {
    navigation.navigate("MainTabs", {
      screen: tab,
      params: { screen, params },
    });
    return;
  }

  navigation.navigate("MainTabs", { screen: tab });
}

export function navigateToHome(navigation: AppNavigation) {
  navigateToMainTab(navigation, "HomeTab", "Home");
}

/** Lands on Home and clears nested tab stacks after capture/generation flows. */
export function resetToHomeAfterFlow(navigation: AppNavigation) {
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: "MainTabs",
          state: {
            index: 1,
            routes: [
              { name: "CaptureTab", state: { routes: [{ name: "Capture" }], index: 0 } },
              { name: "HomeTab", state: { routes: [{ name: "Home" }], index: 0 } },
              { name: "LibraryTab", state: { routes: [{ name: "Library" }], index: 0 } },
            ],
          },
        },
      ],
    }),
  );
}

export function navigateToCapture(navigation: AppNavigation) {
  navigateToMainTab(navigation, "CaptureTab", "Capture");
}

export function navigateToLibrary(navigation: AppNavigation) {
  navigateToMainTab(navigation, "LibraryTab", "Library");
}

export function navigateToReview(navigation: AppNavigation, mode: "auto" | "picked" = "auto") {
  (navigation as NavigationProp<RootStackParamList>).navigate("Review", { mode });
}

export function navigateToAccount(navigation: AppNavigation) {
  (navigation as NavigationProp<RootStackParamList>).navigate("Account");
}

export function navigateToQuestionGenerating(navigation: AppNavigation, params: QuestionGeneratingParams) {
  navigation.navigate("MainTabs", {
    screen: "CaptureTab",
    params: { screen: "QuestionGenerating", params },
  });
}

export function resetTabToRoot(navigation: AppNavigation, tab: keyof MainTabParamList, rootScreen: string) {
  navigation.navigate("MainTabs", {
    screen: tab,
    params: { screen: rootScreen },
  });
}
