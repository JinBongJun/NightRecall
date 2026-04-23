import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";

import { BrandWordmark } from "../components/BrandWordmark";
import { HeroCard } from "../components/HeroCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenHeader } from "../components/ScreenHeader";
import { ScreenContainer } from "../components/ScreenContainer";
import { useUsageLimits } from "../hooks/useUsageLimits";
import {
  fetchSavedInputDetail,
  fetchSavedTopicSource,
} from "../services/reviewService";
import { useReviewStore } from "../store/reviewStore";
import { colors } from "../theme/colors";
import { Topic } from "../types/api";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "SavedCardDetail">;

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

export function SavedCardDetailScreen({ route, navigation }: Props) {
  const { studyInputId, topicId } = route.params;
  const usageLimits = useUsageLimits();

  const [loading, setLoading] = useState(true);
  const [inputType, setInputType] = useState<"keywords" | "notes">("notes");
  const [rawContent, setRawContent] = useState("");
  const [sourcePreviewText, setSourcePreviewText] = useState("");
  const [sourceImageData, setSourceImageData] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (studyInputId) {
          try {
            const source = await fetchSavedInputDetail(studyInputId);
            if (cancelled) {
              return;
            }
            setInputType(source.input_type);
            setRawContent(source.raw_content);
            setSourcePreviewText(source.source_preview_text ?? "");
        setSourceImageData(source.source_image_data ?? null);
        const visibleTopics = source.topics.filter((topic) => topic.is_starred);
        setTopics(visibleTopics);
        return;
          } catch (error) {
            if (!topicId) {
              throw error;
            }
          }
        }

        if (!topicId) {
          throw new Error("Missing saved learning id");
        }

        const source = await fetchSavedTopicSource(topicId);
        if (cancelled) {
          return;
        }
        setInputType(source.input_type);
        setRawContent(source.raw_content);
        setSourcePreviewText(source.source_preview_text ?? "");
        setSourceImageData(source.source_image_data ?? null);
        const visibleTopics = source.topics.filter((topic) => topic.is_starred);
        setTopics(visibleTopics);
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
  }, [navigation, studyInputId, topicId]);

  const remainingQuestionsTonight = usageLimits?.question_generation_daily.remaining ?? 3;
  const normalizedSourceText = useMemo(() => parseRawContent(inputType, rawContent), [inputType, rawContent]);
  const remainingPhotoReadsTonight = usageLimits?.photo_extract_daily.remaining ?? 3;

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
        title="Review saved learning"
        subtitle="Open the saved source, review the saved parts, then make a question from them."
      />

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Opening saved learning...</Text>
        </View>
      ) : (
        <>
          <HeroCard
            overline="Saved source"
            title="Choose what should turn into tonight's question"
            iconName="auto-stories"
            titleMaxWidth={220}
            meta={
              `${remainingQuestionsTonight} questions left tonight, ${remainingPhotoReadsTonight} photo reads left tonight.`
            }
          >
            <View style={styles.summaryRow}>
              <View style={styles.summaryPill}>
                <Text style={styles.summaryValue}>{topics.length}</Text>
                <Text style={styles.summaryLabel}>Bookmarked</Text>
              </View>
              <View style={styles.summaryPill}>
                <Text style={styles.summaryValue}>{remainingQuestionsTonight}</Text>
                <Text style={styles.summaryLabel}>Questions left</Text>
              </View>
              <View style={styles.summaryPill}>
                <Text style={styles.summaryValue}>{remainingPhotoReadsTonight}</Text>
                <Text style={styles.summaryLabel}>Photo reads left</Text>
              </View>
            </View>
          </HeroCard>

          <View style={styles.sourceCard}>
            <Text style={styles.sourceLabel}>{sourceImageData ? "Saved photo" : inputType === "keywords" ? "Saved keywords" : "Saved note"}</Text>
            {sourceImageData ? <Image source={{ uri: sourceImageData }} style={styles.sourceImage} /> : null}
            {sourcePreviewText ? <Text style={styles.sourcePreview}>{sourcePreviewText}</Text> : null}
            <Text style={styles.sourceText}>{normalizedSourceText || "No saved source text."}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Bookmarked points</Text>
            <Text style={styles.sectionHelper}>These are the saved points from this card.</Text>
            <ScrollView contentContainerStyle={styles.topicList} showsVerticalScrollIndicator={false}>
              {topics.map((topic, index) => {
                return (
                  <View key={topic.id} style={styles.pointCard}>
                    <View style={styles.pointHeader}>
                      <Text style={styles.pointLabel}>{index === 0 ? "Main point" : `Point ${index + 1}`}</Text>
                      <View style={styles.pointActions}>
                        <View style={styles.savedBadge}>
                          <MaterialIcons name="bookmark" size={14} color={colors.primary} />
                          <Text style={styles.savedBadgeText}>Saved</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.pointText}>{resolveTopicText(topic, index, normalizedSourceText)}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          <PrimaryButton
            label="Make question"
            onPress={() =>
              navigation.navigate("EditPoints", {
                variant: "saved",
                studyInputId,
                topicId,
                selectedTopicIds: topics.map((topic) => topic.id),
              })
            }
            disabled={!topics.length}
          />
        </>
      )}
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
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryPill: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 4,
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sourceCard: {
    backgroundColor: colors.surfaceLow,
    borderRadius: 24,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(192,200,199,0.18)",
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
    height: 220,
    borderRadius: 20,
    backgroundColor: colors.surfaceHigh,
  },
  sourcePreview: {
    color: colors.primary,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  sourceText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
  },
  section: {
    gap: 12,
    flex: 1,
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
  pointCard: {
    backgroundColor: colors.surfaceLow,
    borderRadius: 18,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(192,200,199,0.18)",
  },
  pointCardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
  pointHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  pointActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pointLabel: {
    color: colors.mutedSoft,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(188,235,235,0.35)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  savedBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  pointText: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "700",
  },
});
