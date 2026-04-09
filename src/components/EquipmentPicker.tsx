import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { spacing } from "../constants/spacing";
import { colors } from "../theme/colors";
import { EquipmentItem } from "../types/models";

type Props = {
  items: EquipmentItem[];
  selectedIds: string[];
  onToggle: (equipmentId: string) => void;
  label?: string;
  multiSelect?: boolean;
};

export function EquipmentPicker({
  items,
  selectedIds,
  onToggle,
  label = "חיפוש ציוד",
  multiSelect = true
}: Props) {
  const [query, setQuery] = useState("");
  const categoryOrder = [
    "אינסולין מהיר",
    "אינסולין בזאלי",
    "סנסורי סוכר",
    "משאבות אינסולין",
    "קנולות וסטי החדרה",
    "גלוקומטרים",
    "סטיקים לגלוקומטר",
    "לנסטים ודוקרים"
  ];

  const groupedItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filteredItems = normalizedQuery
      ? items.filter((item) => {
          const haystack = `${item.name} ${item.category}`.toLowerCase();
          return haystack.includes(normalizedQuery);
        })
      : items;

    return filteredItems.reduce<Record<string, EquipmentItem[]>>((groups, item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }

      groups[item.category].push(item);
      return groups;
    }, {});
  }, [items, query]);

  const categories = Object.keys(groupedItems).sort((left, right) => {
    const leftIndex = categoryOrder.indexOf(left);
    const rightIndex = categoryOrder.indexOf(right);

    if (leftIndex !== -1 || rightIndex !== -1) {
      return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
    }

    return left.localeCompare(right, "he");
  });

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="חפש אינסולין, סנסור, משאבה או ציוד"
        style={styles.searchInput}
        placeholderTextColor={colors.muted}
      />

      <View style={styles.resultsContainer}>
        {categories.length === 0 ? (
          <Text style={styles.emptyText}>לא נמצאו פריטים ברשימה</Text>
        ) : (
          categories.map((category) => (
            <View key={category} style={styles.section}>
              <Text style={styles.sectionTitle}>{category}</Text>
              <View style={styles.list}>
                {groupedItems[category].map((item) => {
                  const selected = selectedIds.includes(item.id);

                  return (
                    <Pressable
                      key={item.id}
                      style={[styles.row, selected ? styles.rowSelected : null]}
                      onPress={() => onToggle(item.id)}
                    >
                      <View style={[styles.marker, selected ? styles.markerSelected : null]}>
                        <Text style={styles.markerText}>
                          {selected ? "✓" : multiSelect ? "+" : "○"}
                        </Text>
                      </View>
                      <View style={styles.rowTextContainer}>
                        <Text style={[styles.rowTitle, selected ? styles.rowTitleSelected : null]}>
                          {item.name}
                        </Text>
                        <Text style={styles.rowSubtitle}>{selected ? "נבחר" : "הקש לבחירה"}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm
  },
  label: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: "600"
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
    color: colors.text,
    fontSize: 16,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  resultsContainer: {
    gap: spacing.md
  },
  section: {
    gap: spacing.sm
  },
  sectionTitle: {
    color: colors.secondary,
    fontWeight: "800",
    fontSize: 15,
    backgroundColor: colors.secondarySoft,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999
  },
  list: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  rowSelected: {
    backgroundColor: colors.primarySoft
  },
  marker: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card
  },
  markerSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  markerText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14
  },
  rowTextContainer: {
    flex: 1,
    gap: 2
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  rowTitleSelected: {
    color: colors.primary
  },
  rowSubtitle: {
    color: colors.muted,
    fontSize: 12
  },
  emptyText: {
    color: colors.muted,
    textAlign: "center",
    paddingVertical: spacing.md
  }
});
