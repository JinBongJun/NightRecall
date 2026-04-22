import { Image, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

const brandLogo = require("../../../assets/logo.png");

type Props = {
  size?: "small" | "medium";
  showBetaBadge?: boolean;
  badgeLabel?: string;
};

export function BrandWordmark({ size = "medium", showBetaBadge = false, badgeLabel = "FREE" }: Props) {
  const compact = size === "small";

  return (
    <View style={styles.wrap}>
      <View style={[styles.logoFrame, compact ? styles.logoFrameSmall : styles.logoFrameMedium]}>
        <Image source={brandLogo} style={[styles.logo, compact ? styles.logoSmall : styles.logoMedium]} resizeMode="contain" />
      </View>
      <View style={styles.textWrap}>
        <View style={styles.nameRow}>
          <Text style={[styles.text, compact ? styles.textSmall : styles.textMedium]}>NightRecall</Text>
          {showBetaBadge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          ) : null}
        </View>
        {!compact ? <Text style={styles.tagline}>Quiet memory, every night</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  logoFrame: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,253,248,0.84)",
    borderWidth: 1,
    borderColor: "rgba(15,76,63,0.12)",
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  logoFrameSmall: {
    width: 36,
    height: 36,
  },
  logoFrameMedium: {
    width: 44,
    height: 44,
  },
  logo: {
    borderRadius: 999,
  },
  logoSmall: {
    width: 22,
    height: 22,
  },
  logoMedium: {
    width: 28,
    height: 28,
  },
  textWrap: {
    gap: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    color: colors.primary,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  textSmall: {
    fontSize: 18,
  },
  textMedium: {
    fontSize: 19,
  },
  tagline: {
    color: colors.mutedSoft,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(18,67,67,0.12)",
    borderWidth: 1,
    borderColor: "rgba(18,67,67,0.18)",
  },
  badgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
});
