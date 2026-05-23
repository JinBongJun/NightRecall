import { Image, StyleSheet, Text, View } from "react-native";

import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { useAppTheme } from "../theme";

const brandLogo = require("../../../assets/logo.png");

type Props = {
  size?: "small" | "medium";
  showBetaBadge?: boolean;
  badgeLabel?: string;
};

export function BrandWordmark({ size = "medium", showBetaBadge = false, badgeLabel = "FREE" }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
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

function createStyles({ colors, typography, isDark }: ThemedStyleContext) {
  return StyleSheet.create({
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
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.shadow,
    shadowOpacity: isDark ? 0.12 : 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  logoFrameSmall: {
    width: 32,
    height: 32,
  },
  logoFrameMedium: {
    width: 38,
    height: 38,
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
    fontSize: 15,
  },
  textMedium: {
    fontSize: 16,
  },
  tagline: {
    color: colors.mutedSoft,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: isDark ? "rgba(114,168,134,0.35)" : "rgba(15,76,63,0.16)",
  },
  badgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
});
}
