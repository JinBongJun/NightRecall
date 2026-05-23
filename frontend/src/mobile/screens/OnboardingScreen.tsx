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
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { PrimaryButton } from "../components/PrimaryButton";
import { persistSession } from "../services/authSessionService";
import { getGoogleIdToken, isGoogleSignInCancelled } from "../services/googleAuthService";
import { syncReminderWithServer } from "../services/syncReminderSettings";
import { createGuestSession, signInWithGoogleIdToken } from "../services/userService";
import { useAuthStore } from "../store/authStore";
import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { theme, useAppTheme } from "../theme";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

const BRAND_LOGO = require("../../../assets/logo.png");

export function OnboardingScreen({ navigation }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const setSession = useAuthStore((state) => state.setSession);
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
      title: small ? 20 : compact ? 22 : 24,
      titleLine: small ? 25 : compact ? 27 : 29,
      body: small ? 13 : 14,
      bodyLine: small ? 19 : 21,
    }),
    [compact, small],
  );

  const startGuestFlow = async () => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const reminderTime = "22:30";

    let session: Awaited<ReturnType<typeof createGuestSession>> | null = null;

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

    const payload = session;

    try {
      await persistSession(payload);
    } catch {
      setSession(payload);
      // Keep the user moving even if secure storage fails on this device.
    }

    try {
      await syncReminderWithServer({
        reminderTime,
        enabled: true,
        timezone,
        requestPermission: true,
        patchServer: true,
      });
    } catch {
      // Keep onboarding moving if reminder sync fails.
    }

    navigation.replace("MainTabs");
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
      const payload = session;
      try {
        await persistSession(payload);
      } catch {
        setSession(payload);
      }

      try {
        await syncReminderWithServer({
          reminderTime: "22:30",
          enabled: true,
          timezone: payload.timezone,
          requestPermission: true,
          patchServer: true,
        });
      } catch {
        // Keep onboarding moving if reminder sync fails.
      }

      navigation.replace("MainTabs");
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
              </View>

              <View style={styles.copyCenter}>
                <Text style={styles.overline}>Nightly recall</Text>
                <Text style={[styles.posterTitle, styles.posterTitleHero, { fontSize: typeScale.title, lineHeight: typeScale.titleLine }]}>
                  One question{"\n"}before sleep
                </Text>
                <Text style={[styles.posterBody, { fontSize: typeScale.body, lineHeight: typeScale.bodyLine }]}>
                  Save one idea from today, then pull it back tonight in a short recall.
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
                  Capture, then recall.{"\n"}Same time each night.
                </Text>
                <Text style={[styles.posterBody, styles.posterBodyDark, { fontSize: typeScale.body, lineHeight: typeScale.bodyLine }]}>
                  Photo or note in, one question out. No feed, no noise.
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
            <PrimaryButton
              label={loading ? "Getting ready..." : "Get Started"}
              onPress={handlePrimary}
              disabled={loading}
            />

            <GoogleSignInButton onPress={() => void startGoogleFlow()} disabled={loading} />
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
  const styles = useThemedStyles(createStyles);
  const { colors, isDark } = useAppTheme();
  const iconColor = active ? (isDark ? colors.primary : colors.onPrimary) : colors.primary;

  return (
    <View style={[styles.flowMiniCard, active && styles.flowMiniCardActive, compact && styles.flowMiniCardCompact]}>
      <View style={[styles.flowMiniIconBubble, active && styles.flowMiniIconBubbleActive, compact && styles.flowMiniIconBubbleCompact]}>
        <MaterialIcons name={icon} size={compact ? 18 : 20} color={iconColor} />
      </View>
      <Text style={[styles.flowMiniStep, active && styles.flowMiniStepActive]}>{step}</Text>
      <Text style={[styles.flowMiniTitle, active && styles.flowMiniTitleActive, compact && styles.flowMiniTitleCompact]}>{title}</Text>
    </View>
  );
}

function createStyles({ colors, typography, isDark }: ThemedStyleContext) {
  return StyleSheet.create({
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
    paddingHorizontal: theme.spacing.md,
    paddingTop: 4,
    paddingBottom: 2,
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
    paddingHorizontal: theme.spacing.md,
    justifyContent: "center",
  },
  posterBlock: {
    gap: 20,
  },
  heroImage: {
    width: "100%",
    aspectRatio: 1.4,
    borderRadius: theme.radius.xl,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.shadow,
    shadowOpacity: isDark ? 0.2 : 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    alignItems: "center",
    justifyContent: "center",
  },
  heroImageCompact: {
    aspectRatio: 1.48,
  },
  heroImageSmall: {
    aspectRatio: 1.55,
  },
  heroOrbLarge: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: isDark ? "rgba(114,168,134,0.12)" : "rgba(213,230,220,0.35)",
    top: -32,
    right: -18,
  },
  heroOrbSmall: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: isDark ? "rgba(114,168,134,0.08)" : "rgba(213,230,220,0.28)",
    left: -16,
    bottom: 12,
  },
  heroRing: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: isDark ? "rgba(114,168,134,0.2)" : "rgba(15,76,63,0.1)",
    top: -56,
    right: -64,
  },
  heroLogoShell: {
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: colors.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
    padding: 16,
  },
  heroLogo: {
    width: "100%",
    height: "100%",
  },
  copyCenter: {
    gap: 10,
    alignItems: "center",
  },
  overline: {
    color: colors.mutedSoft,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
  },
  posterTitle: {
    color: colors.text,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -1.2,
  },
  posterTitleHero: {
    color: colors.text,
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
    height: 140,
    borderRadius: theme.radius.xl,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  flowArtworkCompact: {
    height: 128,
  },
  flowArtworkSmall: {
    height: 118,
  },
  flowGlow: {
    position: "absolute",
    inset: 0,
    borderRadius: theme.radius.xl,
    backgroundColor: isDark ? "rgba(114,168,134,0.08)" : "rgba(213,230,220,0.14)",
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
    backgroundColor: colors.surfaceLow,
    borderRadius: theme.radius.lg,
    minHeight: 88,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  flowMiniCardActive: {
    backgroundColor: isDark ? colors.primarySoft : colors.primary,
    borderColor: isDark ? "rgba(114,168,134,0.45)" : colors.primary,
    minHeight: 96,
    transform: [{ translateY: -2 }],
  },
  flowMiniCardCompact: {
    minHeight: 80,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  flowMiniIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  flowMiniIconBubbleActive: {
    backgroundColor: isDark ? colors.surfaceHigh : colors.primarySoft,
  },
  flowMiniIconBubbleCompact: {
    width: 38,
    height: 38,
    marginBottom: 10,
  },
  flowMiniStep: {
    color: colors.mutedSoft,
    fontSize: 8,
    fontWeight: "700",
    marginBottom: 6,
  },
  flowMiniStepActive: {
    color: isDark ? colors.primary : "rgba(255,255,255,0.65)",
  },
  flowMiniTitle: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
  flowMiniTitleActive: {
    color: isDark ? colors.primary : colors.onPrimary,
  },
  flowMiniTitleCompact: {
    fontSize: 13,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: 8,
    backgroundColor: colors.background,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceHigh,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  actions: {
    gap: 12,
  },
});
}
