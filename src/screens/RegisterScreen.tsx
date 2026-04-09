import React, { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { RootStackParamList } from "../navigation/AppNavigator";
import { AutocompleteCityInput } from "../components/AutocompleteCityInput";
import { EquipmentPicker } from "../components/EquipmentPicker";
import { SectionCard } from "../components/SectionCard";
import { cities, equipmentCatalog, useAppState } from "../hooks/useAppState";
import { spacing } from "../constants/spacing";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { currentUser, myEquipmentIds, selectedCity, updateMyEquipment, updateProfile } = useAppState();
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber);
  const [cityId, setCityId] = useState(selectedCity.id);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(myEquipmentIds);

  function toggleEquipment(equipmentId: string) {
    if (selectedEquipmentIds.includes(equipmentId)) {
      setSelectedEquipmentIds(selectedEquipmentIds.filter((item) => item !== equipmentId));
      return;
    }

    setSelectedEquipmentIds([...selectedEquipmentIds, equipmentId]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>ציוד סוכרת קרוב אליך</Text>
        <Text style={styles.heroTitle}>נרשמים פעם אחת ומוצאים עזרה מהר</Text>
        <Text style={styles.heroSubtitle}>
          בחר עיר, ציוד קבוע ופרטי קשר, והאפליקציה תציג בהמשך אנשים לפי הקרבה אליך.
        </Text>
      </View>

      <SectionCard title="פרטי הרשמה">
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="שם מלא"
          style={styles.input}
          placeholderTextColor={colors.muted}
        />

        <AutocompleteCityInput
          label="עיר"
          cities={cities}
          selectedCityId={cityId}
          onSelect={(city) => setCityId(city.id)}
        />

        <Text style={styles.sectionLabel}>באיזה ציוד אתה משתמש?</Text>
        <Text style={styles.helperText}>
          אפשר לבחור כמה סוגים. שמות האינסולין מוצגים בעברית ובסוגריים באנגלית.
        </Text>
        <EquipmentPicker
          items={equipmentCatalog}
          selectedIds={selectedEquipmentIds}
          onToggle={toggleEquipment}
        />

        <TextInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="מספר פלאפון"
          style={styles.input}
          keyboardType="phone-pad"
          placeholderTextColor={colors.muted}
        />

        <Pressable
          style={[
            styles.primaryButton,
            selectedEquipmentIds.length === 0 || !phoneNumber.trim() ? styles.buttonDisabled : null
          ]}
          disabled={selectedEquipmentIds.length === 0 || !phoneNumber.trim()}
          onPress={() => {
            updateProfile(
              fullName.trim() || currentUser.fullName,
              phoneNumber.trim() || currentUser.phoneNumber,
              cityId
            );
            updateMyEquipment(selectedEquipmentIds);
            navigation.navigate("TemporaryLocation");
          }}
        >
          <Text style={styles.primaryButtonText}>המשך למיקום זמני</Text>
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
    backgroundColor: colors.primary,
    borderRadius: 28,
    padding: spacing.lg,
    gap: spacing.sm
  },
  heroEyebrow: {
    color: "#D9F6EE",
    fontSize: 13,
    fontWeight: "700"
  },
  heroTitle: {
    fontSize: 31,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "right"
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#E8FAF4",
    lineHeight: 24,
    textAlign: "right"
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  helperText: {
    color: colors.muted,
    lineHeight: 22
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
    color: colors.text,
    fontSize: 16
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center"
  },
  buttonDisabled: {
    opacity: 0.5
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
  }
});
