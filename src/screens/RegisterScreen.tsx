import React, { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";

import { RootStackParamList } from "../navigation/AppNavigator";
import { AutocompleteCityInput } from "../components/AutocompleteCityInput";
import { SectionCard } from "../components/SectionCard";
import { cities, useAppState } from "../hooks/useAppState";
import { spacing } from "../constants/spacing";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { currentUser, selectedCity, updateProfile } = useAppState();
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [cityId, setCityId] = useState(selectedCity.id);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heroTitle}>מוצאים ציוד לפי קרבה</Text>
      <Text style={styles.heroSubtitle}>
        כל משתמש נרשם, בוחר עיר מתוך רשימת ערים בישראל, ומתחיל לחפש ציוד מהקרוב לרחוק.
      </Text>

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

        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            updateProfile(fullName.trim() || currentUser.fullName, cityId);
            navigation.navigate("Profile");
          }}
        >
          <Text style={styles.primaryButtonText}>המשך לפרופיל</Text>
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
  heroTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right"
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.muted,
    lineHeight: 24,
    textAlign: "right"
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 16
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
