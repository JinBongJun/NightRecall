import { forwardRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";
import { theme, useAppTheme } from "../theme";
import { MAX_FONT_SCALE } from "../theme/typography";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  onFocus?: TextInputProps["onFocus"];
  onBlur?: TextInputProps["onBlur"];
};

export const SearchField = forwardRef<TextInput, Props>(function SearchField(
  { value, onChangeText, placeholder, onFocus, onBlur },
  ref,
) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  return (
    <View
      style={styles.wrap}
      accessibilityRole="search"
      accessibilityLabel="Search saved learning"
      accessibilityHint="Filters saved photos and notes"
    >
      <MaterialIcons name="search" size={16} color={colors.muted} importantForAccessibility="no" />
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        allowFontScaling
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        accessibilityLabel="Search query"
      />
      {value ? (
        <Pressable
          style={({ pressed }) => [styles.clearButton, pressed && styles.clearPressed]}
          onPress={() => onChangeText("")}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Text style={styles.clearText} allowFontScaling maxFontSizeMultiplier={MAX_FONT_SCALE}>
            Clear
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
});

function createStyles({ colors, typography }: ThemedStyleContext) {
  return StyleSheet.create({
  wrap: {
    minHeight: theme.control.inputMinHeight,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    paddingVertical: 0,
  },
  clearButton: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceHigh,
  },
  clearText: {
    color: colors.primary,
    fontSize: typography.micro.fontSize,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  clearPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
}
