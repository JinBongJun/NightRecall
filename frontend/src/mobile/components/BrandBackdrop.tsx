import { StyleSheet, View } from "react-native";

import { colors } from "../theme/colors";

export function BrandBackdrop() {
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

const styles = StyleSheet.create({
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
    backgroundColor: "rgba(15,76,63,0.09)",
  },
  bottomGlow: {
    position: "absolute",
    left: -120,
    bottom: -90,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: "rgba(199,123,74,0.08)",
  },
  arc: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(15,76,63,0.09)",
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
    backgroundColor: "rgba(15,76,63,0.12)",
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
    backgroundColor: "rgba(15,76,63,0.18)",
    borderWidth: 2,
    borderColor: "rgba(255,253,248,0.9)",
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

const orbitNodes = [
  styles.nodeOne,
  styles.nodeTwo,
  styles.nodeThree,
  styles.nodeFour,
  styles.nodeFive,
  styles.nodeSix,
];

const orbitLines = [styles.lineOne, styles.lineTwo, styles.lineThree, styles.lineFour];
