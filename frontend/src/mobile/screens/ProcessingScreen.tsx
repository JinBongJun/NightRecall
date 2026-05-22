import { useEffect, useMemo, useRef } from "react";
import { Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import axios from "axios";

import { ActionButton } from "../components/ActionButton";
import { LoadingOrbitPanel } from "../components/LoadingOrbitPanel";
import { ScreenContainer } from "../components/ScreenContainer";
import { TopBar } from "../components/TopBar";
import { startStudyInputExtractJob, waitForStudyInputExtractJob } from "../services/studyService";
import type { CaptureStackParamList } from "../navigation/types";
import { asUsageLimitReason } from "../utils/usageLimits";
import { extractKeyPoints } from "../utils/extractKeyPoints";

type Props = NativeStackScreenProps<CaptureStackParamList, "Processing">;

export function ProcessingScreen({ route, navigation }: Props) {
  const { mode, sourceText, imageBase64, imageUri, imageMimeType } = route.params;
  const cancelledRef = useRef(false);

  const cancel = () => {
    cancelledRef.current = true;
    navigation.goBack();
  };
  const title = useMemo(() => (mode === "photo" ? "AI is reading your photo" : "AI is reading your note"), [mode]);
  const body = useMemo(
    () => (mode === "photo" ? "Pulling out what matters for tonight's questions." : "Pulling out what matters for tonight's questions."),
    [mode],
  );
  const phases = useMemo(
    () =>
      mode === "photo"
        ? ["Reading details", "Finding key points", "Shaping questions"]
        : ["Reading your note", "Finding key points", "Shaping questions"],
    [mode],
  );

  useEffect(() => {
    cancelledRef.current = false;

    const run = async () => {
      try {
        if (mode === "manual") {
          const fallbackPoints = extractKeyPoints(sourceText, "manual");
          if (!fallbackPoints.length) {
            Alert.alert("Extraction failed", "Add a little more detail so NightRecall can extract useful points.");
            navigation.goBack();
            return;
          }

          if (!cancelledRef.current) {
            navigation.replace("EditPoints", {
              variant: "new",
              mode: "manual",
              sourceText,
              extractedPoints: fallbackPoints,
              imageUri,
              imageBase64,
              imageMimeType,
            });
          }
          return;
        }

        if (!imageBase64) {
          Alert.alert("Extraction failed", "NightRecall could not read that image.");
          navigation.goBack();
          return;
        }

        const job = await startStudyInputExtractJob({
          source_type: "image",
          image_base64: imageBase64,
          image_mime_type: imageMimeType,
        });
        const completed = await waitForStudyInputExtractJob(job.job_id, {
          isCancelled: () => cancelledRef.current,
        });

        if (!cancelledRef.current) {
          if (!completed.points?.length) {
            throw new Error("study_input_extract_job_returned_no_points");
          }
          navigation.replace("EditPoints", {
            variant: "new",
            mode: "photo",
            sourceText: completed.source_preview || sourceText,
            extractedPoints: completed.points.map((point) => point.text),
            imageUri,
            imageBase64,
            imageMimeType,
          });
        }
      } catch (error) {
        const apiDetail =
          axios.isAxiosError(error) && typeof error.response?.data?.detail === "string"
            ? error.response.data.detail
            : error instanceof Error
              ? error.message
              : null;
        const usageLimitReason = asUsageLimitReason(apiDetail);
        if (!cancelledRef.current && usageLimitReason === "photo_extract") {
          navigation.replace("UsageLimit", {
            reason: usageLimitReason,
            sourceText: sourceText || "",
            imageUri,
            imageBase64,
            imageMimeType,
          });
          return;
        }
        if (!cancelledRef.current && mode === "photo") {
          navigation.replace("ExtractionHelp", {
            mode: "photo",
            sourceText: sourceText || "",
            imageUri,
            imageBase64,
            imageMimeType,
            detail: apiDetail ?? undefined,
          });
          return;
        }

        Alert.alert(
          "Extraction failed",
          apiDetail ?? "NightRecall could not extract useful points from this input.",
        );
        navigation.goBack();
      }
    };

    void run();

    return () => {
      cancelledRef.current = true;
    };
  }, [imageBase64, imageMimeType, imageUri, mode, navigation, sourceText]);

  return (
    <ScreenContainer>
      <TopBar leftIcon="close" onLeftPress={cancel} />
      <LoadingOrbitPanel title={title} body={body} phases={phases} />
      <ActionButton label="Cancel" onPress={cancel} variant="tertiary" />
    </ScreenContainer>
  );
}
