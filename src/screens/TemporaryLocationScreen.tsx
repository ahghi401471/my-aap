import React, { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AutocompleteCityInput } from "../components/AutocompleteCityInput";
import { SectionCard } from "../components/SectionCard";
import { spacing } from "../constants/spacing";
import { cities, useAppState } from "../hooks/useAppState";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "TemporaryLocation">;

const durationOptions = [
  { label: "שעה", hours: 1 },
  { label: "שעתיים", hours: 2 },
  { label: "4 שעות", hours: 4 },
  { label: "8 שעות", hours: 8 },
  { label: "12 שעות", hours: 12 },
  { label: "יום", hours: 24 },
  { label: "יומיים", hours: 48 },
  { label: "3 ימים", hours: 72 }
];

export function TemporaryLocationScreen({ navigation }: Props) {
  const { selectedCity, setTemporaryLocation } = useAppState();
  const [cityId, setCityId] = useState(selectedCity.id);
  const [durationHours, setDurationHours] = useState(8);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>מיקום זמני למספר שעות או ימים</Text>
        <Text style={styles.heroSubtitle}>
          כשאתה נמצא זמנית בעיר אחרת, אפשר לדווח עליה כדי שיוכלו למצוא אותך קרוב יותר.
        </Text>
      </View>

      <SectionCard title="דיווח על מיקום נוסף לזמן קצר">
        <Text style={styles.description}>
          אם אתה נמצא זמנית בעיר אחרת, אפשר לדווח עליה כדי שמשתמשים יוכלו למצוא אותך גם שם בזמן הקרוב.
        </Text>

        <AutocompleteCityInput
          label="מיקום זמני"
          cities={cities}
          selectedCityId={cityId}
          onSelect={(city) => setCityId(city.id)}
        />

        <Text style={styles.sectionLabel}>לכמה זמן אתה נמצא שם?</Text>
        <View style={styles.durationGrid}>
          {durationOptions.map((option) => {
            const selected = option.hours === durationHours;

            return (
              <Pressable
                key={option.hours}
                style={[styles.durationButton, selected ? styles.durationButtonSelected : null]}
                onPress={() => setDurationHours(option.hours)}
              >
                <Text style={[styles.durationText, selected ? styles.durationTextSelected : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>

      <Pressable
        style={styles.primaryButton}
        onPress={() => {
          setTemporaryLocation(cityId, durationHours);
          navigation.navigate("Profile");
        }}
      >
        <MaterialCommunityIcons name="content-save-outline" size={20} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>שמור מיקום זמני</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("Profile")}>
        <MaterialCommunityIcons name="arrow-right-circle-outline" size={18} color={colors.secondary} />
        <Text style={styles.secondaryButtonText}>דלג כרגע</Text>
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
    backgroundColor: colors.primarySoft,
    borderRadius: 28,
    padding: spacing.lg,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "#C8ECDD"
  },
  heroTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800"
  },
  heroSubtitle: {
    color: colors.muted,
    lineHeight: 22
  },
  description: {
    color: colors.muted,
    lineHeight: 22
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  durationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  durationButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  durationButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  durationText: {
    color: colors.text,
    fontWeight: "700"
  },
  durationTextSelected: {
    color: "#FFFFFF"
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
  },
  secondaryButton: {
    backgroundColor: colors.secondarySoft,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8
  },
  secondaryButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: "700"
  }
});
