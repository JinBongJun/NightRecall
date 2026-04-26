import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { MaterialIcons } from "@expo/vector-icons";
import { Alert, Linking, Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { SectionRow } from "../components/SectionRow";
import { TopBar } from "../components/TopBar";
import { ScreenContainer } from "../components/ScreenContainer";
import { clearPersistedSession, persistSession } from "../services/authSessionService";
import { getGoogleIdTokenFromResult, useGoogleIdTokenRequest } from "../services/googleAuthService";
import { cancelNightlyReminder, scheduleLocalReminder } from "../services/reminderService";
import { updateReminderSettings } from "../services/settingsService";
import { deleteMyAccount, fetchMe, linkGoogleIdToken, logoutSession } from "../services/userService";
import { useAuthStore } from "../store/authStore";
import { useOnboardingStore } from "../store/onboardingStore";
import { useReminderStore } from "../store/reminderStore";
import { colors } from "../theme/colors";
import { RootStackParamList } from "../types/navigation";
type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

const ACCOUNT_DELETION_URL = "https://night-recall.vercel.app/account-deletion/";
const SUPPORT_EMAIL = "bongjun0289@gmail.com";

export function SettingsScreen({ navigation }: Props) {
  const userId = useAuthStore((state) => state.userId);
  const timezone = useAuthStore((state) => state.timezone);
  const provider = useAuthStore((state) => state.provider);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const setOnboardingReminderTime = useOnboardingStore((state) => state.setReminderTime);
  const reminderTime = useReminderStore((state) => state.reminderTime);
  const notificationsEnabled = useReminderStore((state) => state.notificationsEnabled);
  const setReminder = useReminderStore((state) => state.setReminder);
  const [timeValue, setTimeValue] = useState(reminderTime);
  const [enabled, setEnabled] = useState(notificationsEnabled);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [draftTimeValue, setDraftTimeValue] = useState(reminderTime);
  const [googleLinkPending, setGoogleLinkPending] = useState(false);
  const { promptAsync, response } = useGoogleIdTokenRequest();
  const latestTimeValueRef = useRef(timeValue);
  const latestEnabledRef = useRef(enabled);
  const syncedReminderTimeRef = useRef(reminderTime);
  const syncedNotificationsEnabledRef = useRef(notificationsEnabled);
  const saveInFlightRef = useRef(false);
  const lastRequestedSaveRef = useRef<string | null>(null);
  const googleLinkInFlightRef = useRef(false);

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
        .then((response) => {
          if (!active) {
            return;
          }
          if (saveInFlightRef.current) {
            return;
          }

          const nextReminderTime = response.user.reminder_time ? response.user.reminder_time.slice(0, 5) : "22:30";
          const nextNotificationsEnabled = response.user.notifications_enabled;

          setReminder(nextReminderTime, nextNotificationsEnabled);
          setTimeValue(nextReminderTime);
          setEnabled(nextNotificationsEnabled);
          syncedReminderTimeRef.current = nextReminderTime;
          syncedNotificationsEnabledRef.current = nextNotificationsEnabled;
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
    }, [accessToken, setReminder]),
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
        setReminder(parsed.normalized, nextEnabled);
        setTimeValue(parsed.normalized);
        setEnabled(nextEnabled);

        let finalEnabled = nextEnabled;
        if (nextEnabled) {
          finalEnabled = await scheduleLocalReminder(parsed.hour, parsed.minute);
        } else {
          await cancelNightlyReminder();
        }

        await updateReminderSettings({
          reminder_time: parsed.normalized,
          notifications_enabled: finalEnabled,
          timezone,
        });

        setReminder(parsed.normalized, finalEnabled);
        setTimeValue(parsed.normalized);
        setEnabled(finalEnabled);
        syncedReminderTimeRef.current = parsed.normalized;
        syncedNotificationsEnabledRef.current = finalEnabled;
        saveInFlightRef.current = false;
        lastRequestedSaveRef.current = `${parsed.normalized}:${finalEnabled ? "on" : "off"}`;
        return true;
      } catch {
        saveInFlightRef.current = false;
        lastRequestedSaveRef.current = null;
        setReminder(syncedReminderTimeRef.current, syncedNotificationsEnabledRef.current);
        setTimeValue(syncedReminderTimeRef.current);
        setEnabled(syncedNotificationsEnabledRef.current);
        if (options?.showErrorAlert !== false) {
          Alert.alert("Save failed", "Reminder settings could not be updated.");
        }
        return false;
      }
    },
    [timezone, userId, setReminder],
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

  const completeGoogleLink = useCallback(async (idToken: string) => {
    if (googleLinkInFlightRef.current) {
      return;
    }
    googleLinkInFlightRef.current = true;
    try {
      const linked = await linkGoogleIdToken(idToken);
      const payload = {
        userId: linked.user.id,
        timezone: linked.user.timezone,
        authMode: "signed_in" as const,
        accessToken: linked.tokens.access_token,
        refreshToken: linked.tokens.refresh_token,
        provider: "google" as const,
      };
      try {
        await persistSession(payload);
      } catch {
        useAuthStore.getState().setSession(payload);
      }
    } catch (error) {
      const detail =
        axios.isAxiosError(error) && typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : error instanceof Error && error.message
            ? error.message
            : "Google account could not be linked.";
      Alert.alert("Link failed", detail);
    } finally {
      googleLinkInFlightRef.current = false;
      setGoogleLinkPending(false);
    }
  }, []);

  useEffect(() => {
    if (!googleLinkPending) {
      return;
    }
    const idToken = getGoogleIdTokenFromResult(response);
    if (idToken) {
      void completeGoogleLink(idToken);
      return;
    }
    if (response?.type === "error") {
      setGoogleLinkPending(false);
      Alert.alert("Link failed", "Google account could not be linked.");
    }
  }, [completeGoogleLink, googleLinkPending, response]);

  const connectGoogle = async () => {
    try {
      setGoogleLinkPending(true);
      const authResult = await promptAsync();
      if (authResult.type !== "success") {
        setGoogleLinkPending(false);
        return;
      }
      const idToken = getGoogleIdTokenFromResult(authResult);
      if (idToken) {
        await completeGoogleLink(idToken);
      }
      // Installed app flows may return a code first; response updates with id_token after auto exchange.
    } catch (error) {
      setGoogleLinkPending(false);
      const detail = error instanceof Error && error.message ? error.message : "Google account could not be linked.";
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
    await clearPersistedSession();
  };

  const deleteAccount = async () => {
    try {
      await deleteMyAccount();
      await clearPersistedSession();
    } catch {
      Alert.alert("Delete failed", "Account deletion could not be completed.");
    }
  };

  const resetOnboarding = async () => {
    await clearPersistedSession();
    await cancelNightlyReminder();
    setReminder("22:30", false);
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
    await openExternalUrl(
      `mailto:${SUPPORT_EMAIL}?subject=NightRecall%20Support`,
      "Could not open email",
      `Use ${SUPPORT_EMAIL} to contact support.`,
    );
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
        <Text style={styles.subtitle}>Adjust your preferences and manage your account.</Text>
      </View>

      <View style={styles.section}>
        <SectionRow title="Preferences" />
        <View style={styles.card}>
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
              <Text style={styles.helper}>{enabled ? "Enabled" : "Disabled"}</Text>
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
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.label}>Timezone</Text>
              <Text style={styles.helper}>Current account timezone</Text>
              <Text style={styles.helper}>{timezone}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <SectionRow title="Account & data" />
        <View style={styles.card}>
          {provider !== "google" ? (
            <Pressable style={styles.settingRow} onPress={() => void connectGoogle()}>
              <View style={styles.settingCopy}>
                <Text style={styles.label}>Linked Google Account</Text>
                <Text style={styles.helper}>Connect Google</Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.settingRow}>
              <View style={styles.settingCopy}>
                <Text style={styles.label}>Linked Google Account</Text>
                <Text style={styles.helper}>Connected</Text>
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
          <Pressable style={styles.settingRow} onPress={() => void openDeletionPage()}>
            <View style={styles.settingCopy}>
              <Text style={styles.label}>Deletion Request Page</Text>
              <Text style={styles.helper} numberOfLines={2}>
                Use the web page if you cannot access the app
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <SectionRow title="Support" />
        <View style={styles.card}>
          <Pressable style={styles.settingRow} onPress={() => void contactSupport()}>
            <View style={styles.settingCopy}>
              <Text style={styles.label}>Contact Support</Text>
              <Text style={styles.helper}>{SUPPORT_EMAIL}</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {accessToken && refreshToken ? (
        <Pressable style={({ pressed }) => [styles.secondaryLink, pressed && styles.secondaryLinkPressed]} onPress={() => void logout()}>
          <Text style={styles.secondaryLinkText}>Log Out</Text>
        </Pressable>
      ) : null}
      {__DEV__ ? (
        <Pressable style={({ pressed }) => [styles.secondaryLink, pressed && styles.secondaryLinkPressed]} onPress={() => void resetOnboarding()}>
          <Text style={styles.secondaryLinkText}>Reset onboarding</Text>
        </Pressable>
      ) : null}
      {accessToken ? (
        <Pressable style={styles.deleteCard} onPress={() => void deleteAccount()}>
          <Text style={styles.deleteTitle}>Delete Account</Text>
          <Text style={styles.deleteBody}>Permanently erase all recall history</Text>
        </Pressable>
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

const styles = StyleSheet.create({

  header: {
    gap: 4,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
  },
  section: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 18,
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
    fontSize: 17,
  },
  helper: {
    color: colors.muted,
    lineHeight: 18,
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
    fontSize: 17,
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
    minHeight: 40,
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timePickerPrimaryButton: {
    minHeight: 40,
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
    fontSize: 14,
  },
  timePickerPrimaryText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  secondaryLink: {
    minHeight: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryLinkText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryLinkPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  deleteCard: {
    backgroundColor: "#FCEAE4",
    borderRadius: 24,
    padding: 18,
    gap: 6,
  },
  deleteTitle: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: "800",
  },
  deleteBody: {
    color: colors.danger,
  },
});
