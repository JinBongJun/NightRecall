import { MaterialIcons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

import { BrandWordmark } from "./BrandWordmark";
import { useAuthStore } from "../store/authStore";

type Props = {
  title?: string;
  subtitle?: string;
  leftIcon?: keyof typeof MaterialIcons.glyphMap | null;
  rightIcon?: keyof typeof MaterialIcons.glyphMap | null;
  onLeftPress?: () => void;
  onRightPress?: () => void;
};

export function TopBar({ title, subtitle, leftIcon, rightIcon, onLeftPress, onRightPress }: Props) {
  const showTitle = Boolean(title);
  const showProfileAction = rightIcon === "account-circle";
  const plan = useAuthStore((state) => state.plan);
  const avatarUrl = useAuthStore((state) => state.avatarUrl);
  const displayName = useAuthStore((state) => state.displayName);
  const email = useAuthStore((state) => state.email);
  const planLabel = plan === "plus" ? "PLUS" : "FREE";
  const avatarInitial = (displayName || email || "N").trim().charAt(0).toUpperCase();

  return (
    <View style={styles.root}>
      <View style={styles.shell}>
        {leftIcon ? (
          <Pressable onPress={onLeftPress} style={styles.iconButton} hitSlop={8}>
            <MaterialIcons name={leftIcon} size={22} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={styles.iconSpacer} />
        )}

        <View style={[styles.centerSection, showTitle ? styles.centerSectionTitled : styles.centerSectionBrand]}>
          {showTitle ? (
            <View style={styles.titleWrap}>
              <View style={styles.metaRow}>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{planLabel}</Text>
                </View>
              </View>
              <Text style={styles.title}>{title}</Text>
            </View>
          ) : (
            <BrandWordmark size="small" showBetaBadge badgeLabel={planLabel} />
          )}
        </View>

        {rightIcon ? (
          showProfileAction ? (
            <Pressable onPress={onRightPress} style={styles.profileButton} hitSlop={8}>
              <View style={styles.profileGlyphWrap}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
                ) : displayName || email ? (
                  <Text style={styles.profileInitial}>{avatarInitial}</Text>
                ) : (
                  <MaterialIcons name="person" size={19} color={colors.primary} />
                )}
              </View>
            </Pressable>
          ) : (
            <Pressable onPress={onRightPress} style={styles.iconButton} hitSlop={8}>
              <MaterialIcons name={rightIcon} size={22} color={colors.primary} />
            </Pressable>
          )
        ) : (
          <View style={styles.iconSpacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 58,
  },
  shell: {
    minHeight: 58,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.line,
  },
  iconSpacer: {
    width: 38,
    height: 38,
  },
  centerSection: {
    flex: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  centerSectionTitled: {
    alignItems: "center",
  },
  centerSectionBrand: {
    alignItems: "center",
  },
  titleWrap: {
    alignItems: "center",
    gap: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
  },
  subtitle: {
    color: colors.mutedSoft,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  title: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  planBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(18,67,67,0.10)",
    borderWidth: 1,
    borderColor: "rgba(18,67,67,0.18)",
  },
  planBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.0,
  },
  profileButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.line,
  },
  profileGlyphWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  profileInitial: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
});
