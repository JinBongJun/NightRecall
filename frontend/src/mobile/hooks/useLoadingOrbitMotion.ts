import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";

import { MOTION_DURATION, MOTION_EASING } from "../theme/motion";
import { useReduceMotion } from "./useReduceMotion";

export function useLoadingOrbitMotion(phases: string[]) {
  const reduceMotion = useReduceMotion();
  const pulse = useRef(new Animated.Value(reduceMotion ? 0.5 : 0)).current;
  const shimmer = useRef(new Animated.Value(reduceMotion ? 0.5 : 0)).current;
  const copyFade = useRef(new Animated.Value(1)).current;
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(0.5);
      shimmer.setValue(0.5);
      return;
    }

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: MOTION_DURATION.loadingPulse,
          easing: MOTION_EASING.inOut,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: MOTION_DURATION.loadingPulse,
          easing: MOTION_EASING.inOut,
          useNativeDriver: true,
        }),
      ]),
    );

    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: MOTION_DURATION.loadingShimmer,
          easing: MOTION_EASING.inOutCubic,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: MOTION_DURATION.loadingShimmer,
          easing: MOTION_EASING.inOutCubic,
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
  }, [pulse, reduceMotion, shimmer]);

  useEffect(() => {
    if (phases.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      if (reduceMotion) {
        setPhaseIndex((current) => (current + 1) % phases.length);
        return;
      }

      Animated.sequence([
        Animated.timing(copyFade, {
          toValue: 0.45,
          duration: MOTION_DURATION.phaseFadeOut,
          easing: MOTION_EASING.out,
          useNativeDriver: true,
        }),
        Animated.timing(copyFade, {
          toValue: 1,
          duration: MOTION_DURATION.phaseFadeIn,
          easing: MOTION_EASING.in,
          useNativeDriver: true,
        }),
      ]).start();
      setPhaseIndex((current) => (current + 1) % phases.length);
    }, MOTION_DURATION.phaseInterval);

    return () => clearInterval(interval);
  }, [copyFade, phases.length, reduceMotion]);

  return {
    pulse,
    shimmer,
    copyFade,
    phaseIndex,
    phaseLabel: phases[phaseIndex] ?? phases[0] ?? "",
    reduceMotion,
  };
}
