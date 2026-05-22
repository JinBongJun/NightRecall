import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Alert, Linking, Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { SectionRow } from "../components/SectionRow";
import { TopBar } from "../components/TopBar";
import { ScreenContainer } from "../components/ScreenContainer";
import { clearPersistedSession, persistSession } from "../services/authSessionService";
import { getGoogleIdToken, isGoogleSignInCancelled, signOutGoogle } from "../services/googleAuthService";
import { cancelNightlyReminder, openSystemNotificationSettings, sendTestReminder } from "../services/reminderService";
import { syncReminderWithServer } from "../services/syncReminderSettings";
import { deleteMyAccount, fetchMe, linkGoogleIdToken, logoutSession } from "../services/userService";
import { useAuthStore } from "../store/authStore";
import { useOnboardingStore } from "../store/onboardingStore";
import { useReminderStore } from "../store/reminderStore";
import type { ThemePreference } from "../services/themePreferenceStorage";
import { useThemeStore } from "../store/themeStore";
import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { theme, useAppTheme } from "../theme";
import type { RootStackParamList } from "../navigation/types";
import { playLightTapHaptic } from "../utils/feedback";
type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

const ACCOUNT_DELETION_URL = "https://night-recall.vercel.app/account-deletion/";
const SUPPORT_EMAIL = "bongjun0289@gmail.com";

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: "system", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function SettingsScreen({ navigation }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const themePreference = useThemeStore((state) => state.preference);
  const setThemePreference = useThemeStore((state) => state.setPreference);
  const userId = useAuthStore((state) => state.userId);
  const timezone = useAuthStore((state) => state.timezone);
  const provider = useAuthStore((state) => state.provider);
  const email = useAuthStore((state) => state.email);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setOnboardingReminderTime = useOnboardingStore((state) => state.setReminderTime);
  const reminderTime = useReminderStore((state) => state.reminderTime);
  const notificationsEnabled = useReminderStore((state) => state.notificationsEnabled);
  const nextReminderLabel = useReminderStore((state) => state.nextReminderLabel);
  const permissionDenied = useReminderStore((state) => state.permissionDenied);
  const [timeValue, setTimeValue] = useState(reminderTime);
  const [enabled, setEnabled] = useState(notificationsEnabled);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [draftTimeValue, setDraftTimeValue] = useState(reminderTime);
  const latestTimeValueRef = useRef(timeValue);
  const latestEnabledRef = useRef(enabled);
  const syncedReminderTimeRef = useRef(reminderTime);
  const syncedNotificationsEnabledRef = useRef(notificationsEnabled);
  const saveInFlightRef = useRef(false);
  const lastRequestedSaveRef = useRef<string | null>(null);
  const [testReminderMessage, setTestReminderMessage] = useState<string | null>(null);
  const testReminderMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTestReminderFeedback = useCallback((message: string) => {
    if (testReminderMessageTimeoutRef.current) {
      clearTimeout(testReminderMessageTimeoutRef.current);
    }
    setTestReminderMessage(message);
    testReminderMessageTimeoutRef.current = setTimeout(() => {
      setTestReminderMessage(null);
      testReminderMessageTimeoutRef.current = null;
    }, 8000);
  }, []);

  useEffect(() => {
    return () => {
      if (testReminderMessageTimeoutRef.current) {
        clearTimeout(testReminderMessageTimeoutRef.current);
      }
    };
  }, []);
  useEffect(() => {
    setTimeValue(reminderTime);
    setDraftTimeValue(reminderTime);
    latestTimeValueRef.current = reminderTime;
    syncedReminderTimeRef.current = reminderTime;
  }, [reminderTime]);

  useEffect(() => {
    setEnabled(notificationsEnabled);
    latestEnabledRef.current = notificationsEnabled;
    syncedNotificationsEnabledRef.current = notificationsEnabled;
  }, [notificationsEnabled]);

  useEffect(() => {
    latestTimeValueRef.current = timeValue;
  }, [timeValue]);

  useEffect(() => {
    latestEnabledRef.current = enabled;
  }, [enabled]);

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) {
        return;
      }

      let active = true;

      void fetchMe()
        .then(async (response) => {
          if (!active) {
            return;
          }
          if (saveInFlightRef.current) {
            return;
          }

          const nextReminderTime = response.user.reminder_time ? response.user.reminder_time.slice(0, 5) : "22:30";
          const accountTimezone = response.user.timezone || timezone;

          await syncReminderWithServer({
            reminderTime: nextReminderTime,
            enabled: response.user.notifications_enabled,
            timezone: accountTimezone,
            requestPermission: false,
            patchServer: true,
          });

          setProfile({
            email: response.user.email_nullable,
            displayName: response.user.display_name ?? null,
            avatarUrl: response.user.avatar_url ?? null,
          });

          const synced = useReminderStore.getState();
          setTimeValue(synced.reminderTime);
          setEnabled(synced.notificationsEnabled);
          syncedReminderTimeRef.current = synced.reminderTime;
          syncedNotificationsEnabledRef.current = synced.notificationsEnabled;
        })
        .catch((error) => {
          if (!active) {
            return;
          }

          if (axios.isAxiosError(error) && error.response?.status === 401) {
            return;
          }
        });

      return () => {
        active = false;
      };
    }, [accessToken, setProfile, timezone]),
  );

  const parseReminderTime = (value: string) => {
    const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) {
      return null;
    }

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }

    return {
      hour,
      minute,
      normalized: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
    };
  };

  const formatReminderLabel = (value: string) => {
    const parsed = parseReminderTime(value);
    if (!parsed) {
      return value;
    }

    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(2026, 0, 1, parsed.hour, parsed.minute));
  };

  const reminderDate = () => {
    const parsed = parseReminderTime(draftTimeValue);
    if (!parsed) {
      return new Date(2026, 0, 1, 22, 30);
    }

    return new Date(2026, 0, 1, parsed.hour, parsed.minute);
  };

  const saveReminderSettings = useCallback(
    async (nextTimeValue: string, nextEnabled: boolean, options?: { showErrorAlert?: boolean }) => {
      if (!userId) {
        return false;
      }

      const parsed = parseReminderTime(nextTimeValue);
      if (!parsed) {
        if (options?.showErrorAlert !== false) {
          Alert.alert("Invalid time", "Use HH:MM in 24-hour format, like 22:30.");
        }
        return false;
      }

      const requestedSaveKey = `${parsed.normalized}:${nextEnabled ? "on" : "off"}`;
      if (saveInFlightRef.current && lastRequestedSaveRef.current === requestedSaveKey) {
        return true;
      }

      try {
        saveInFlightRef.current = true;
        lastRequestedSaveRef.current = requestedSaveKey;
        setTimeValue(parsed.normalized);
        setEnabled(nextEnabled);

        const result = await syncReminderWithServer({
          reminderTime: parsed.normalized,
          enabled: nextEnabled,
          timezone,
          requestPermission: nextEnabled,
          patchServer: true,
        });

        setTimeValue(result.normalizedTime ?? parsed.normalized);
        setEnabled(result.scheduled);
        syncedReminderTimeRef.current = result.normalizedTime ?? parsed.normalized;
        syncedNotificationsEnabledRef.current = result.scheduled;
        saveInFlightRef.current = false;
        lastRequestedSaveRef.current = `${result.normalizedTime ?? parsed.normalized}:${result.scheduled ? "on" : "off"}`;
        return true;
      } catch {
        saveInFlightRef.current = false;
        lastRequestedSaveRef.current = null;
        setTimeValue(syncedReminderTimeRef.current);
        setEnabled(syncedNotificationsEnabledRef.current);
        if (options?.showErrorAlert !== false) {
          Alert.alert("Save failed", "Reminder settings could not be updated.");
        }
        return false;
      }
    },
    [timezone, userId],
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        const latestTimeValue = latestTimeValueRef.current;
        const latestEnabled = latestEnabledRef.current;
        const syncedTimeValue = syncedReminderTimeRef.current;
        const syncedEnabled = syncedNotificationsEnabledRef.current;

        if (latestTimeValue !== syncedTimeValue || latestEnabled !== syncedEnabled) {
          void saveReminderSettings(latestTimeValue, latestEnabled, { showErrorAlert: false });
        }
      };
    }, [saveReminderSettings]),
  );

  const connectGoogle = async () => {
    try {
      const idToken = await getGoogleIdToken();
      if (!idToken) {
        return;
      }

      const linked = await linkGoogleIdToken(idToken);
      const payload = linked;
      try {
        await persistSession(payload);
      } catch {
        useAuthStore.getState().setSession(payload);
      }
    } catch (error) {
      if (isGoogleSignInCancelled(error)) {
        return;
      }
      const detail =
        axios.isAxiosError(error) && typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : error instanceof Error && error.message
            ? error.message
            : "Google account could not be linked.";
      Alert.alert("Link failed", detail);
    }
  };

  const logout = async () => {
    if (refreshToken) {
      try {
        await logoutSession(refreshToken);
      } catch {
        // Best-effort revoke. Local logout should still complete.
      }
    }
    if (provider === "google") {
      await signOutGoogle();
    }
    await clearPersistedSession();
  };

  const deleteAccount = async () => {
    Alert.alert(
      "Delete account?",
      "This permanently erases your saved learning, questions, answers, images, and account history. This cannot be undone.\n\nYou can sign in again with Google, but your NightRecall data will not be restored.",
      [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete permanently",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await deleteMyAccount();
              await cancelNightlyReminder();
              if (provider === "google") {
                await signOutGoogle();
              }
              await clearPersistedSession();
              Alert.alert(
                "Account deleted",
                "Your account and NightRecall data were permanently deleted. If you sign in again with Google, NightRecall will create a new account.",
                [{ text: "OK" }],
                { cancelable: false },
              );
            } catch {
              Alert.alert("Delete failed", "Account deletion could not be completed.");
            }
          })();
        },
      },
      ],
    );
  };

  const resetOnboarding = async () => {
    await clearPersistedSession();
    await cancelNightlyReminder();
    useReminderStore.getState().resetReminder();
    setOnboardingReminderTime("22:30");
  };

  const openExternalUrl = async (url: string, failureTitle: string, failureBody: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(failureTitle, failureBody);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert(failureTitle, failureBody);
    }
  };

  const contactSupport = async () => {
    const mailUrl = `mailto:${SUPPORT_EMAIL}?subject=NightRecall%20Support`;
    try {
      const supported = await Linking.canOpenURL(mailUrl);
      if (supported) {
        await Linking.openURL(mailUrl);
        return;
      }
    } catch {
      // Fall through to the copy fallback below.
    }

    Alert.alert("Email app unavailable", `Use ${SUPPORT_EMAIL} to contact support.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Copy email",
        onPress: () => {
          void Clipboard.setStringAsync(SUPPORT_EMAIL).then(() => {
            Alert.alert("Email copied", SUPPORT_EMAIL);
          });
        },
      },
    ]);
  };

  const openDeletionPage = async () => {
    await openExternalUrl(
      ACCOUNT_DELETION_URL,
      "Could not open deletion page",
      "NightRecall could not open the account deletion page right now.",
    );
  };

  const handleTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!selectedDate) {
      if (Platform.OS === "android") {
        setShowTimePicker(false);
      }
      return;
    }

    const nextValue = `${selectedDate.getHours().toString().padStart(2, "0")}:${selectedDate
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    setDraftTimeValue(nextValue);

    if (Platform.OS === "android") {
      setShowTimePicker(false);
      setTimeValue(nextValue);
      latestTimeValueRef.current = nextValue;
      void saveReminderSettings(nextValue, latestEnabledRef.current);
    }
  };

  return (
    <ScreenContainer>
      <TopBar leftIcon="arrow-back" onLeftPress={() => navigation.goBack()} title="Settings" />
      <View style={styles.header}>
        <Text style={styles.subtitle}>Reminders, notifications, and policies.</Text>
      </View>

      <View style={styles.section}>
        <SectionRow title="Profile" iconName="person" />
        <Pressable
          style={({ pressed }) => [styles.profileLinkRow, pressed && styles.profileLinkRowPressed]}
          onPress={() => navigation.navigate("Account")}
        >
          <View style={styles.profileLinkCopy}>
            <Text style={styles.profileLinkTitle}>Account & backup</Text>
            <Text style={styles.profileLinkHelper}>Google, guest, and profile details</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.mutedSoft} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <SectionRow title="Preferences" iconName="tune" />
        <View style={styles.card}>
          <View style={styles.appearanceBlock}>
            <View style={styles.settingCopy}>
              <Text style={styles.label}>Appearance</Text>
              <Text style={styles.helper}>Choose light, dark, or match your phone</Text>
            </View>
            <View style={styles.themeOptions} accessibilityRole="radiogroup" accessibilityLabel="Appearance">
              {THEME_OPTIONS.map((option) => {
                const selected = themePreference === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={({ pressed }) => [
                      styles.themeOption,
                      selected && styles.themeOptionActive,
                      pressed && styles.themeOptionPressed,
                    ]}
                    onPress={() => void setThemePreference(option.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.label}
                  >
                    <Text style={[styles.themeOptionText, selected && styles.themeOptionTextActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Pressable
            style={styles.settingRow}
            onPress={() => {
              setDraftTimeValue(timeValue);
              setShowTimePicker(true);
            }}
          >
            <View style={styles.settingCopy}>
              <Text style={styles.label}>Night reminder</Text>
              <Text style={styles.helper} numberOfLines={2}>
                Choose when NightRecall should nudge you
              </Text>
            </View>
            <View style={styles.settingValueWrap}>
              <Text style={styles.timeValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                {formatReminderLabel(timeValue)}
              </Text>
              <MaterialIcons name="chevron-right" size={22} color={colors.mutedSoft} />
            </View>
          </Pressable>
          {showTimePicker && Platform.OS === "ios" ? (
            <View style={styles.timePickerCard}>
              <DateTimePicker value={reminderDate()} mode="time" display="spinner" onChange={handleTimeChange} />
              <View style={styles.timePickerActions}>
                <Pressable
                  style={({ pressed }) => [styles.timePickerButton, pressed && styles.timePickerButtonPressed]}
                  onPress={() => {
                    setDraftTimeValue(timeValue);
                    setShowTimePicker(false);
                  }}
                >
                  <Text style={styles.timePickerButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.timePickerPrimaryButton, pressed && styles.timePickerButtonPressed]}
                  onPress={() => {
                    setShowTimePicker(false);
                    setTimeValue(draftTimeValue);
                    latestTimeValueRef.current = draftTimeValue;
                    void saveReminderSettings(draftTimeValue, latestEnabledRef.current);
                  }}
                >
                  <Text style={styles.timePickerPrimaryText}>Done</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.label}>Notifications</Text>
              <Text style={styles.helper}>{enabled ? "On for this device" : "Off"}</Text>
              <Text style={styles.helperMuted}>{nextReminderLabel}</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={(nextEnabled) => {
                setEnabled(nextEnabled);
                latestEnabledRef.current = nextEnabled;
                void saveReminderSettings(latestTimeValueRef.current, nextEnabled);
              }}
            />
          </View>
          {permissionDenied ? (
            <Pressable style={styles.permissionRow} onPress={() => void openSystemNotificationSettings()}>
              <Text style={styles.permissionText}>Open system notification settings</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={({ pressed }) => [styles.testReminderButton, pressed && styles.testReminderButtonPressed]}
            onPress={() => {
              void sendTestReminder().then((sent) => {
                if (!sent) {
                  setTestReminderMessage(null);
                  Alert.alert("Notifications blocked", "Allow notifications for NightRecall in system settings.");
                  return;
                }

                void playLightTapHaptic();
                showTestReminderFeedback("Test sent. Check your notification in a few seconds.");
              });
            }}
          >
            <Text style={styles.testReminderText}>Send test notification</Text>
          </Pressable>
          {testReminderMessage ? (
            <Text style={styles.testReminderFeedback}>{testReminderMessage}</Text>
          ) : null}
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.label}>Timezone</Text>
              <Text style={styles.helper}>Reminders follow your account timezone</Text>
              <Text style={styles.helper}>{timezone}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <SectionRow title="Account & data" iconName="account-circle" />
        <View style={styles.card}>
          {provider !== "google" ? (
            <Pressable style={styles.settingRow} onPress={() => void connectGoogle()}>
              <View style={styles.settingCopy}>
                <Text style={styles.label}>Google account</Text>
                <Text style={styles.helper}>Connect Google to keep your learning backed up.</Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.settingRow}>
              <View style={styles.settingCopy}>
                <Text style={styles.label}>Google account</Text>
                <Text style={styles.helper}>{email ? `Connected as ${email}` : "Connected with Google"}</Text>
              </View>
            </View>
          )}
          <Pressable style={styles.settingRow} onPress={() => navigation.navigate("PrivacyPolicy")}>
            <View style={styles.settingCopy}>
              <Text style={styles.label}>Privacy Policy</Text>
              <Text style={styles.helper} numberOfLines={2}>
                Read how NightRecall handles your data
              </Text>
            </View>
          </Pressable>
          <Pressable style={styles.settingRow} onPress={() => navigation.navigate("RefundPolicy")}>
            <View style={styles.settingCopy}>
              <Text style={styles.label}>Refund Policy</Text>
              <Text style={styles.helper} numberOfLines={2}>
                Read how billing questions and refund requests are handled
              </Text>
            </View>
          </Pressable>
          <Pressable style={styles.settingRow} onPress={() => void openDeletionPage()}>
            <View style={styles.settingCopy}>
              <Text style={styles.label}>Deletion Request</Text>
              <Text style={styles.helper} numberOfLines={2}>
                Use the web form if you cannot access the app
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <SectionRow title="Support" iconName="support-agent" />
        <View style={styles.card}>
          <Pressable style={styles.settingRow} onPress={() => void contactSupport()}>
            <View style={styles.settingCopy}>
              <Text style={styles.label}>Contact Support</Text>
              <Text style={styles.helper}>{SUPPORT_EMAIL}</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {__DEV__ ? (
        <View style={styles.section}>
          <SectionRow title="Developer tools" iconName="developer-mode" />
          <Pressable style={({ pressed }) => [styles.secondaryLink, pressed && styles.secondaryLinkPressed]} onPress={() => void resetOnboarding()}>
            <Text style={styles.secondaryLinkText}>Reset onboarding</Text>
          </Pressable>
        </View>
      ) : null}
      {accessToken && refreshToken ? (
        <Pressable style={({ pressed }) => [styles.logoutLink, pressed && styles.secondaryLinkPressed]} onPress={() => void logout()}>
          <Text style={styles.logoutLinkText}>Log Out</Text>
        </Pressable>
      ) : null}
      {accessToken ? (
        <View style={styles.section}>
          <SectionRow title="Danger zone" iconName="warning" />
          <Pressable style={styles.deleteCard} onPress={() => void deleteAccount()}>
            <Text style={styles.deleteTitle}>Delete Account</Text>
            <Text style={styles.deleteBody}>Permanently erase all recall history</Text>
          </Pressable>
        </View>
      ) : null}
      {showTimePicker && Platform.OS === "android" ? (
        <DateTimePicker
          value={reminderDate()}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      ) : null}
    </ScreenContainer>
  );
}

function createStyles({ colors, typography }: ThemedStyleContext) {
  return StyleSheet.create({

  header: {
    gap: 4,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 320,
  },
  profileLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  profileLinkRowPressed: {
    opacity: 0.92,
  },
  profileLinkCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  profileLinkTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  profileLinkHelper: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  section: {
    gap: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  appearanceBlock: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  themeOptions: {
    flexDirection: "row",
    gap: 8,
  },
  themeOption: {
    flex: 1,
    minHeight: theme.control.buttonMinHeightCompact,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  themeOptionActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  themeOptionPressed: {
    opacity: 0.9,
  },
  themeOptionText: {
    color: colors.muted,
    fontSize: typography.caption.fontSize,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  themeOptionTextActive: {
    color: colors.primary,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: 12,
  },
  settingCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingRight: 8,
  },
  label: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
  },
  helper: {
    color: colors.muted,
    lineHeight: 16,
  },
  helperMuted: {
    color: colors.mutedSoft,
    fontSize: typography.micro.fontSize,
    lineHeight: typography.micro.lineHeight,
  },
  permissionRow: {
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  permissionText: {
    color: colors.primary,
    fontSize: typography.caption.fontSize,
    fontWeight: "800",
  },
  testReminderButton: {
    marginHorizontal: 18,
    marginBottom: 12,
    minHeight: theme.control.buttonMinHeightCompact,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
  },
  testReminderButtonPressed: {
    opacity: 0.9,
  },
  testReminderText: {
    color: colors.primary,
    fontSize: typography.caption.fontSize,
    fontWeight: "800",
  },
  testReminderFeedback: {
    marginHorizontal: 18,
    marginTop: -4,
    marginBottom: 12,
    color: colors.primary,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    lineHeight: typography.caption.lineHeight,
  },
  settingValueWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
    marginLeft: 8,
    maxWidth: 110,
  },
  timeValue: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 15,
  },
  timePickerCard: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.surfaceLow,
  },
  timePickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  timePickerButton: {
    minHeight: 36,
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timePickerPrimaryButton: {
    minHeight: 36,
    borderRadius: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  timePickerButtonPressed: {
    opacity: 0.92,
  },
  timePickerButtonText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 13,
  },
  timePickerPrimaryText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  secondaryLink: {
    minHeight: 40,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutLink: {
    minHeight: 40,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutLinkText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 13,
  },
  secondaryLinkText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  secondaryLinkPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  deleteCard: {
    backgroundColor: "#FFF5F2",
    borderRadius: 16,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#F2C9C2",
  },
  deleteTitle: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "800",
  },
  deleteBody: {
    color: colors.danger,
  },
});
}
