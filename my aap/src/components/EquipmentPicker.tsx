import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { EquipmentItem } from "../types/models";
import { spacing } from "../constants/spacing";
import { colors } from "../theme/colors";

type Props = {
  items: EquipmentItem[];
  selectedIds: string[];
  onToggle: (equipmentId: string) => void;
};

export function EquipmentPicker({ items, selectedIds, onToggle }: Props) {
  return (
    <View style={styles.container}>
      {items.map((item) => {
        const selected = selectedIds.includes(item.id);

        return (
          <Pressable
            key={item.id}
            style={[styles.chip, selected ? styles.chipSelected : null]}
            onPress={() => onToggle(item.id)}
          >
            <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{item.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  chip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  chipText: {
    color: colors.text,
    fontWeight: "600"
  },
  chipTextSelected: {
    color: "#FFFFFF"
  }
});
