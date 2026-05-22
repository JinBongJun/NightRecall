import { StyleSheet, View } from "react-native";

import { useThemedStyles, type ThemedStyleContext } from "../theme/useThemedStyles";

export function BrandBackdrop() {
  const styles = useThemedStyles(createStyles);
  const orbitNodes = [styles.nodeOne, styles.nodeTwo, styles.nodeThree, styles.nodeFour, styles.nodeFive, styles.nodeSix];
  const orbitLines = [styles.lineOne, styles.lineTwo, styles.lineThree, styles.lineFour];

  return (
    <View pointerEvents="none" style={styles.root}>
      <View style={styles.topGlow} />
      <View style={styles.bottomGlow} />

      <View style={[styles.arc, styles.arcLarge]} />
      <View style={[styles.arc, styles.arcMedium]} />
      <View style={[styles.arc, styles.arcSmall]} />
      <View style={[styles.arc, styles.arcBottom]} />

      {orbitLines.map((lineStyle, index) => (
        <View key={`line-${index}`} style={[styles.line, lineStyle]} />
      ))}

      {orbitNodes.map((nodeStyle, index) => (
        <View key={`node-${index}`} style={[styles.node, nodeStyle]} />
      ))}
    </View>
  );
}

function createStyles({ colors, isDark }: ThemedStyleContext) {
  const primaryGlow = isDark ? "rgba(114,168,134,0.14)" : "rgba(15,76,63,0.09)";
  const accentGlow = isDark ? "rgba(212,154,98,0.12)" : "rgba(199,123,74,0.08)";
  const arcBorder = isDark ? "rgba(114,168,134,0.16)" : "rgba(15,76,63,0.09)";
  const lineColor = isDark ? "rgba(114,168,134,0.2)" : "rgba(15,76,63,0.12)";
  const nodeFill = isDark ? "rgba(114,168,134,0.26)" : "rgba(15,76,63,0.18)";
  const nodeBorder = isDark ? colors.surface : "rgba(255,253,248,0.9)";

  return StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  topGlow: {
    position: "absolute",
    top: -140,
    right: -30,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: primaryGlow,
  },
  bottomGlow: {
    position: "absolute",
    left: -120,
    bottom: -90,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: accentGlow,
  },
  arc: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: arcBorder,
  },
  arcLarge: {
    width: 360,
    height: 360,
    top: -110,
    right: -120,
  },
  arcMedium: {
    width: 250,
    height: 250,
    top: 56,
    right: -68,
  },
  arcSmall: {
    width: 170,
    height: 170,
    top: 164,
    right: 36,
  },
  arcBottom: {
    width: 300,
    height: 300,
    left: -170,
    bottom: 72,
  },
  line: {
    position: "absolute",
    height: 1.5,
    borderRadius: 999,
    backgroundColor: lineColor,
  },
  lineOne: {
    width: 138,
    top: 158,
    right: 32,
    transform: [{ rotate: "-28deg" }],
  },
  lineTwo: {
    width: 112,
    top: 222,
    right: 118,
    transform: [{ rotate: "17deg" }],
  },
  lineThree: {
    width: 120,
    left: 32,
    bottom: 212,
    transform: [{ rotate: "24deg" }],
  },
  lineFour: {
    width: 90,
    left: 96,
    bottom: 130,
    transform: [{ rotate: "-34deg" }],
  },
  node: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: nodeFill,
    borderWidth: 2,
    borderColor: nodeBorder,
  },
  nodeOne: {
    top: 150,
    right: 52,
  },
  nodeTwo: {
    top: 198,
    right: 156,
  },
  nodeThree: {
    top: 240,
    right: 86,
  },
  nodeFour: {
    left: 34,
    bottom: 222,
  },
  nodeFive: {
    left: 108,
    bottom: 182,
  },
  nodeSix: {
    left: 144,
    bottom: 116,
  },
});
}
