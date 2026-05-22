import { Easing } from "react-native";

export const MOTION_DURATION = {
  fast: 200,
  normal: 280,
  slow: 360,
  phaseFadeOut: 180,
  phaseFadeIn: 220,
  loadingPulse: 900,
  loadingShimmer: 1600,
  phaseInterval: 1500,
} as const;

export const MOTION_EASING = {
  out: Easing.out(Easing.quad),
  in: Easing.in(Easing.quad),
  inOut: Easing.inOut(Easing.quad),
  inOutCubic: Easing.inOut(Easing.cubic),
} as const;

export const MOTION_PRESS = {
  scale: 0.98,
  opacity: 0.92,
} as const;

export const MOTION_ENTRANCE = {
  translateY: 12,
  opacityFrom: 0,
  opacityTo: 1,
} as const;
