import React from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { EquipmentPicker } from "../components/EquipmentPicker";
import { SectionCard } from "../components/SectionCard";
import { spacing } from "../constants/spacing";
import { useAppState, equipmentCatalog } from "../hooks/useAppState";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "MyEquipment">;

export function MyEquipmentScreen({ navigation }: Props) {
  const { myEquipmentIds, updateMyEquipment } = useAppState();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionCard title="איזה ציוד יש לך?">
        <Text style={styles.caption}>
          בחר את סוגי האינסולין והציוד הרפואי שאתה משתמש בהם. אפשר לעדכן כאן בכל שלב.
        </Text>
        <EquipmentPicker
          items={equipmentCatalog}
          selectedIds={myEquipmentIds}
          onChange={updateMyEquipment}
          label="עדכון ציוד לפי סוג"
        />
      </SectionCard>

      <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("RequestEquipment")}>
        <Text style={styles.primaryButtonText}>להמשך לבקשת ציוד</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md
  },
  caption: {
    color: colors.muted,
    lineHeight: 22
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
  }
});
