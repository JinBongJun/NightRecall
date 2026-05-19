import { MaterialIcons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { theme } from "../theme";

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
            <MaterialIcons name={leftIcon} size={20} color={colors.primary} />
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
                  <MaterialIcons name="person" size={17} color={colors.primary} />
                )}
              </View>
            </Pressable>
          ) : (
            <Pressable onPress={onRightPress} style={styles.iconButton} hitSlop={8}>
              <MaterialIcons name={rightIcon} size={20} color={colors.primary} />
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
    minHeight: theme.control.touchTarget + 2,
  },
  shell: {
    minHeight: theme.control.touchTarget + 2,
    borderRadius: theme.radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.line,
  },
  iconSpacer: {
    width: 34,
    height: 34,
  },
  centerSection: {
    flex: 1,
    minHeight: 34,
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
    gap: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  subtitle: {
    color: colors.mutedSoft,
    fontSize: theme.typography.micro.fontSize,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: colors.primary,
    fontSize: theme.typography.section.fontSize,
    lineHeight: theme.typography.section.lineHeight,
    fontWeight: theme.typography.section.fontWeight,
    letterSpacing: -0.4,
  },
  planBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(18,67,67,0.10)",
    borderWidth: 1,
    borderColor: "rgba(18,67,67,0.18)",
  },
  planBadgeText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.9,
  },
  profileButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.line,
  },
  profileGlyphWrap: {
    width: 24,
    height: 24,
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
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "800",
  },
});
