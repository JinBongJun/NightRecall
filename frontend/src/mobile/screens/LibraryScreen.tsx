import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  Alert,
  findNodeHandle,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import type { ScrollView } from "react-native";
import axios from "axios";

import { BottomDock } from "../components/BottomDock";
import { SectionRow } from "../components/SectionRow";
import { TopBar } from "../components/TopBar";
import { EmptyState } from "../components/EmptyState";
import { SavedLearningCard } from "../components/SavedLearningCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { ScreenContainer } from "../components/ScreenContainer";
import { SearchField } from "../components/SearchField";
import { deleteSavedInput, deleteTopic, fetchSavedInputs } from "../services/reviewService";
import { getSourceImageHeaders, getSourceImageUrl } from "../services/api";
import { useTopicsStore } from "../store/topicsStore";
import { colors } from "../theme/colors";
import { theme } from "../theme";
import { SavedStudyInputSummary, Topic } from "../types/models";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Library">;

const PAGE_SIZE = 20;

const resolveTopicText = (topic: Topic) =>
  (typeof topic.text === "string" && topic.text.trim()) ||
  (typeof topic.topic_text === "string" && topic.topic_text.trim()) ||
  "";

export function LibraryScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [savedInputs, setSavedInputs] = useState<SavedStudyInputSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingStudyInputId, setDeletingStudyInputId] = useState<string | null>(null);
  const [usingLegacyFallback, setUsingLegacyFallback] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList<SavedStudyInputSummary>>(null);
  const searchInputRef = useRef<TextInput | null>(null);
  const savedInputsCacheRef = useRef<SavedStudyInputSummary[]>([]);
  const starredTopicsRef = useRef<Topic[]>([]);
  const starredTopics = useTopicsStore((state) => state.starredTopics);
  const savedInputsCache = useTopicsStore((state) => state.savedInputsCache);
  const removeTopic = useTopicsStore((state) => state.removeTopic);
  const removeSavedInput = useTopicsStore((state) => state.removeSavedInput);
  const setSavedInputsCache = useTopicsStore((state) => state.setSavedInputsCache);
  const trimmedQuery = searchQuery.trim().toLowerCase();

  const scrollInputIntoView = useCallback(() => {
    const inputHandle = findNodeHandle(searchInputRef.current);
    const scrollResponder = flatListRef.current?.getScrollResponder?.() as ScrollView | undefined;
    if (typeof inputHandle === "number" && scrollResponder?.scrollResponderScrollNativeHandleToKeyboard) {
      scrollResponder.scrollResponderScrollNativeHandleToKeyboard(inputHandle, 132, true);
    }
  }, []);

  const buildLegacyItems = (topics: Topic[]): SavedStudyInputSummary[] =>
    topics.map((topic) => ({
      study_input_id: "",
      input_type: "keywords",
      source_kind: null,
      source_preview_text: null,
      title: resolveTopicText(topic) || "Saved learning",
      preview: "Open to review the saved points from this learning.",
      bookmarked_count: 1,
      topic_id: topic.id,
    }));

  const hydrateImmediateItems = () => {
    if (savedInputsCacheRef.current.length) {
      setSavedInputs(savedInputsCacheRef.current);
      setUsingLegacyFallback(false);
      return true;
    }
    if (starredTopicsRef.current.length) {
      setSavedInputs(buildLegacyItems(starredTopicsRef.current));
      setUsingLegacyFallback(true);
      return true;
    }
    setSavedInputs([]);
    setUsingLegacyFallback(false);
    return false;
  };

  useEffect(() => {
    savedInputsCacheRef.current = savedInputsCache;
  }, [savedInputsCache]);

  useEffect(() => {
    starredTopicsRef.current = starredTopics;
  }, [starredTopics]);

  const loadSavedInputs = useCallback(() => {
    let cancelled = false;

    const load = async () => {
      const hasImmediateItems = hydrateImmediateItems();
      setLoading(!hasImmediateItems);
      setSyncing(hasImmediateItems);

      try {
        const response = await fetchSavedInputs({ page: 1, limit: PAGE_SIZE });
        if (!cancelled) {
          setSavedInputs(response.items);
          setPage(response.page);
          setHasMore(response.has_more);
          setTotalCount(response.total_count);
          setSavedInputsCache(response.items);
          setUsingLegacyFallback(false);
        }
      } catch {
        if (!cancelled) {
          hydrateImmediateItems();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSyncing(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [setSavedInputsCache]);

  useFocusEffect(loadSavedInputs);

  const loadMore = async () => {
    if (loadingMore || !hasMore) {
      return;
    }

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const response = await fetchSavedInputs({ page: nextPage, limit: PAGE_SIZE });
      const merged = [...savedInputs, ...response.items];
      setSavedInputs(merged);
      setPage(response.page);
      setHasMore(response.has_more);
      setTotalCount(response.total_count);
      setSavedInputsCache(merged);
    } catch (error) {
      const detail =
        axios.isAxiosError(error) && typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : "NightRecall could not load more saved learning right now.";
      Alert.alert("Could not load more", detail);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
      requestAnimationFrame(scrollInputIntoView);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [scrollInputIntoView]);

  const filteredInputs = useMemo(
    () =>
      savedInputs.filter((item) => {
        if (!trimmedQuery) {
          return true;
        }
        return `${item.title} ${item.preview}`.toLowerCase().includes(trimmedQuery);
      }),
    [savedInputs, trimmedQuery],
  );

  const confirmDelete = (item: SavedStudyInputSummary) => {
    Alert.alert("Delete this saved learning?", `NightRecall will permanently delete "${item.title}" and its saved points.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => void handleDelete(item.study_input_id),
      },
    ]);
  };

  const confirmLegacyDelete = (topicId: string, title: string) => {
    Alert.alert("Delete this saved point?", `NightRecall will remove "${title}" from your current saved list on this device.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => void handleLegacyDelete(topicId),
      },
    ]);
  };

  const handleLegacyDelete = async (topicId: string) => {
    try {
      await deleteTopic(topicId);
      removeTopic(topicId);
      setSavedInputs((current) => current.filter((item) => item.topic_id !== topicId));
      setTotalCount((current) => Math.max(0, current - 1));
    } catch (error) {
      const detail =
        axios.isAxiosError(error) && typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : "NightRecall could not delete this saved point right now.";
      Alert.alert("Could not delete", detail);
    }
  };

  const handleDelete = async (studyInputId: string) => {
    try {
      setDeletingStudyInputId(studyInputId);
      await deleteSavedInput(studyInputId);
      setSavedInputs((current) => current.filter((item) => item.study_input_id !== studyInputId));
      removeSavedInput(studyInputId);
      setTotalCount((current) => Math.max(0, current - 1));
    } catch (error) {
      const detail =
        axios.isAxiosError(error) && typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : "NightRecall could not delete this saved learning right now.";
      Alert.alert("Could not delete", detail);
    } finally {
      setDeletingStudyInputId(null);
    }
  };

  const handleSearchFocus: NonNullable<TextInputProps["onFocus"]> = (event) => {
    const target = event.nativeEvent.target;
    const scrollResponder = flatListRef.current?.getScrollResponder?.() as ScrollView | undefined;
    requestAnimationFrame(() => {
      if (typeof target === "number" && scrollResponder?.scrollResponderScrollNativeHandleToKeyboard) {
        scrollResponder.scrollResponderScrollNativeHandleToKeyboard(target, 132, true);
      }
    });
  };

  const listHeader = useMemo(
    () => (
      <>
        <TopBar
          leftIcon="settings"
          onLeftPress={() => navigation.navigate("Settings")}
          rightIcon="account-circle"
          onRightPress={() => navigation.navigate("Account")}
        />

        <ScreenHeader
          iconName="collections-bookmark"
          title="Saved learning"
          subtitle={
            keyboardVisible ? undefined : `${totalCount} card${totalCount === 1 ? "" : "s"} · tap one to make tonight's question`
          }
        />

        <View style={styles.section}>
          <SectionRow title="Saved cards" iconName="bookmark" actionLabel={`${totalCount} total`} />
          {syncing ? <Text style={styles.syncingText}>Syncing...</Text> : null}

          <SearchField
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleSearchFocus}
            placeholder="Search saved photos or notes"
          />
        </View>
      </>
    ),
    [handleSearchFocus, keyboardVisible, navigation, searchQuery, syncing, totalCount],
  );

  const listFooter = useMemo(() => {
    if (!hasMore || loading) {
      return null;
    }
    return (
      <Pressable style={({ pressed }) => [styles.loadMoreButton, pressed && styles.loadMoreButtonPressed]} onPress={() => void loadMore()}>
        <Text style={styles.loadMoreText}>{loadingMore ? "Loading more..." : "Load more"}</Text>
      </Pressable>
    );
  }, [hasMore, loadMore, loading, loadingMore]);

  const listEmpty = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.loadingRow}>
          <MaterialIcons name="hourglass-empty" size={18} color={colors.primary} />
          <Text style={styles.loadingText}>Loading saved learning...</Text>
        </View>
      );
    }
    return (
      <EmptyState
        iconName={savedInputs.length ? "search-off" : "collections-bookmark"}
        title={savedInputs.length ? "No matches found" : "Nothing saved yet"}
        body={
          savedInputs.length
            ? "Try a different word or clear the search."
            : "Saved cards will appear here after you extract points and save at least one of them."
        }
      />
    );
  }, [loading, savedInputs.length]);

  const renderItem = useCallback(
    ({ item }: { item: SavedStudyInputSummary }) => (
      <SavedLearningCard
        title={item.title}
        preview={item.preview || "Open to review the saved points from this learning."}
        bookmarkedCount={item.bookmarked_count}
        imageUri={item.source_image_ref ? getSourceImageUrl(item.source_image_ref) : null}
        imageHeaders={item.source_image_ref ? getSourceImageHeaders() : undefined}
        deleting={!usingLegacyFallback && deletingStudyInputId === item.study_input_id}
        onDelete={() => (usingLegacyFallback ? confirmLegacyDelete(item.topic_id, item.title) : confirmDelete(item))}
        onPress={() =>
          navigation.navigate("EditPoints", {
            variant: "saved",
            ...(item.study_input_id ? { studyInputId: item.study_input_id } : {}),
            topicId: item.topic_id,
          })
        }
      />
    ),
    [deletingStudyInputId, navigation, usingLegacyFallback],
  );

  return (
    <ScreenContainer footer={<BottomDock active="Library" navigation={navigation} />} scrollable={false}>
      <FlatList
        ref={flatListRef}
        data={loading ? [] : filteredInputs}
        keyExtractor={(item) => item.study_input_id || item.topic_id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.md,
    gap: 0,
  },
  itemSeparator: {
    height: theme.spacing.sm,
  },
  section: {
    gap: 10,
  },
  syncingText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 28,
  },
  loadingText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  loadMoreButton: {
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadMoreButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  loadMoreText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
});
