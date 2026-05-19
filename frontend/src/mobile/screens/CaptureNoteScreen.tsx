import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { TonightLimitsBar } from "../components/TonightLimitsBar";
import { TopBar } from "../components/TopBar";
import { colors } from "../theme/colors";
import { theme } from "../theme";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "CaptureNote">;

export function CaptureNoteScreen({ navigation }: Props) {
  const [sourceText, setSourceText] = useState("");
  const trimmedText = sourceText.trim();
  const canContinue = trimmedText.length >= 5;

  const onContinue = () => {
    if (!canContinue) {
      return;
    }

    navigation.navigate("Processing", {
      mode: "manual",
      sourceText: trimmedText,
    });
  };

  return (
    <ScreenContainer>
      <TopBar leftIcon="arrow-back" onLeftPress={() => navigation.goBack()} title="Write a note" />

      <TonightLimitsBar />

      <View style={styles.editorCard}>
        <TextInput
          value={sourceText}
          onChangeText={setSourceText}
          style={styles.input}
          multiline
          textAlignVertical="top"
          placeholder="Type one idea from today."
          placeholderTextColor={colors.mutedSoft}
        />
        <Text style={styles.hint}>One short idea works best.</Text>
      </View>

      <PrimaryButton label="Extract key points" onPress={onContinue} disabled={!canContinue} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  editorCard: {
    backgroundColor: colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    minHeight: 160,
    color: colors.text,
    fontSize: 14,
    lineHeight: 24,
    padding: 0,
  },
  hint: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
});
