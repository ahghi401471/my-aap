import React from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { RootStackParamList } from "../navigation/AppNavigator";
import { SectionCard } from "../components/SectionCard";
import { useAppState } from "../hooks/useAppState";
import { colors } from "../theme/colors";
import { spacing } from "../constants/spacing";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export function ProfileScreen({ navigation }: Props) {
  const { activeTemporaryCity, clearTemporaryLocation, currentUser, selectedCity } = useAppState();

  const activeTemporaryLocation = currentUser.temporaryLocation
    ? new Date(currentUser.temporaryLocation.expiresAt).getTime() > Date.now()
      ? currentUser.temporaryLocation
      : undefined
    : undefined;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>מה תרצה לעשות עכשיו?</Text>
        <Text style={styles.heroSubtitle}>בקשת ציוד, עריכת פרופיל ועדכון מיקום זמני במקום אחד.</Text>
      </View>

      <SectionCard title="פרטי משתמש">
        <View style={styles.row}>
          <Text style={styles.value}>{currentUser.fullName}</Text>
          <Text style={styles.label}>שם</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.value}>{currentUser.phoneNumber}</Text>
          <Text style={styles.label}>פלאפון</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.value}>{selectedCity.name}</Text>
          <Text style={styles.label}>עיר</Text>
        </View>
        {activeTemporaryLocation && activeTemporaryCity ? (
          <>
            <View style={styles.row}>
              <Text style={styles.value}>{activeTemporaryCity.name}</Text>
              <Text style={styles.label}>מיקום זמני</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.value}>{activeTemporaryLocation.durationHours} שעות</Text>
              <Text style={styles.label}>משך הדיווח</Text>
            </View>
          </>
        ) : null}
      </SectionCard>

      <SectionCard title="פעולות">
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("RequestEquipment")}>
          <Text style={styles.primaryButtonText}>בקשת ציוד</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("Register")}>
          <Text style={styles.secondaryButtonText}>עריכת פרופיל משתמש</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("TemporaryLocation")}>
          <Text style={styles.secondaryButtonText}>דיווח על מיקום נוסף</Text>
        </Pressable>

        {activeTemporaryLocation ? (
          <Pressable style={styles.ghostButton} onPress={clearTemporaryLocation}>
            <Text style={styles.ghostButtonText}>נקה מיקום זמני</Text>
          </Pressable>
        ) : null}

        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("MyEquipment")}>
          <Text style={styles.secondaryButtonText}>עריכת ציוד קיים</Text>
        </Pressable>
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md
  },
  heroCard: {
    backgroundColor: colors.secondarySoft,
    borderRadius: 28,
    padding: spacing.lg,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "#F2D5B8"
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right"
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
    textAlign: "right"
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs
  },
  label: {
    color: colors.muted,
    fontWeight: "600"
  },
  value: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700"
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center"
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
    alignItems: "center"
  },
  ghostButton: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border
  },
  secondaryButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: "700"
  },
  ghostButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  }
});
