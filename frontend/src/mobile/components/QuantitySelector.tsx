import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

type Props = {
  values: number[];
  selectedValue: number;
  maxEnabledValue: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

export function QuantitySelector({ values, selectedValue, maxEnabledValue, disabled = false, onChange }: Props) {
  return (
    <View style={styles.row}>
      {values.map((value) => {
        const itemDisabled = disabled || value > maxEnabledValue;
        const active = value === selectedValue;

        return (
          <Pressable
            key={value}
            style={({ pressed }) => [
              styles.pill,
              active && styles.pillActive,
              itemDisabled && styles.pillDisabled,
              pressed && !itemDisabled && styles.pillPressed,
            ]}
            onPress={() => onChange(value)}
            disabled={itemDisabled}
          >
            <Text style={[styles.value, active && styles.valueActive, itemDisabled && styles.valueDisabled]}>{value}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
  },
  pill: {
    flex: 1,
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: "rgba(255,253,248,0.94)",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillDisabled: {
    opacity: 0.35,
  },
  pillPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  value: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "800",
  },
  valueActive: {
    color: "#FFFFFF",
  },
  valueDisabled: {
    color: colors.mutedSoft,
  },
});
