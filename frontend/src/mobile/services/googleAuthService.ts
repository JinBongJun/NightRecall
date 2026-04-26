import Constants from "expo-constants";
import * as Google from "expo-auth-session/providers/google";
import { AuthSessionResult } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleIdTokenRequest() {
  const googleWebClientId = Constants.expoConfig?.extra?.googleWebClientId as string | undefined;
  const googleAndroidClientId = Constants.expoConfig?.extra?.googleAndroidClientId as string | undefined;

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: googleWebClientId,
    androidClientId: googleAndroidClientId,
  });

  return {
    request,
    response,
    promptAsync,
  };
}

export function getGoogleIdTokenFromResult(result: AuthSessionResult | null | undefined) {
  return result?.type === "success" && "params" in result ? result.params.id_token : undefined;
}
