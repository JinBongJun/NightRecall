import { forwardRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { colors } from "../theme/colors";
import { theme } from "../theme";

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
  return (
    <View style={styles.wrap}>
      <MaterialIcons name="search" size={16} color={colors.muted} />
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
      />
      {value ? (
        <Pressable style={({ pressed }) => [styles.clearButton, pressed && styles.clearPressed]} onPress={() => onChangeText("")}>
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    minHeight: theme.control.inputMinHeight,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
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
    fontSize: theme.typography.micro.fontSize,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  clearPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
