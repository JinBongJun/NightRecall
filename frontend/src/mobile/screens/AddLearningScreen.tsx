import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import axios from "axios";

import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { TopicChip } from "../components/TopicChip";
import { useUsageLimits } from "../hooks/useUsageLimits";
import { createStudyInput, startQuestionGenerationJob, waitForQuestionGenerationJob } from "../services/studyService";
import { useAuthStore } from "../store/authStore";
import { useReviewStore } from "../store/reviewStore";
import { useTopicsStore } from "../store/topicsStore";
import { colors } from "../theme/colors";
import type { StudyInputType } from "../types/domain";
import { RootStackParamList } from "../types/navigation";
import { asUsageLimitReason } from "../utils/usageLimits";

type Props = NativeStackScreenProps<RootStackParamList, "Capture">;

type Tab = StudyInputType;

export function AddLearningScreen({ navigation }: Props) {
  const userId = useAuthStore((state) => state.userId);
  const usageLimits = useUsageLimits();
  const setTopics = useTopicsStore((state) => state.setTopics);
  const setTonightQuestion = useReviewStore((state) => state.setTonightQuestion);
  const setSessionQuestions = useReviewStore((state) => state.setSessionQuestions);
  const [tab, setTab] = useState<Tab>("keywords");
  const [keywords, setKeywords] = useState("photosynthesis, chlorophyll, ATP");
  const [note, setNote] = useState("");
  const [starred, setStarred] = useState<number[]>([0]);

  const keywordItems = keywords.split(",").map((item) => item.trim()).filter(Boolean);
  const remainingQuestionsTonight = usageLimits?.question_generation_daily.remaining ?? 3;
  const generationLocked = remainingQuestionsTonight <= 0;

  const toggleStar = (index: number) => {
    setStarred((current) => (current.includes(index) ? current.filter((item) => item !== index) : [...current, index]));
  };

  const submit = async (count: number) => {
    if (!userId) return;
    if (generationLocked) {
      Alert.alert("Tonight is full", "You already made 3 questions tonight. Review what's ready or come back tomorrow.");
      return;
    }
    try {
      const payload =
        tab === "keywords"
          ? { input_type: "keywords" as const, content: keywordItems, starred_indices: starred }
          : { input_type: "notes" as const, content: note, starred_indices: [] };
      const studyInput = await createStudyInput(payload);
      setTopics(studyInput.topics);
      const job = await startQuestionGenerationJob({
        study_input_id: studyInput.study_input_id,
        count: Math.min(count, remainingQuestionsTonight),
      });
      const completed = await waitForQuestionGenerationJob(job.job_id);
      if (!completed.questions?.length) {
        throw new Error("question_generation_job_returned_no_questions");
      }
      if (count > 1) {
        setSessionQuestions(completed.questions);
      } else {
        setTonightQuestion(completed.questions[0]);
      }
      navigation.navigate("Review", { mode: "auto" });
    } catch (error) {
      if (error instanceof Error && error.message === "question_generation_cancelled") {
        return;
      }
      const detail =
        axios.isAxiosError(error) && typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : error instanceof Error
            ? error.message
            : "Could not save learning";
      const usageLimitReason = asUsageLimitReason(detail);
      if (usageLimitReason === "question_generation_daily" || usageLimitReason === "question_generation_monthly") {
        navigation.navigate("UsageLimit", { reason: usageLimitReason });
        return;
      }
      Alert.alert("Could not save learning", "Check the input shape, then try again.");
    }
  };

  return (
    <ScreenContainer>
      <SectionHeader title="Add today's learning" subtitle="Keep it short. Mark the parts you really do not want to forget." />

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === "keywords" && styles.tabActive]} onPress={() => setTab("keywords")}>
          <Text style={[styles.tabText, tab === "keywords" && styles.tabTextActive]}>Keywords</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === "notes" && styles.tabActive]} onPress={() => setTab("notes")}>
          <Text style={[styles.tabText, tab === "notes" && styles.tabTextActive]}>Notes</Text>
        </Pressable>
      </View>

      {tab === "keywords" ? (
        <View style={styles.card}>
          <TextInput
            value={keywords}
            onChangeText={setKeywords}
            placeholder="Separate 3 to 10 keywords with commas"
            style={styles.input}
            multiline
          />
          <Text style={styles.caption}>Tap chips to mark "Must Remember"</Text>
          <View style={styles.chips}>
            {keywordItems.map((item, index) => (
              <TopicChip key={`${item}-${index}`} label={item} selected={starred.includes(index)} onPress={() => toggleStar(index)} />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Write 30 to 500 characters about what you learned."
            style={[styles.input, styles.noteInput]}
            multiline
          />
        </View>
      )}

      <PrimaryButton label={generationLocked ? "Tonight is full" : "Generate 1 Question"} onPress={() => submit(1)} disabled={generationLocked} />
      <PrimaryButton
        label={generationLocked ? "Tonight is full" : "Generate up to 3 Questions"}
        onPress={() => submit(3)}
        disabled={generationLocked}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    backgroundColor: "#EFE6D8",
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: colors.surface,
  },
  tabText: {
    color: colors.muted,
    fontWeight: "700",
  },
  tabTextActive: {
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: "top",
  },
  noteInput: {
    minHeight: 180,
  },
  caption: {
    color: colors.muted,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
});
