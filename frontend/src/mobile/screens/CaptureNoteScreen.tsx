import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { BrandWordmark } from "../components/BrandWordmark";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenHeader } from "../components/ScreenHeader";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../theme/colors";
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
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <BrandWordmark />
        <View style={styles.iconSpacer} />
      </View>

      <ScreenHeader
        iconName="edit-note"
        title="Write it down"
        subtitle="Type one short learning point now. NightRecall will extract the useful part on the next step."
      />

      <View style={styles.editorCard}>
        <View style={styles.editorHeader}>
          <View style={styles.editorIconWrap}>
            <MaterialIcons name="edit-note" size={22} color={colors.primary} />
          </View>
          <View style={styles.editorCopy}>
            <Text style={styles.editorTitle}>Your note</Text>
            <Text style={styles.editorSubtitle}>Keep it short and specific so tonight&apos;s question stays clear.</Text>
          </View>
        </View>

        <TextInput
          value={sourceText}
          onChangeText={setSourceText}
          style={styles.input}
          multiline
          textAlignVertical="top"
          placeholder="Type or paste one saved idea from today."
          placeholderTextColor="rgba(64,72,72,0.4)"
        />
        <Text style={styles.hint}>Aim for one direct idea, not a full paragraph.</Text>
      </View>

      <PrimaryButton label="Extract key points" onPress={onContinue} disabled={!canContinue} />
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
  editorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    gap: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editorHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  editorIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
  },
  editorCopy: {
    flex: 1,
    gap: 4,
  },
  editorTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  editorSubtitle: {
    color: colors.muted,
    lineHeight: 20,
  },
  input: {
    minHeight: 220,
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    padding: 0,
  },
  hint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
