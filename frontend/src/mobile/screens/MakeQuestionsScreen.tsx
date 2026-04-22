import { useMemo, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";

import { ActionButton } from "../components/ActionButton";
import { TopBar } from "../components/TopBar";
import { PrimaryButton } from "../components/PrimaryButton";
import { QuantitySelector } from "../components/QuantitySelector";
import { ScreenHeader } from "../components/ScreenHeader";
import { ScreenContainer } from "../components/ScreenContainer";
import { createStudyInput } from "../services/studyService";
import { useReviewStore } from "../store/reviewStore";
import { useTopicsStore } from "../store/topicsStore";
import { colors } from "../theme/colors";
import { RootStackParamList } from "../types/navigation";
import { ReviewDraftPoint } from "../types/reviewDraft";
import { extractKeyPoints } from "../utils/extractKeyPoints";
import { toStudyInputPayload } from "../utils/reviewDraft";

type Props = NativeStackScreenProps<RootStackParamList, "MakeQuestions">;

export function MakeQuestionsScreen({ route, navigation }: Props) {
  const { mode, sourceText, extractedPoints, imageUri, imageBase64, imageMimeType } = route.params;
  const normalizedInitialSource =
    mode === "photo" && /^(photo capture|captured image|selected image)$/i.test(sourceText.trim()) ? "" : sourceText;

  const initialPoints = useMemo<ReviewDraftPoint[]>(
    () =>
      (() => {
        const seededPoints =
          extractedPoints && extractedPoints.length
            ? extractedPoints
            : mode === "photo"
              ? []
              : extractKeyPoints(sourceText, "manual");

        if (!seededPoints.length) {
          return [
            {
              id: "0",
              text: "",
              isStarred: false,
            },
          ];
        }

        return seededPoints.map((point, index) => ({
          id: `${index}`,
          text: point,
          isStarred: false,
        }));
      })(),
    [extractedPoints, mode, sourceText],
  );

  const [sourceDraft, setSourceDraft] = useState(normalizedInitialSource);
  const [points, setPoints] = useState<ReviewDraftPoint[]>(initialPoints);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const normalizedSourcePreview = sourceDraft.trim() || points.find((point) => point.text.trim())?.text.trim() || sourceText.trim() || undefined;
  const sourceImageData =
    mode === "photo" && imageBase64
      ? `data:${imageMimeType && imageMimeType.startsWith("image/") ? imageMimeType : "image/jpeg"};base64,${imageBase64}`
      : undefined;

  const setTopics = useTopicsStore((state) => state.setTopics);
  const upsertSavedInput = useTopicsStore((state) => state.upsertSavedInput);
  const currentQuestion = useReviewStore((state) => state.currentQuestion);
  const sessionQuestions = useReviewStore((state) => state.sessionQuestions);
  const nightlyGenerationSessionCount = useReviewStore((state) =>
    state.nightlyGenerationSessionDate === new Intl.DateTimeFormat("sv-SE").format(new Date())
      ? state.nightlyGenerationSessionCount
      : 0,
  );

  const activeQuestionCount = sessionQuestions.length ? sessionQuestions.length : currentQuestion ? 1 : 0;
  const remainingTonightCapacity = Math.max(0, 3 - nightlyGenerationSessionCount);
  const tonightIsFull = remainingTonightCapacity <= 0;

  const updatePoint = (id: string, updates: Partial<ReviewDraftPoint>) => {
    setPoints((current) => current.map((point) => (point.id === id ? { ...point, ...updates } : point)));
  };

  const usablePointCount = points.filter((point) => point.text.trim()).length;
  const exactCapacityCopy = tonightIsFull
    ? "0 of 3 sets left tonight."
    : activeQuestionCount > 0
      ? `${remainingTonightCapacity} of 3 sets left tonight.`
      : "3 of 3 sets left tonight.";

  const toggleImportant = (id: string) => {
    const nextPoint = points.find((point) => point.id === id);
    if (!nextPoint) {
      return;
    }

    const nextImportant = !nextPoint.isStarred;
    updatePoint(id, { isStarred: nextImportant });
    Alert.alert(
      nextImportant ? "Saved as important" : "Removed from important",
      nextImportant
        ? "Saved as important for your library."
        : "This point is no longer marked as important.",
    );
  };

  const makeQuestions = async () => {
    if (tonightIsFull) {
      Alert.alert("Tonight is full", "You already made 3 question sets for tonight. You can keep reviewing what's ready.");
      return;
    }

    const { usablePoints } = toStudyInputPayload(points);
    if (!usablePoints.length) {
      Alert.alert("Nothing to use", "Keep at least one point so AI can make a question.");
      return;
    }

    navigation.navigate("QuestionGenerating", {
      variant: "new",
      mode,
      sourceText: sourceDraft,
      points,
      selectedQuestionCount: Math.min(selectedQuestionCount, remainingTonightCapacity),
      imageBase64,
      imageMimeType,
    });
  };

  const saveToLibrary = async () => {
    try {
      setSubmitting(true);
      const { usablePoints, payload } = toStudyInputPayload(points);
      if (!usablePoints.length) {
        Alert.alert("Nothing to save", "Keep at least one point if you want to save this learning.");
        return;
      }
      const starredIndices = usablePoints.flatMap((point, index) => (point.isStarred ? [index] : []));
      if (!starredIndices.length) {
        Alert.alert("Mark one point first", "Choose at least one important point before saving to your library.");
        return;
      }

      const studyInput = await createStudyInput({
        ...payload,
        starred_indices: starredIndices,
        source_kind: mode === "photo" ? "photo" : "manual",
        source_preview_text: normalizedSourcePreview,
        source_image_data: sourceImageData,
      });
      setTopics(studyInput.topics);
      const bookmarkedCount = starredIndices.length;
      if (bookmarkedCount > 0) {
        upsertSavedInput({
          study_input_id: studyInput.study_input_id,
          input_type: payload.input_type,
          source_kind: studyInput.source_kind ?? (mode === "photo" ? "photo" : "manual"),
          source_preview_text: studyInput.source_preview_text ?? normalizedSourcePreview ?? null,
          source_image_data: studyInput.source_image_data ?? sourceImageData ?? null,
          title: studyInput.source_preview_text ?? normalizedSourcePreview ?? usablePoints[0].text.trim(),
          preview: usablePoints.find((point) => point.text.trim() !== (studyInput.source_preview_text ?? normalizedSourcePreview ?? "").trim())?.text.trim() ?? "",
          bookmarked_count: bookmarkedCount,
          topic_id: studyInput.topics.find((topic) => topic.is_starred)?.id ?? studyInput.topics[0]?.id ?? "",
        });
      }
      navigation.navigate("Library");
    } catch {
      Alert.alert("Could not save", "NightRecall could not save this learning to your library.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <TopBar 
        leftIcon="arrow-back" 
        onLeftPress={() => navigation.goBack()} 
      />

      <ScreenHeader
        title="Make questions"
        subtitle="Check the points fast, then let AI make tonight's question."
      />

      <View style={styles.sourceCard}>
        <Text style={styles.sourceLabel}>{mode === "photo" ? "Your photo" : "Your note"}</Text>
        {mode === "photo" && imageUri ? <Image source={{ uri: imageUri }} style={styles.sourceImage} /> : null}
        <TextInput
          value={sourceDraft}
          onChangeText={setSourceDraft}
          style={styles.sourceInput}
          multiline
          placeholder={mode === "photo" ? "If AI missed the point, add one short note here." : ""}
          placeholderTextColor={colors.mutedSoft}
        />
      </View>

      {points.map((point, index) => (
        <View key={point.id} style={index === 0 ? styles.featureCard : styles.secondaryCard}>
          <View style={styles.pointHeader}>
            <Text style={styles.pointLabel}>{index === 0 ? "Main point" : `Point ${index + 1}`}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.bookmarkButton,
                point.isStarred && styles.bookmarkButtonActive,
                pressed && styles.smallActionPressed,
              ]}
              onPress={() => toggleImportant(point.id)}
            >
              <MaterialIcons
                name={point.isStarred ? "bookmark" : "bookmark-border"}
                size={22}
                color={point.isStarred ? "#FFFFFF" : colors.mutedSoft}
              />
            </Pressable>
          </View>

          <TextInput value={point.text} onChangeText={(text) => updatePoint(point.id, { text })} style={styles.pointInput} multiline />
        </View>
      ))}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Want more tonight?</Text>
        <Text style={styles.summaryBody}>Start with 1 question. You can make up to 3 if you want.</Text>
        <Text style={styles.summaryCapacity}>{exactCapacityCopy}</Text>
        {activeQuestionCount > 0 ? (
          <Text style={styles.summaryHelper}>
            {activeQuestionCount} question{activeQuestionCount > 1 ? "s are" : " is"} already ready.
          </Text>
        ) : null}

        <QuantitySelector
          values={[1, 2, 3]}
          selectedValue={selectedQuestionCount}
          maxEnabledValue={remainingTonightCapacity}
          disabled={tonightIsFull}
          onChange={setSelectedQuestionCount}
        />
      </View>

      <PrimaryButton
        label={
          tonightIsFull
            ? "Tonight is full"
            : `Make ${selectedQuestionCount} question${selectedQuestionCount > 1 ? "s" : ""}`
        }
        onPress={() => void makeQuestions()}
        disabled={tonightIsFull || !usablePointCount || submitting}
      />

      <ActionButton label="Save to library" onPress={() => void saveToLibrary()} disabled={submitting} variant="secondary" iconName="bookmark" />

      <ActionButton label="Not now" onPress={() => navigation.goBack()} variant="tertiary" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({

  sourceCard: {
    backgroundColor: "rgba(255,253,248,0.94)",
    borderRadius: 26,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(15,76,63,0.08)",
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  sourceLabel: {
    color: colors.mutedSoft,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  sourceImage: {
    width: "100%",
    height: 208,
    borderRadius: 20,
    backgroundColor: colors.surfaceHigh,
  },
  sourceInput: {
    minHeight: 56,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    padding: 0,
  },
  featureCard: {
    backgroundColor: "rgba(255,253,248,0.96)",
    borderRadius: 28,
    padding: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  secondaryCard: {
    backgroundColor: "rgba(255,253,248,0.88)",
    borderRadius: 22,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(15,76,63,0.08)",
  },
  pointHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointLabel: {
    color: colors.mutedSoft,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  bookmarkButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(213,230,220,0.5)",
    borderWidth: 1,
    borderColor: "rgba(18,67,67,0.08)",
  },
  bookmarkButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pointInput: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 30,
    fontWeight: "700",
    padding: 0,
    minHeight: 60,
  },
  summaryCard: {
    backgroundColor: "rgba(255,253,248,0.92)",
    borderRadius: 26,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(15,76,63,0.08)",
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  summaryLabel: {
    color: colors.primary,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
  },
  summaryBody: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  summaryCapacity: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  summaryHelper: {
    color: colors.mutedSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  smallActionPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
