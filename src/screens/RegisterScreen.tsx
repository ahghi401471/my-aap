import React, { useMemo, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { RootStackParamList } from "../navigation/AppNavigator";
import { AutocompleteCityInput } from "../components/AutocompleteCityInput";
import { AutocompleteStreetInput } from "../components/AutocompleteStreetInput";
import { EquipmentPicker } from "../components/EquipmentPicker";
import { SectionCard } from "../components/SectionCard";
import { cities, equipmentCatalog, useAppState } from "../hooks/useAppState";
import { spacing } from "../constants/spacing";
import { geocodeStreetAddress } from "../services/streets";
import { colors } from "../theme/colors";
import { StreetSuggestion } from "../types/models";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { completeRegistration, currentUser, myEquipmentIds, selectedCity, updateMyEquipment, updateProfile } =
    useAppState();
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber);
  const [cityId, setCityId] = useState(selectedCity.id);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(myEquipmentIds);
  const [houseNumber, setHouseNumber] = useState(currentUser.address?.houseNumber ?? "");
  const [selectedStreet, setSelectedStreet] = useState<StreetSuggestion | null>(
    currentUser.address
      ? {
          id: `${currentUser.address.cityId}-${currentUser.address.streetName}`,
          name: currentUser.address.streetName,
          cityName: selectedCity.name,
          displayName: `${currentUser.address.streetName} ${currentUser.address.houseNumber}, ${selectedCity.name}`,
          lat: currentUser.address.lat,
          lng: currentUser.address.lng
        }
      : null
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const selectedCityRecord = useMemo(() => cities.find((city) => city.id === cityId) ?? cities[0], [cityId]);

  async function handleSubmit() {
    if (selectedEquipmentIds.length === 0 || !phoneNumber.trim()) {
      return;
    }

    setIsSavingProfile(true);

    try {
      let nextAddress = undefined;

      if (selectedStreet) {
        let lat = selectedStreet.lat;
        let lng = selectedStreet.lng;

        if (houseNumber.trim()) {
          const exactAddress = await geocodeStreetAddress({
            cityName: selectedCityRecord.name,
            streetName: selectedStreet.name,
            houseNumber: houseNumber.trim()
          }).catch(() => null);

          if (exactAddress) {
            lat = exactAddress.lat;
            lng = exactAddress.lng;
          }
        }

        nextAddress = {
          cityId,
          streetName: selectedStreet.name,
          houseNumber: houseNumber.trim(),
          lat,
          lng
        };
      }

      updateProfile({
        fullName: fullName.trim() || currentUser.fullName,
        phoneNumber: phoneNumber.trim() || currentUser.phoneNumber,
        cityId,
        address: nextAddress
      });
      updateMyEquipment(selectedEquipmentIds);
      completeRegistration();
      navigation.navigate("Profile");
    } finally {
      setIsSavingProfile(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>ציוד סוכרת קרוב אליך</Text>
        <Text style={styles.heroTitle}>נרשמים פעם אחת ומוצאים עזרה מהר</Text>
        <Text style={styles.heroSubtitle}>
          בחר עיר, רחוב, מספר בית, ציוד קבוע ופרטי קשר, והאפליקציה תציג בהמשך אנשים לפי הקרבה המדויקת אליך.
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
          onSelect={(city) => {
            setCityId(city.id);
            setSelectedStreet(null);
            setHouseNumber("");
          }}
        />

        <Text style={styles.helperText}>רשימת הערים כוללת את כל ערי ויישובי ישראל.</Text>

        <AutocompleteStreetInput
          label="רחוב מגורים"
          cityName={selectedCityRecord.name}
          selectedStreet={selectedStreet}
          onSelect={setSelectedStreet}
        />

        <TextInput
          value={houseNumber}
          onChangeText={setHouseNumber}
          placeholder="מספר בית"
          style={styles.input}
          keyboardType="number-pad"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.addressHelper}>
          הרחובות נטענים לפי העיר שבחרת. אם נבחר גם רחוב, הקרבה תחושב בצורה מדויקת יותר מאשר לפי מרכז העיר בלבד.
        </Text>

        <Text style={styles.sectionLabel}>באיזה ציוד אתה משתמש?</Text>
        <Text style={styles.helperText}>
          כל סוג ציוד מופיע בשורת חיפוש משלו, וניתן לבחור יותר מפריט אחד בכל שורה. כל האינסולינים מרוכזים
          בשורה אחת.
        </Text>
        <EquipmentPicker
          items={equipmentCatalog}
          selectedIds={selectedEquipmentIds}
          onChange={setSelectedEquipmentIds}
          label="חיפוש ציוד לפי שורה לכל סוג"
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
            selectedEquipmentIds.length === 0 || !phoneNumber.trim() || isSavingProfile ? styles.buttonDisabled : null
          ]}
          disabled={selectedEquipmentIds.length === 0 || !phoneNumber.trim() || isSavingProfile}
          onPress={handleSubmit}
        >
          {isSavingProfile ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>סיום הרשמה</Text>
          )}
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
  addressHelper: {
    color: colors.secondary,
    lineHeight: 22,
    fontWeight: "600"
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
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56
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
