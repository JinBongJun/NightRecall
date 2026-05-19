import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";

import { BrandWordmark } from "../components/BrandWordmark";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../theme/colors";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "RefundPolicy">;

const REFUND_POLICY_URL = "https://night-recall.vercel.app/refund-policy/";
const SUPPORT_EMAIL = "bongjun0289@gmail.com";

export function RefundPolicyScreen({ navigation }: Props) {
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
        <Text style={styles.title}>Refund Policy</Text>
        <Text style={styles.subtitle}>How NightRecall handles billing questions and refund requests.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Current plan</Text>
        <Text style={styles.body}>NightRecall is currently shown as a free plan in the app. If paid plans are added, refund terms will be shown before purchase.</Text>

        <Text style={styles.sectionTitle}>Refund requests</Text>
        <Text style={styles.body}>If you believe you were charged incorrectly, contact support with the account email and purchase details.</Text>

        <Text style={styles.sectionTitle}>App store purchases</Text>
        <Text style={styles.body}>Purchases made through an app store may need to be refunded through that store's refund process.</Text>

        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.body}>{SUPPORT_EMAIL}</Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={() => void openExternalUrl(REFUND_POLICY_URL, "Could not open policy", "NightRecall could not open the refund policy right now.")}>
        <Text style={styles.primaryButtonText}>Open full refund policy</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => void openExternalUrl(`mailto:${SUPPORT_EMAIL}?subject=NightRecall%20Refund%20Question`, "Could not open email", `Use ${SUPPORT_EMAIL} to contact support.`)}>
        <Text style={styles.secondaryButtonText}>Email support</Text>
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
