import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";

import { BrandWordmark } from "../components/BrandWordmark";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../theme/colors";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "PrivacyPolicy">;

const PRIVACY_POLICY_URL = "https://night-recall.vercel.app/privacy-policy/";
const ACCOUNT_DELETION_URL = "https://night-recall.vercel.app/account-deletion/";
const SUPPORT_EMAIL = "bongjun0289@gmail.com";

export function PrivacyPolicyScreen({ navigation }: Props) {
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

  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <BrandWordmark />
        <View style={styles.iconSpacer} />
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.subtitle}>How NightRecall handles your account, study content, and reminders.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>What NightRecall collects</Text>
        <Text style={styles.body}>Account identifiers, timezone and reminder settings, study inputs, generated questions, answers, and streak history.</Text>

        <Text style={styles.sectionTitle}>How it is used</Text>
        <Text style={styles.body}>To create nightly recall questions, keep your progress and reminders in sync, and protect the service from abuse.</Text>

        <Text style={styles.sectionTitle}>What happens to your data</Text>
        <Text style={styles.body}>You can delete your account in Settings. If you cannot access the app, you can use the web deletion request instead.</Text>

        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.body}>{SUPPORT_EMAIL}</Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={() => void openExternalUrl(PRIVACY_POLICY_URL, "Could not open policy", "NightRecall could not open the full privacy policy right now.")}>
        <Text style={styles.primaryButtonText}>Open full privacy policy</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => void openExternalUrl(`mailto:${SUPPORT_EMAIL}?subject=NightRecall%20Privacy%20Question`, "Could not open email", `Use ${SUPPORT_EMAIL} to contact support.`)}>
        <Text style={styles.secondaryButtonText}>Email support</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => void openExternalUrl(ACCOUNT_DELETION_URL, "Could not open deletion page", "NightRecall could not open the account deletion page right now.")}>
        <Text style={styles.secondaryButtonText}>Open deletion request</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSpacer: {
    width: 40,
    height: 40,
  },
  header: {
    gap: 8,
  },
  title: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  body: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 24,
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
});
