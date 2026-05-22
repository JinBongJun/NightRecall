import { useEffect, useRef } from "react";
import { Animated } from "react-native";

import { MOTION_DURATION, MOTION_EASING, MOTION_ENTRANCE } from "../theme/motion";
import { useReduceMotion } from "./useReduceMotion";

export function useEntranceAnimation(active = true) {
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(active && !reduceMotion ? 0 : 1)).current;

  useEffect(() => {
    if (!active || reduceMotion) {
      progress.setValue(1);
      return;
    }

    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: MOTION_DURATION.normal,
      easing: MOTION_EASING.out,
      useNativeDriver: true,
    }).start();
  }, [active, progress, reduceMotion]);

  const animatedStyle = {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [MOTION_ENTRANCE.translateY, 0],
        }),
      },
    ],
  };

  return { progress, animatedStyle, reduceMotion };
}
