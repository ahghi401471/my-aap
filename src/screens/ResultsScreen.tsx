import React, { useMemo } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { SectionCard } from "../components/SectionCard";
import { spacing } from "../constants/spacing";
import { useAppState } from "../hooks/useAppState";
import { RootStackParamList } from "../navigation/AppNavigator";
import { SearchResult } from "../types/models";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Results">;

export function ResultsScreen({ navigation }: Props) {
  const { searchResults, lastSearchSummary } = useAppState();

  const groupedResults = useMemo(() => {
    const grouped = searchResults.reduce<Record<string, SearchResult[]>>((accumulator, result) => {
      if (!accumulator[result.user.id]) {
        accumulator[result.user.id] = [];
      }

      accumulator[result.user.id].push(result);
      return accumulator;
    }, {});

    return Object.values(grouped).sort((left, right) => left[0].distanceKm - right[0].distanceKm);
  }, [searchResults]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>התוצאות מסודרות לפי קרבה</Text>
        <Text style={styles.info}>החיפוש מוין {lastSearchSummary}.</Text>
      </View>

      {groupedResults.length > 0 ? (
        <Pressable style={styles.mapButton} onPress={() => navigation.navigate("ResultsMap")}>
          <Text style={styles.mapButtonText}>הצג על המפה את התוצאות</Text>
        </Pressable>
      ) : null}

      {groupedResults.length === 0 ? (
        <SectionCard title="לא נמצאו תוצאות">
          <Text style={styles.emptyText}>לא נמצאו אנשים עם הציוד הזה באזור שבחרת. נסה עיר, רחוב או ציוד אחר.</Text>
        </SectionCard>
      ) : (
        groupedResults.map((resultsForUser) => {
          const firstResult = resultsForUser[0];
          const equipmentNames = resultsForUser.map((result) => result.equipment.name);

          return (
            <SectionCard key={firstResult.user.id} title={firstResult.user.fullName}>
              <View style={styles.resultRow}>
                <Text style={styles.value}>{firstResult.city.name}</Text>
                <Text style={styles.label}>{firstResult.locationSource === "temporary" ? "מיקום זמני" : "עיר"}</Text>
              </View>
              {firstResult.addressLabel ? (
                <View style={styles.resultRow}>
                  <Text style={styles.value}>{firstResult.addressLabel}</Text>
                  <Text style={styles.label}>רחוב</Text>
                </View>
              ) : null}
              <View style={styles.equipmentSection}>
                <Text style={styles.label}>ציוד תואם</Text>
                <View style={styles.equipmentWrap}>
                  {equipmentNames.map((equipmentName) => (
                    <View key={`${firstResult.user.id}-${equipmentName}`} style={styles.equipmentChip}>
                      <Text style={styles.equipmentChipText}>{equipmentName}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.value}>{firstResult.distanceBasis === "street" ? "לפי רחוב" : "לפי עיר"}</Text>
                <Text style={styles.label}>רמת דיוק</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.distance}>{firstResult.distanceKm.toFixed(1)} ק"מ</Text>
                <Text style={styles.label}>מרחק משוער</Text>
              </View>
            </SectionCard>
          );
        })
      )}

      <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("RequestEquipment")}>
        <Text style={styles.secondaryButtonText}>חיפוש חדש</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: spacing.lg,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border
  },
  heroTitle: {
    color: colors.text,
    fontSize: 27,
    fontWeight: "800"
  },
  info: {
    color: colors.muted,
    lineHeight: 22,
    textAlign: "right"
  },
  emptyText: {
    color: colors.muted
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2
  },
  equipmentSection: {
    gap: spacing.sm,
    paddingVertical: spacing.xs
  },
  equipmentWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  equipmentChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  equipmentChipText: {
    color: colors.primary,
    fontWeight: "700"
  },
  label: {
    color: colors.muted,
    fontWeight: "600"
  },
  value: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700"
  },
  distance: {
    color: colors.success,
    fontSize: 18,
    fontWeight: "800"
  },
  mapButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center"
  },
  mapButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700"
  },
  secondaryButton: {
    backgroundColor: colors.secondarySoft,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center"
  },
  secondaryButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: "700"
  }
});
