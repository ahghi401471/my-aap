import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { spacing } from "../constants/spacing";
import { colors } from "../theme/colors";
import { EquipmentItem } from "../types/models";

type Props = {
  items: EquipmentItem[];
  selectedIds: string[];
  onChange: (nextSelectedIds: string[]) => void;
  label?: string;
  selectionMode?: "singlePerCategory" | "singleOverall";
};

const insulinCategories = [
  "אינסולין מהיר",
  "אינסולין קצר טווח",
  "אינסולין בינוני",
  "אינסולין ארוך טווח",
  "אינסולין משולב"
];

const categoryOrder = [
  "אינסולין",
  "סנסורי סוכר",
  "משאבות אינסולין",
  "קנולות וסטי החדרה",
  "גלוקומטרים",
  "סטיקים לגלוקומטר",
  "לנסטים ודוקרים"
];

export function EquipmentPicker({
  items,
  selectedIds,
  onChange,
  label = "בחירת ציוד",
  selectionMode = "singlePerCategory"
}: Props) {
  const [queries, setQueries] = useState<Record<string, string>>({});
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const itemsByCategory = useMemo(() => {
    return items.reduce<Record<string, EquipmentItem[]>>((groups, item) => {
      const category = insulinCategories.includes(item.category) ? "אינסולין" : item.category;

      if (!groups[category]) {
        groups[category] = [];
      }

      groups[category].push(item);
      return groups;
    }, {});
  }, [items]);

  const orderedCategories = Object.keys(itemsByCategory).sort((left, right) => {
    const leftIndex = categoryOrder.indexOf(left);
    const rightIndex = categoryOrder.indexOf(right);

    if (leftIndex !== -1 || rightIndex !== -1) {
      return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
    }

    return left.localeCompare(right, "he");
  });

  function getSelectedItemForCategory(category: string) {
    return itemsByCategory[category]?.find((item) => selectedIds.includes(item.id));
  }

  function updateSelection(category: string, item: EquipmentItem) {
    if (selectionMode === "singleOverall") {
      onChange([item.id]);
      return;
    }

    if (category === "אינסולין") {
      if (selectedIds.includes(item.id)) {
        onChange(selectedIds.filter((id) => id !== item.id));
        return;
      }

      onChange([...selectedIds, item.id]);
      return;
    }

    const selectedInCategory = getSelectedItemForCategory(category);
    const nextIds = selectedIds.filter((id) => id !== selectedInCategory?.id);
    onChange([...nextIds, item.id]);
  }

  function clearSelection(category: string) {
    if (selectionMode === "singleOverall") {
      const categoryIds = (itemsByCategory[category] ?? []).map((item) => item.id);
      onChange(selectedIds.filter((id) => !categoryIds.includes(id)));
      return;
    }

    if (category === "אינסולין") {
      const insulinIds = (itemsByCategory[category] ?? []).map((item) => item.id);
      onChange(selectedIds.filter((id) => !insulinIds.includes(id)));
      return;
    }

    const selectedInCategory = getSelectedItemForCategory(category);

    if (!selectedInCategory) {
      return;
    }

    onChange(selectedIds.filter((id) => id !== selectedInCategory.id));
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      {orderedCategories.map((category) => {
        const selectedItem = getSelectedItemForCategory(category);
        const selectedItems = (itemsByCategory[category] ?? []).filter((item) => selectedIds.includes(item.id));
        const query = queries[category] ?? "";
        const normalizedQuery = query.trim().toLowerCase();
        const filteredItems = normalizedQuery
          ? (itemsByCategory[category] ?? []).filter((item) => item.name.toLowerCase().includes(normalizedQuery))
          : (itemsByCategory[category] ?? []).slice(0, 8);

        const isOpen = openCategory === category;

        return (
          <View key={category} style={styles.section}>
            <Text style={styles.sectionTitle}>{category}</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={query}
                onFocus={() => {
                  setOpenCategory(category);
                  setQueries((current) => ({
                    ...current,
                    [category]: current[category] ?? ""
                  }));
                }}
                onChangeText={(value) => {
                  setOpenCategory(category);
                  setQueries((current) => ({
                    ...current,
                    [category]: value
                  }));
                }}
                placeholder={`חפש ${category}`}
                style={styles.searchInput}
                placeholderTextColor={colors.muted}
              />
              {selectedItems.length > 0 ? (
                <Pressable style={styles.clearButton} onPress={() => clearSelection(category)}>
                  <Text style={styles.clearButtonText}>נקה</Text>
                </Pressable>
              ) : null}
            </View>

            {category === "אינסולין" ? (
              <Text style={styles.multiHint}>ניתן לבחור יותר מסוג אינסולין אחד</Text>
            ) : null}

            {selectedItems.length > 0 ? (
              <View style={styles.selectedWrap}>
                {selectedItems.map((item) => (
                  <View key={item.id} style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>{item.name}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {isOpen ? (
              <View style={styles.dropdown}>
                {filteredItems.length === 0 ? (
                  <Text style={styles.emptyText}>לא נמצאו התאמות</Text>
                ) : (
                  filteredItems.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.option}
                      onPress={() => {
                        updateSelection(category, item);
                        setQueries((current) => ({
                          ...current,
                          [category]: category === "אינסולין" ? "" : item.name
                        }));
                        if (category !== "אינסולין") {
                          setOpenCategory(null);
                        }
                      }}
                    >
                      <Text style={styles.optionText}>{item.name}</Text>
                    </Pressable>
                  ))
                )}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md
  },
  label: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: "600"
  },
  section: {
    gap: spacing.xs
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  inputRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center"
  },
  searchInput: {
    flex: 1,
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
  clearButton: {
    backgroundColor: colors.secondarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: 14
  },
  clearButtonText: {
    color: colors.secondary,
    fontWeight: "700"
  },
  selectedBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  selectedBadgeText: {
    color: colors.primary,
    fontWeight: "700"
  },
  selectedWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  multiHint: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  dropdown: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  optionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600"
  },
  emptyText: {
    color: colors.muted,
    textAlign: "center",
    paddingVertical: spacing.md
  }
});
