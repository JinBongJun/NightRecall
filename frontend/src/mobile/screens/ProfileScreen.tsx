import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { SectionRow } from "../components/SectionRow";
import { TopBar } from "../components/TopBar";
import { ScreenContainer } from "../components/ScreenContainer";
import { getCachedGoogleProfile } from "../services/googleAuthService";
import { fetchMe } from "../services/userService";
import { useAuthStore } from "../store/authStore";
import { colors } from "../theme/colors";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Account">;

export function AccountScreen({ navigation }: Props) {
  const provider = useAuthStore((state) => state.provider);
  const authMode = useAuthStore((state) => state.authMode);
  const timezone = useAuthStore((state) => state.timezone);
  const email = useAuthStore((state) => state.email);
  const displayName = useAuthStore((state) => state.displayName);
  const avatarUrl = useAuthStore((state) => state.avatarUrl);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setProfile = useAuthStore((state) => state.setProfile);

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) {
        return;
      }

      let active = true;
      if (provider === "google" && (!displayName || !avatarUrl)) {
        const cachedProfile = getCachedGoogleProfile();
        if (cachedProfile) {
          setProfile(cachedProfile);
        }
      }

      void fetchMe()
        .then((response) => {
          if (!active) {
            return;
          }
          setProfile({
            email: response.user.email_nullable,
            displayName: response.user.display_name ?? null,
            avatarUrl: response.user.avatar_url ?? null,
          });
        })
        .catch(() => {
          // Keep the last known local profile.
        });

      return () => {
        active = false;
      };
    }, [accessToken, avatarUrl, displayName, provider, setProfile]),
  );

  const profileTitle = provider === "google" ? displayName || "Google account" : authMode === "guest" ? "Guest account" : "Profile";
  const providerLabel = provider === "google" ? "Connected with Google" : "Not backed up yet";
  const avatarInitial = (displayName || email || "N").trim().charAt(0).toUpperCase();

  return (
    <ScreenContainer>
      <TopBar leftIcon="arrow-back" onLeftPress={() => navigation.goBack()} title="Account" />

      <View style={styles.heroCard}>
        <View style={styles.profileRow}>
          <View style={styles.profileCopy}>
            <View style={styles.providerBadge}>
              <MaterialIcons name={provider === "google" ? "verified-user" : "cloud-off"} size={14} color={colors.primary} />
              <Text style={styles.providerBadgeText}>{providerLabel}</Text>
            </View>
            <Text style={styles.heroTitle}>{profileTitle}</Text>
            {email ? <Text style={styles.emailText}>{email}</Text> : null}
          </View>
          <View style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : provider === "google" ? (
              <Text style={styles.avatarInitial}>{avatarInitial}</Text>
            ) : (
              <MaterialIcons name="person" size={34} color={colors.primary} />
            )}
          </View>
        </View>
        <View style={styles.reassuranceRow}>
          <MaterialIcons name={provider === "google" ? "cloud-done" : "cloud-off"} size={17} color={colors.primary} />
          <Text style={styles.reassuranceText}>
            {provider === "google" ? "Learning saved to this account" : "Connect Google to back up your learning"}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Timezone</Text>
          <Text style={styles.detailValue}>{timezone}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <SectionRow title="Account" iconName="account-circle" />
        <Pressable style={[styles.actionCard, styles.primaryActionCard]} onPress={() => navigation.navigate("Settings")}>
          <View style={styles.actionIconWrap}>
            <MaterialIcons name="tune" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Settings</Text>
            <Text style={styles.actionBody}>Manage reminders, notifications, and account preferences.</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.primary} />
        </Pressable>

        <Pressable style={styles.actionCard} onPress={() => navigation.navigate("Stats")}>
          <View style={[styles.actionIconWrap, styles.secondaryActionIconWrap]}>
            <MaterialIcons name="insights" size={22} color={colors.primary} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Recall stats</Text>
            <Text style={styles.actionBody}>Check streaks, progress, and recent performance.</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
        </Pressable>

        <Pressable style={styles.actionCard} onPress={() => navigation.navigate("PrivacyPolicy")}>
          <View style={[styles.actionIconWrap, styles.secondaryActionIconWrap]}>
            <MaterialIcons name="privacy-tip" size={22} color={colors.primary} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Privacy policy</Text>
            <Text style={styles.actionBody}>Read how NightRecall handles your data.</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({

  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(15,76,63,0.08)",
    gap: 16,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  providerBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  providerBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  avatarWrap: {
    width: 78,
    height: 78,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "800",
  },
  heroTitle: {
    color: colors.primary,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  emailText: {
    color: colors.mutedSoft,
    fontSize: 14,
    fontWeight: "700",
  },
  reassuranceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: colors.surfaceLow,
  },
  reassuranceText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  detailValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  section: {
    gap: 14,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: "rgba(15,76,63,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryActionCard: {
    borderColor: "rgba(15,76,63,0.16)",
    backgroundColor: "#FFFEFB",
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  secondaryActionIconWrap: {
    backgroundColor: colors.primarySoft,
  },
  actionCopy: {
    flex: 1,
    gap: 4,
  },
  actionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  actionBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
