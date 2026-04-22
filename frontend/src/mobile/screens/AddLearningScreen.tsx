import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { TopicChip } from "../components/TopicChip";
import { createStudyInput, generateQuestions } from "../services/studyService";
import { useAuthStore } from "../store/authStore";
import { useReviewStore } from "../store/reviewStore";
import { useTopicsStore } from "../store/topicsStore";
import { colors } from "../theme/colors";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Capture">;

type Tab = "keywords" | "notes";

export function AddLearningScreen({ navigation }: Props) {
  const userId = useAuthStore((state) => state.userId);
  const setTopics = useTopicsStore((state) => state.setTopics);
  const setTonightQuestion = useReviewStore((state) => state.setTonightQuestion);
  const setSessionQuestions = useReviewStore((state) => state.setSessionQuestions);
  const recordNightlyGenerationSession = useReviewStore((state) => state.recordNightlyGenerationSession);
  const [tab, setTab] = useState<Tab>("keywords");
  const [keywords, setKeywords] = useState("photosynthesis, chlorophyll, ATP");
  const [note, setNote] = useState("");
  const [starred, setStarred] = useState<number[]>([0]);

  const keywordItems = keywords.split(",").map((item) => item.trim()).filter(Boolean);

  const toggleStar = (index: number) => {
    setStarred((current) => (current.includes(index) ? current.filter((item) => item !== index) : [...current, index]));
  };

  const submit = async (count: number) => {
    if (!userId) return;
    try {
      const payload =
        tab === "keywords"
          ? { input_type: "keywords" as const, content: keywordItems, starred_indices: starred }
          : { input_type: "notes" as const, content: note, starred_indices: [] };
      const studyInput = await createStudyInput(payload);
      setTopics(studyInput.topics);
      const generated = await generateQuestions({ study_input_id: studyInput.study_input_id, count }) as {
        questions?: Array<{
          id: string;
          question_type: "mcq" | "true_false" | "fill_blank";
          question_text: string;
          choices: string[] | null;
          answer_index: number | null;
          answer_text: string | null;
          explanation: string;
        }>;
      };
      if (generated.questions?.length) {
        recordNightlyGenerationSession();
        if (count > 1) {
          setSessionQuestions(generated.questions);
        } else {
          setTonightQuestion(generated.questions[0]);
        }
      }
      navigation.navigate("Review", { mode: "auto" });
    } catch {
      Alert.alert("Could not save learning", "Check the input shape and try again.");
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

      <PrimaryButton label="Generate 1 Question" onPress={() => submit(1)} />
      <PrimaryButton label="Generate 3 Questions" onPress={() => submit(3)} />
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
