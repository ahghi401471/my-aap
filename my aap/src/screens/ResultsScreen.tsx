import React from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { SectionCard } from "../components/SectionCard";
import { spacing } from "../constants/spacing";
import { useAppState } from "../hooks/useAppState";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Results">;

export function ResultsScreen({ navigation }: Props) {
  const { searchResults, lastSearchMode } = useAppState();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.info}>
        החיפוש מוין לפי קרבה {lastSearchMode === "gps" ? "למיקום הנוכחי שלך" : "למרכז העיר שבחרת"}.
      </Text>

      {searchResults.length === 0 ? (
        <SectionCard title="לא נמצאו תוצאות">
          <Text style={styles.emptyText}>נסה ציוד אחר או חפש לפי עיר שונה.</Text>
        </SectionCard>
      ) : (
        searchResults.map((result) => (
          <SectionCard key={result.user.id} title={result.user.fullName}>
            <View style={styles.resultRow}>
              <Text style={styles.value}>{result.city.name}</Text>
              <Text style={styles.label}>עיר</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.value}>{result.equipment.name}</Text>
              <Text style={styles.label}>ציוד</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.distance}>{result.distanceKm.toFixed(1)} ק"מ</Text>
              <Text style={styles.label}>מרחק משוער</Text>
            </View>
          </SectionCard>
        ))
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
  secondaryButton: {
    backgroundColor: "#FFF2DF",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center"
  },
  secondaryButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: "700"
  }
});
