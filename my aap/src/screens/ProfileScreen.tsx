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
  const { currentUser, selectedCity } = useAppState();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionCard title="פרטי משתמש">
        <View style={styles.row}>
          <Text style={styles.value}>{currentUser.fullName}</Text>
          <Text style={styles.label}>שם</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.value}>{selectedCity.name}</Text>
          <Text style={styles.label}>עיר</Text>
        </View>
      </SectionCard>

      <SectionCard title="פעולות">
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("MyEquipment")}>
          <Text style={styles.primaryButtonText}>פרסום ציוד קיים</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("RequestEquipment")}>
          <Text style={styles.secondaryButtonText}>פתיחת בקשה לציוד</Text>
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
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center"
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
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
