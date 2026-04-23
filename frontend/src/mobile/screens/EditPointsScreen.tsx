import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";

import { ActionButton } from "../components/ActionButton";
import { PrimaryButton } from "../components/PrimaryButton";
import { QuantitySelector } from "../components/QuantitySelector";
import { ScreenHeader } from "../components/ScreenHeader";
import { ScreenContainer } from "../components/ScreenContainer";
import { TopBar } from "../components/TopBar";
import { useUsageLimits } from "../hooks/useUsageLimits";
import { fetchSavedInputDetail, fetchSavedTopicSource } from "../services/reviewService";
import { createStudyInput, uploadSourceImage } from "../services/studyService";
import { getSourceImageUrl } from "../services/api";
import { useReviewStore } from "../store/reviewStore";
import { useTopicsStore } from "../store/topicsStore";
import { colors } from "../theme/colors";
import { Topic } from "../types/api";
import { RootStackParamList } from "../types/navigation";
import { ReviewDraftPoint } from "../types/reviewDraft";
import { extractKeyPoints } from "../utils/extractKeyPoints";
import { toStudyInputPayload } from "../utils/reviewDraft";

type Props = NativeStackScreenProps<RootStackParamList, "EditPoints">;

const parseRawContent = (inputType: "keywords" | "notes", rawContent: string): string => {
  if (inputType !== "keywords") {
    return rawContent;
  }

  try {
    const parsed = JSON.parse(rawContent);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0).join("\n");
    }
  } catch {
    return rawContent;
  }

  return rawContent;
};

const topicFallbacksFromSource = (sourceText: string): string[] =>
  sourceText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const resolveTopicText = (topic: Topic, index: number, sourceText: string): string => {
  if (typeof topic.text === "string" && topic.text.trim()) {
    return topic.text.trim();
  }

  return topicFallbacksFromSource(sourceText)[index] ?? "Saved point";
};

const toInitialPoints = (texts: string[]): ReviewDraftPoint[] =>
  (texts.length ? texts : [""]).map((point, index) => ({
    id: `${index}`,
    text: point,
    isStarred: false,
  }));

type SaveDestination = "library" | "back";

export function EditPointsScreen({ route, navigation }: Props) {
  const usageLimits = useUsageLimits();
  const currentQuestion = useReviewStore((state) => state.currentQuestion);
  const sessionQuestions = useReviewStore((state) => state.sessionQuestions);
  const setTopics = useTopicsStore((state) => state.setTopics);
  const upsertSavedInput = useTopicsStore((state) => state.upsertSavedInput);
  const [loading, setLoading] = useState(route.params.variant === "saved");
  const [submitting, setSubmitting] = useState(false);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(1);

  const [sourceDraft, setSourceDraft] = useState(
    route.params.variant === "new"
      ? route.params.mode === "photo" && /^(photo capture|captured image|selected image)$/i.test(route.params.sourceText.trim())
        ? ""
        : route.params.sourceText
      : "",
  );
  const [newPoints, setNewPoints] = useState<ReviewDraftPoint[]>(
    route.params.variant === "new"
      ? toInitialPoints(
          route.params.extractedPoints?.length
            ? route.params.extractedPoints
            : route.params.mode === "manual"
              ? extractKeyPoints(route.params.sourceText, "manual")
              : [],
        )
      : toInitialPoints([]),
  );
  const [savedInputType, setSavedInputType] = useState<"keywords" | "notes">("notes");
  const [savedRawContent, setSavedRawContent] = useState("");
  const [savedSourcePreview, setSavedSourcePreview] = useState("");
  const [savedSourceImageRef, setSavedSourceImageRef] = useState<string | null>(null);
  const [savedTopics, setSavedTopics] = useState<Topic[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(
    route.params.variant === "saved" ? route.params.selectedTopicIds ?? [] : [],
  );

  useEffect(() => {
    if (route.params.variant !== "saved") {
      return;
    }

    const savedParams = route.params;
    let cancelled = false;

    const load = async () => {
      try {
        const source = savedParams.studyInputId
          ? await fetchSavedInputDetail(savedParams.studyInputId)
          : await fetchSavedTopicSource(savedParams.topicId ?? "");

        if (cancelled) {
          return;
        }

        const visibleTopics = source.topics.filter((topic) => topic.is_starred);
        setSavedInputType(source.input_type);
        setSavedRawContent(source.raw_content);
        setSavedSourcePreview(source.source_preview_text ?? "");
        setSavedSourceImageRef(source.source_image_ref ?? null);
        setSavedTopics(visibleTopics);
        setSelectedTopicIds((current) => (current.length ? current : visibleTopics.map((topic) => topic.id)));
      } catch (error) {
        const detail =
          axios.isAxiosError(error) && typeof error.response?.data?.detail === "string"
            ? error.response.data.detail
            : "NightRecall could not open this saved learning right now.";
        Alert.alert("Could not open saved learning", detail, [{ text: "OK", onPress: () => navigation.goBack() }]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [navigation, route.params]);

  const remainingQuestionsTonight = usageLimits?.question_generation_daily.remaining ?? 3;
  const remainingPhotoReadsTonight = usageLimits?.photo_extract_daily.remaining ?? 3;
  const tonightIsFull = remainingQuestionsTonight <= 0;
  const usablePointCount = newPoints.filter((point) => point.text.trim()).length;
  const normalizedSourcePreview =
    route.params.variant === "new"
      ? sourceDraft.trim() || newPoints.find((point) => point.text.trim())?.text.trim() || route.params.sourceText.trim() || undefined
      : savedSourcePreview || undefined;
  const normalizedSavedSourceText = useMemo(() => parseRawContent(savedInputType, savedRawContent), [savedInputType, savedRawContent]);

  const updatePoint = (id: string, updates: Partial<ReviewDraftPoint>) => {
    setNewPoints((current) => current.map((point) => (point.id === id ? { ...point, ...updates } : point)));
  };

  const toggleSavedTopic = (id: string) => {
    setSelectedTopicIds((current) => {
      if (current.includes(id)) {
        return current.length > 1 ? current.filter((item) => item !== id) : current;
      }
      return [...current, id];
    });
  };

  const saveToLibrary = async (destination: SaveDestination = "library") => {
    if (route.params.variant !== "new") {
      return;
    }

    try {
      setSubmitting(true);
      const { usablePoints, payload } = toStudyInputPayload(newPoints);
      if (!usablePoints.length) {
        Alert.alert("Nothing to save", "Keep at least one point if you want to save this learning.");
        return;
      }

      const starredIndices = usablePoints.flatMap((point, index) => (point.isStarred ? [index] : []));
      if (!starredIndices.length) {
        Alert.alert("Mark one point first", "Choose at least one saved point before saving to your library.");
        return;
      }

      const sourceImageRef =
        route.params.mode === "photo" && route.params.imageBase64
          ? (await uploadSourceImage({
              image_base64: route.params.imageBase64,
              image_mime_type:
                route.params.imageMimeType && route.params.imageMimeType.startsWith("image/")
                  ? route.params.imageMimeType
                  : "image/jpeg",
            })).source_image_ref
          : undefined;

      const studyInput = await createStudyInput({
        ...payload,
        starred_indices: starredIndices,
        source_kind: route.params.mode === "photo" ? "photo" : "manual",
        source_preview_text: normalizedSourcePreview,
        source_image_ref: sourceImageRef,
      });
      setTopics(studyInput.topics);
      upsertSavedInput({
        study_input_id: studyInput.study_input_id,
        input_type: payload.input_type,
        source_kind: studyInput.source_kind ?? (route.params.mode === "photo" ? "photo" : "manual"),
        source_preview_text: studyInput.source_preview_text ?? normalizedSourcePreview ?? null,
        source_image_ref: studyInput.source_image_ref ?? sourceImageRef ?? null,
        title: studyInput.source_preview_text ?? normalizedSourcePreview ?? usablePoints[0].text.trim(),
        preview:
          usablePoints.find((point) => point.text.trim() !== (studyInput.source_preview_text ?? normalizedSourcePreview ?? "").trim())?.text.trim() ?? "",
        bookmarked_count: starredIndices.length,
        topic_id: studyInput.topics.find((topic) => topic.is_starred)?.id ?? studyInput.topics[0]?.id ?? "",
      });
      if (destination === "library") {
        navigation.navigate("Library");
      } else {
        navigation.goBack();
      }
    } catch {
      Alert.alert("Could not save", "NightRecall could not save this learning to your library.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotNow = () => {
    if (route.params.variant !== "new") {
      navigation.goBack();
      return;
    }

    const { usablePoints } = toStudyInputPayload(newPoints);
    const bookmarkedCount = usablePoints.filter((point) => point.isStarred).length;

    if (!bookmarkedCount) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      "Save bookmarked points for later?",
      "Your photo read is already counted. Save the bookmarked points now, or close without saving.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Close without saving", style: "destructive", onPress: () => navigation.goBack() },
        { text: "Save and close", onPress: () => void saveToLibrary("back") },
      ],
    );
  };

  const generateQuestions = () => {
    if (tonightIsFull) {
      Alert.alert("Tonight is full", "You already made 3 questions tonight. You can keep reviewing what's ready.");
      return;
    }

    if (route.params.variant === "new") {
      const { usablePoints } = toStudyInputPayload(newPoints);
      if (!usablePoints.length) {
        Alert.alert("Nothing to use", "Keep at least one point so AI can make a question.");
        return;
      }

      navigation.navigate("QuestionGenerating", {
        variant: "new",
        mode: route.params.mode,
        sourceText: sourceDraft,
        points: newPoints,
        selectedQuestionCount: Math.min(selectedQuestionCount, remainingQuestionsTonight),
        imageBase64: route.params.imageBase64,
        imageMimeType: route.params.imageMimeType,
      });
      return;
    }

    if (!selectedTopicIds.length) {
      Alert.alert("Choose something first", "Pick at least one saved point before making questions.");
      return;
    }

    navigation.navigate("QuestionGenerating", {
      variant: "saved",
      studyInputId: route.params.studyInputId,
      topicId: route.params.topicId,
      selectedTopicIds,
      selectedQuestionCount: Math.min(selectedQuestionCount, remainingQuestionsTonight),
    });
  };

  return (
    <ScreenContainer>
      <TopBar leftIcon="arrow-back" onLeftPress={() => navigation.goBack()} title="Edit Points" />

      <ScreenHeader
        title="Shape tonight's question"
        subtitle={
          route.params.variant === "new"
            ? "Check the source, adjust the points, then generate a clean recall."
            : "Review the saved source, choose the saved points you want, then generate tonight's recall."
        }
      />

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Opening saved learning...</Text>
        </View>
      ) : (
        <>
          <View style={styles.sourceCard}>
            <Text style={styles.sourceLabel}>Source preview</Text>
            {route.params.variant === "new" && route.params.imageUri ? (
              <Image source={{ uri: route.params.imageUri }} style={styles.sourceImage} />
            ) : null}
            {route.params.variant === "saved" && savedSourceImageRef ? (
              <Image source={{ uri: getSourceImageUrl(savedSourceImageRef) }} style={styles.sourceImage} />
            ) : null}
            {route.params.variant === "new" ? (
              <TextInput
                value={sourceDraft}
                onChangeText={setSourceDraft}
                style={styles.sourceInput}
                multiline
                placeholder={route.params.mode === "photo" ? "Add one short note if the photo needs context." : ""}
                placeholderTextColor={colors.mutedSoft}
              />
            ) : (
              <View style={styles.savedSourceCopy}>
                {savedSourcePreview ? <Text style={styles.savedSourcePreview}>{savedSourcePreview}</Text> : null}
                <Text style={styles.savedSourceText}>{normalizedSavedSourceText || "No saved source text."}</Text>
              </View>
            )}
          </View>

          {route.params.variant === "new" ? (
            newPoints.map((point, index) => (
              <View key={point.id} style={index === 0 ? styles.featureCard : styles.secondaryCard}>
                <View style={styles.pointHeader}>
                  <Text style={styles.pointLabel}>{index === 0 ? "Main point" : `Point ${index + 1}`}</Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.bookmarkButton,
                      point.isStarred && styles.bookmarkButtonActive,
                      pressed && styles.smallActionPressed,
                    ]}
                    onPress={() => updatePoint(point.id, { isStarred: !point.isStarred })}
                  >
                    <MaterialIcons
                      name={point.isStarred ? "bookmark" : "bookmark-border"}
                      size={22}
                      color={point.isStarred ? "#FFFFFF" : colors.mutedSoft}
                    />
                  </Pressable>
                </View>

                <TextInput
                  value={point.text}
                  onChangeText={(text) => updatePoint(point.id, { text })}
                  style={styles.pointInput}
                  multiline
                />
              </View>
            ))
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Saved points</Text>
              <Text style={styles.sectionHelper}>Choose the saved points AI should use for tonight's question.</Text>
              <ScrollView contentContainerStyle={styles.topicList} showsVerticalScrollIndicator={false}>
                {savedTopics.map((topic, index) => {
                  const selected = selectedTopicIds.includes(topic.id);
                  return (
                    <Pressable
                      key={topic.id}
                      style={({ pressed }) => [
                        styles.topicCard,
                        selected && styles.topicCardSelected,
                        pressed && styles.smallActionPressed,
                      ]}
                      onPress={() => toggleSavedTopic(topic.id)}
                    >
                      <View style={styles.pointHeader}>
                        <Text style={styles.pointLabel}>{index === 0 ? "Main point" : `Point ${index + 1}`}</Text>
                        <View style={[styles.checkButton, selected && styles.checkButtonSelected]}>
                          <MaterialIcons name={selected ? "check" : "add"} size={18} color={selected ? "#FFFFFF" : colors.primary} />
                        </View>
                      </View>
                      <Text style={styles.topicText}>{resolveTopicText(topic, index, normalizedSavedSourceText)}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Question count</Text>
            <Text style={styles.summaryBody}>Start with 1 question. You can make up to 3 if you want.</Text>
            <Text style={styles.summaryCapacity}>{`${remainingQuestionsTonight} questions left tonight.`}</Text>
            <Text style={styles.summaryHelper}>{`${remainingPhotoReadsTonight} photo reads left tonight.`}</Text>
            <QuantitySelector
              values={[1, 2, 3]}
              selectedValue={selectedQuestionCount}
              maxEnabledValue={remainingQuestionsTonight}
              disabled={tonightIsFull}
              onChange={setSelectedQuestionCount}
            />
          </View>

          <PrimaryButton
            label={tonightIsFull ? "Tonight is full" : `Generate ${selectedQuestionCount} question${selectedQuestionCount > 1 ? "s" : ""}`}
            onPress={generateQuestions}
            disabled={tonightIsFull || (route.params.variant === "new" ? !usablePointCount : !selectedTopicIds.length) || submitting}
          />

          {route.params.variant === "new" ? (
            <ActionButton label="Save to library" onPress={() => void saveToLibrary()} disabled={submitting} variant="secondary" iconName="bookmark" />
          ) : null}
          <ActionButton label="Not now" onPress={handleNotNow} variant="tertiary" />
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingCard: {
    backgroundColor: colors.surfaceLow,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  sourceCard: {
    backgroundColor: "rgba(255,253,248,0.94)",
    borderRadius: 26,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(15,76,63,0.08)",
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
  savedSourceCopy: {
    gap: 8,
  },
  savedSourcePreview: {
    color: colors.primary,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  savedSourceText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
  },
  featureCard: {
    backgroundColor: "rgba(255,253,248,0.96)",
    borderRadius: 28,
    padding: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
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
    gap: 12,
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
  section: {
    gap: 12,
    minHeight: 0,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  sectionHelper: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  topicList: {
    gap: 12,
    paddingBottom: 4,
  },
  topicCard: {
    backgroundColor: colors.surfaceLow,
    borderRadius: 18,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(192,200,199,0.18)",
  },
  topicCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#F8FCFB",
  },
  topicText: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "700",
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  summaryCard: {
    backgroundColor: "rgba(255,253,248,0.92)",
    borderRadius: 26,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(15,76,63,0.08)",
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
