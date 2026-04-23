import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Easing, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import axios from "axios";

import { ScreenContainer } from "../components/ScreenContainer";
import { extractStudyInput } from "../services/studyService";
import { colors } from "../theme/colors";
import { RootStackParamList } from "../types/navigation";
import { asUsageLimitReason } from "../utils/usageLimits";
import { extractKeyPoints } from "../utils/extractKeyPoints";

type Props = NativeStackScreenProps<RootStackParamList, "Processing">;

export function ProcessingScreen({ route, navigation }: Props) {
  const { mode, sourceText, imageBase64, imageUri, imageMimeType } = route.params;
  const pulse = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const copyFade = useRef(new Animated.Value(1)).current;
  const [phaseIndex, setPhaseIndex] = useState(0);
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
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    pulseAnimation.start();
    shimmerAnimation.start();

    return () => {
      pulseAnimation.stop();
      shimmerAnimation.stop();
    };
  }, [pulse, shimmer]);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(copyFade, {
          toValue: 0.45,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(copyFade, {
          toValue: 1,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
      setPhaseIndex((current) => (current + 1) % phases.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [copyFade, phases.length]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        if (mode === "manual") {
          const fallbackPoints = extractKeyPoints(sourceText, "manual");
          if (!fallbackPoints.length) {
            Alert.alert("Extraction failed", "Add a little more detail so NightRecall can extract useful points.");
            navigation.goBack();
            return;
          }

          if (!cancelled) {
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

        const extracted = await extractStudyInput({
          source_type: "image",
          image_base64: imageBase64,
          image_mime_type: imageMimeType,
        });

        if (!cancelled) {
          navigation.replace("EditPoints", {
            variant: "new",
            mode: "photo",
            sourceText: extracted.source_preview || sourceText,
            extractedPoints: extracted.points.map((point) => point.text),
            imageUri,
            imageBase64,
            imageMimeType,
          });
        }
      } catch (error) {
        const apiDetail =
          axios.isAxiosError(error) && typeof error.response?.data?.detail === "string"
            ? error.response.data.detail
            : null;
        const usageLimitReason = asUsageLimitReason(apiDetail);
        if (!cancelled && usageLimitReason === "photo_extract") {
          navigation.replace("UsageLimit", {
            reason: usageLimitReason,
            sourceText: sourceText || "",
            imageUri,
            imageBase64,
            imageMimeType,
          });
          return;
        }
        if (!cancelled && mode === "photo") {
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
      cancelled = true;
    };
  }, [imageBase64, imageMimeType, imageUri, mode, navigation, sourceText]);

  return (
    <ScreenContainer>
      <View style={styles.wrap}>
        <Animated.View
          style={[
            styles.motionWrap,
            {
              transform: [
                {
                  scale: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.05],
                  }),
                },
              ],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.motionGlowLarge,
              {
                opacity: shimmer.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0.5],
                }),
                transform: [
                  {
                    scale: shimmer.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.92, 1.08],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.motionGlowSmall,
              {
                opacity: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.18, 0.36],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.iconTile,
              {
                transform: [
                  {
                    rotate: shimmer.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["-4deg", "4deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.motionRow}>
              <Animated.View
                style={[
                  styles.motionBar,
                  styles.motionBarShort,
                  {
                    opacity: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.motionBar,
                  styles.motionBarLong,
                  {
                    opacity: shimmer.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 0.95],
                    }),
                  },
                ]}
              />
            </View>
            <Animated.View
              style={[
                styles.motionDot,
                {
                  transform: [
                    {
                      translateX: shimmer.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-8, 8],
                      }),
                    },
                  ],
                },
              ]}
            />
          </Animated.View>
        </Animated.View>

        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <Animated.Text style={[styles.phase, { opacity: copyFade }]}>{phases[phaseIndex]}</Animated.Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 520,
    justifyContent: "center",
    alignItems: "center",
    gap: 28,
  },
  motionWrap: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  motionGlowLarge: {
    position: "absolute",
    width: 118,
    height: 118,
    borderRadius: 999,
    backgroundColor: "rgba(45,90,90,0.18)",
  },
  motionGlowSmall: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 999,
    backgroundColor: "rgba(188,235,235,0.24)",
  },
  iconTile: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1B1C19",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  motionRow: {
    gap: 8,
    alignItems: "center",
  },
  motionBar: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  motionBarShort: {
    width: 18,
  },
  motionBarLong: {
    width: 30,
  },
  motionDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    marginTop: 10,
  },
  copy: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: colors.primary,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.8,
  },
  body: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 280,
  },
  phase: {
    color: colors.mutedSoft,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginTop: 8,
  },
});
