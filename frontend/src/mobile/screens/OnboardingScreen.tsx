import Constants from "expo-constants";
import { useMemo, useRef, useState } from "react";
import axios from "axios";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import { BrandWordmark } from "../components/BrandWordmark";
import { persistSession } from "../services/authSessionService";
import { getGoogleIdToken, isGoogleSignInCancelled } from "../services/googleAuthService";
import { scheduleLocalReminder } from "../services/reminderService";
import { createGuestSession, signInWithGoogleIdToken } from "../services/userService";
import { useAuthStore } from "../store/authStore";
import { useReminderStore } from "../store/reminderStore";
import { colors } from "../theme/colors";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

const GOOGLE_G_LOGO = "https://developers.google.com/static/identity/images/g-logo.png";
const BRAND_LOGO = require("../../../assets/logo.png");

export function OnboardingScreen({ navigation }: Props) {
  const setSession = useAuthStore((state) => state.setSession);
  const setReminder = useReminderStore((state) => state.setReminder);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<0 | 1>(0);
  const pagerRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const isExpoGo = Constants.appOwnership === "expo";
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const compact = height < 820;
  const small = height < 740;

  const typeScale = useMemo(
    () => ({
      title: small ? 22 : compact ? 26 : 30,
      titleLine: small ? 27 : compact ? 31 : 35,
      body: small ? 14 : 16,
      bodyLine: small ? 21 : 24,
    }),
    [compact, small],
  );

  const startGuestFlow = async () => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const reminderTime = "22:30";

    let session:
      | {
          user: {
            id: string;
            timezone: string;
          };
          tokens: {
            access_token: string;
            refresh_token: string;
          };
        }
      | null = null;

    try {
      setLoading(true);
      session = await createGuestSession(timezone, reminderTime);
    } catch (error) {
      let detail = "Guest onboarding could not be completed.";

      if (axios.isAxiosError(error)) {
        if (typeof error.response?.data?.detail === "string") {
          detail = error.response.data.detail;
        } else if (!error.response) {
          detail = "NightRecall could not reach the server. Check that the phone and API server are on the same network.";
        } else if (error.message) {
          detail = error.message;
        }
      } else if (error instanceof Error && error.message) {
        detail = error.message;
      }

      Alert.alert("Setup failed", detail);
      } finally {
      if (!session) {
        setLoading(false);
      }
    }

    if (!session) {
      return;
    }

    const payload = {
      userId: session.user.id,
      timezone,
      authMode: "guest" as const,
      accessToken: session.tokens.access_token,
      refreshToken: session.tokens.refresh_token,
      provider: "guest" as const,
    };

    let notificationsEnabled = false;
    try {
      notificationsEnabled = await scheduleLocalReminder(22, 30);
    } catch {
      notificationsEnabled = false;
    }

    try {
      await persistSession(payload);
    } catch {
      setSession(payload);
      // Keep the user moving even if secure storage fails on this device.
    }

    setReminder(reminderTime, notificationsEnabled);
    navigation.replace("Home");
    setLoading(false);
  };

  const startGoogleFlow = async () => {
    if (isExpoGo) {
      Alert.alert("Google sign-in unavailable here", "Google sign-in should be tested in a development build, not Expo Go.");
      return;
    }

    try {
      setLoading(true);
      const idToken = await getGoogleIdToken();
      if (!idToken) {
        setLoading(false);
        return;
      }

      const session = await signInWithGoogleIdToken(idToken);
      const payload = {
        userId: session.user.id,
        timezone: session.user.timezone,
        authMode: "signed_in" as const,
        accessToken: session.tokens.access_token,
        refreshToken: session.tokens.refresh_token,
        provider: "google" as const,
      };
      try {
        await persistSession(payload);
      } catch {
        setSession(payload);
      }
      navigation.replace("Home");
    } catch (error) {
      if (isGoogleSignInCancelled(error)) {
        return;
      }
      const detail = error instanceof Error && error.message ? error.message : "Google account connection could not be completed.";
      Alert.alert("Google sign-in failed", detail);
    } finally {
      setLoading(false);
    }
  };

  const handlePagerEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextPage = Math.round(event.nativeEvent.contentOffset.x / width);
    setPage(nextPage === 0 ? 0 : 1);
  };

  const handlePrimary = () => {
    void startGuestFlow();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.root}>
        <View style={styles.topBar}>
          {page === 1 ? (
            <Pressable
              style={styles.backButton}
              onPress={() => {
                pagerRef.current?.scrollTo({ x: 0, animated: true });
                setPage(0);
              }}
            >
              <MaterialIcons name="arrow-back-ios-new" size={18} color={colors.mutedSoft} />
            </Pressable>
          ) : (
            <View style={styles.backSpacer} />
          )}

          <BrandWordmark size="medium" />

          <View style={styles.backSpacer} />
        </View>

        <Animated.ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handlePagerEnd}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
          style={styles.pager}
          contentContainerStyle={styles.pagerContent}
        >
          <View style={[styles.page, { width }]}>
            <Animated.View
              style={[
                styles.posterBlock,
                {
                  opacity: scrollX.interpolate({
                    inputRange: [0, width],
                    outputRange: [1, 0.9],
                    extrapolate: "clamp",
                  }),
                  transform: [
                    {
                      translateX: scrollX.interpolate({
                        inputRange: [0, width],
                        outputRange: [0, -18],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.heroImage, compact && styles.heroImageCompact, small && styles.heroImageSmall]}>
                <View style={styles.heroOrbLarge} />
                <View style={styles.heroOrbSmall} />
                <View style={styles.heroRing} />
                <View style={styles.heroLogoShell}>
                  <Image source={BRAND_LOGO} style={styles.heroLogo} resizeMode="contain" />
                </View>
                <View style={styles.heroNodeRow}>
                  <OrbitNode />
                  <View style={styles.heroNodeLine} />
                  <OrbitNode />
                  <View style={[styles.heroNodeLine, styles.heroNodeLineShort]} />
                  <OrbitNode />
                </View>
              </View>

              <View style={styles.copyCenter}>
                <Text style={styles.overline}>Nightly recall</Text>
                <Text style={[styles.posterTitle, { fontSize: typeScale.title, lineHeight: typeScale.titleLine }]}>
                  A calm ritual{"\n"}before sleep
                </Text>
                <Text style={[styles.posterBody, { fontSize: typeScale.body, lineHeight: typeScale.bodyLine }]}>
                  Capture what mattered today, then return to it at night with one focused recall.
                </Text>
              </View>
            </Animated.View>
          </View>

          <View style={[styles.page, { width }]}>
            <Animated.View
              style={[
                styles.posterBlock,
                {
                  opacity: scrollX.interpolate({
                    inputRange: [0, width],
                    outputRange: [0.88, 1],
                    extrapolate: "clamp",
                  }),
                  transform: [
                    {
                      translateX: scrollX.interpolate({
                        inputRange: [0, width],
                        outputRange: [18, 0],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.flowArtwork, compact && styles.flowArtworkCompact, small && styles.flowArtworkSmall]}>
                <View style={styles.flowGlow} />
                <View style={styles.flowHalo} />
                <View style={styles.flowOrbit} />

                <View style={[styles.flowRow, small && styles.flowRowSmall]}>
                  <FlowMiniCard
                    icon="edit-note"
                    step="Step 01"
                    title="Capture"
                    active={false}
                    compact={small}
                  />
                  <FlowMiniCard
                    icon="visibility"
                    step="Step 02"
                    title="Review"
                    active
                    compact={small}
                  />
                  <FlowMiniCard
                    icon="psychology"
                    step="Step 03"
                    title="Recall"
                    active={false}
                    compact={small}
                  />
                </View>
              </View>

              <View style={styles.copyCenter}>
                <Text style={[styles.posterTitle, styles.posterTitleDark, { fontSize: typeScale.title, lineHeight: typeScale.titleLine }]}>
                  Built for a daily loop.{"\n"}Not a cluttered feed.
                </Text>
                <Text style={[styles.posterBody, styles.posterBodyDark, { fontSize: typeScale.body, lineHeight: typeScale.bodyLine }]}>
                  Save key ideas, keep only what matters, and answer one clear question before bed.
                </Text>
              </View>
            </Animated.View>
          </View>
        </Animated.ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.dots}>
            <View style={[styles.dot, page === 0 && styles.dotActive]} />
            <View style={[styles.dot, page === 1 && styles.dotActive]} />
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.primaryButton} onPress={handlePrimary} disabled={loading}>
              <Text style={styles.primaryButtonText}>{loading ? "Getting ready..." : "Get Started"}</Text>
            </Pressable>

            <Pressable style={styles.googleButton} onPress={() => void startGoogleFlow()}>
              <Image source={{ uri: GOOGLE_G_LOGO }} style={styles.googleLogo} />
              <Text style={styles.googleText}>Continue with Google</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FlowMiniCard({
  icon,
  step,
  title,
  active,
  compact,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  step: string;
  title: string;
  active: boolean;
  compact: boolean;
}) {
  return (
    <View style={[styles.flowMiniCard, active && styles.flowMiniCardActive, compact && styles.flowMiniCardCompact]}>
      <View style={[styles.flowMiniIconBubble, active && styles.flowMiniIconBubbleActive, compact && styles.flowMiniIconBubbleCompact]}>
        <MaterialIcons name={icon} size={compact ? 18 : 20} color={colors.primary} />
      </View>
      <Text style={[styles.flowMiniStep, active && styles.flowMiniStepActive]}>{step}</Text>
      <Text style={[styles.flowMiniTitle, active && styles.flowMiniTitleActive, compact && styles.flowMiniTitleCompact]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 4,
  },
  backButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  backSpacer: {
    width: 28,
    height: 28,
  },
  pager: {
    flex: 1,
  },
  pagerContent: {
    alignItems: "stretch",
  },
  page: {
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  posterBlock: {
    gap: 22,
  },
  heroImage: {
    width: "100%",
    aspectRatio: 1.18,
    borderRadius: 34,
    overflow: "hidden",
    backgroundColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    alignItems: "center",
    justifyContent: "center",
  },
  heroImageCompact: {
    aspectRatio: 1.28,
  },
  heroImageSmall: {
    aspectRatio: 1.36,
  },
  heroOrbLarge: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(255,248,236,0.1)",
    top: -42,
    right: -22,
  },
  heroOrbSmall: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    left: -20,
    bottom: 18,
  },
  heroRing: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    top: -76,
    right: -88,
  },
  heroLogoShell: {
    width: 176,
    height: 176,
    borderRadius: 999,
    backgroundColor: "rgba(255,252,247,0.94)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  heroLogo: {
    width: 132,
    height: 132,
  },
  heroNodeRow: {
    position: "absolute",
    bottom: 26,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroNodeLine: {
    width: 46,
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(255,248,236,0.38)",
  },
  heroNodeLineShort: {
    width: 26,
  },
  heroNode: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#FFF8EC",
  },
  copyCenter: {
    gap: 12,
    alignItems: "center",
  },
  overline: {
    color: colors.mutedSoft,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.3,
  },
  posterTitle: {
    color: colors.primary,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -1.2,
  },
  posterTitleDark: {
    color: colors.text,
  },
  posterBody: {
    color: colors.muted,
    textAlign: "center",
    maxWidth: 300,
  },
  posterBodyDark: {
    maxWidth: 320,
  },
  flowArtwork: {
    height: 176,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    backgroundColor: "rgba(255,253,248,0.42)",
  },
  flowArtworkCompact: {
    height: 162,
  },
  flowArtworkSmall: {
    height: 150,
  },
  flowGlow: {
    position: "absolute",
    inset: 0,
    borderRadius: 32,
    backgroundColor: "rgba(213,230,220,0.18)",
  },
  flowHalo: {
    position: "absolute",
    width: 180,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(213,230,220,0.2)",
    top: 18,
  },
  flowOrbit: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(15,76,63,0.08)",
    top: -90,
    right: -60,
  },
  flowRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    paddingHorizontal: 14,
  },
  flowRowSmall: {
    gap: 8,
    paddingHorizontal: 10,
  },
  flowMiniCard: {
    flex: 1,
    backgroundColor: "rgba(255,253,248,0.96)",
    borderRadius: 24,
    minHeight: 112,
    paddingHorizontal: 14,
    paddingVertical: 16,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  flowMiniCardActive: {
    backgroundColor: colors.primary,
    minHeight: 140,
    transform: [{ translateY: -6 }],
  },
  flowMiniCardCompact: {
    minHeight: 96,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  flowMiniIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#D7F0F1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  flowMiniIconBubbleActive: {
    backgroundColor: "#BCEBEB",
  },
  flowMiniIconBubbleCompact: {
    width: 38,
    height: 38,
    marginBottom: 10,
  },
  flowMiniStep: {
    color: colors.mutedSoft,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  flowMiniStepActive: {
    color: "rgba(255,255,255,0.55)",
  },
  flowMiniTitle: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
  },
  flowMiniTitleActive: {
    color: "#FFFFFF",
  },
  flowMiniTitleCompact: {
    fontSize: 15,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 6,
    backgroundColor: colors.background,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(192,200,199,0.55)",
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  googleButton: {
    height: 56,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,253,248,0.96)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleLogo: {
    width: 18,
    height: 18,
  },
  googleText: {
    color: "#1F1F1F",
    fontSize: 14,
    fontWeight: "600",
  },
});

function OrbitNode() {
  return <View style={styles.heroNode} />;
}
