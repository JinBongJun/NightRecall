import Constants from "expo-constants";
import { GoogleSignin, isCancelledResponse, isErrorWithCode, isSuccessResponse, statusCodes } from "@react-native-google-signin/google-signin";

let configured = false;

export function configureGoogleSignIn() {
  if (configured) {
    return;
  }

  const googleWebClientId = Constants.expoConfig?.extra?.googleWebClientId as string | undefined;

  GoogleSignin.configure({
    webClientId: googleWebClientId,
    offlineAccess: false,
  });
  configured = true;
}

export async function getGoogleIdToken() {
  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();
  if (isCancelledResponse(response)) {
    return null;
  }

  if (!isSuccessResponse(response)) {
    return null;
  }

  if (response.data.idToken) {
    return response.data.idToken;
  }

  const tokens = await GoogleSignin.getTokens();
  return tokens.idToken || null;
}

export function isGoogleSignInCancelled(error: unknown) {
  return isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED;
}
