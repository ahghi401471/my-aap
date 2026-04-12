import React, { useMemo, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

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
  const { currentUser, hasCompletedRegistration, myEquipmentIds, registerCurrentUser, selectedCity, updateProfile, updateMyEquipment } =
    useAppState();
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [username, setUsername] = useState(currentUser.username ?? "");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber);
  const [sharePhoneNumber, setSharePhoneNumber] = useState(currentUser.sharePhoneNumber ?? false);
  const [cityId, setCityId] = useState(currentUser.fullName ? selectedCity.id : "");
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

  const selectedCityRecord = useMemo(
    () => cities.find((city) => city.id === cityId) ?? undefined,
    [cityId]
  );

  const isEditingExistingProfile = hasCompletedRegistration && currentUser.id !== "guest-user";

  async function handleSubmit() {
    if (
      !fullName.trim() ||
      !username.trim() ||
      (!isEditingExistingProfile && !password.trim()) ||
      (password.trim() && password.trim().length < 6) ||
      selectedEquipmentIds.length === 0 ||
      !phoneNumber.trim() ||
      !sharePhoneNumber ||
      !cityId ||
      !selectedCityRecord
    ) {
      Alert.alert("חסרים פרטים", "מלא את כל השדות וסמן שמספר הפלאפון ישותף עם אנשים אחרים.");
      return;
    }

    setIsSavingProfile(true);

    try {
      let nextAddress = undefined;

      if (selectedStreet) {
        let lat = selectedStreet.lat ?? selectedCityRecord.lat;
        let lng = selectedStreet.lng ?? selectedCityRecord.lng;

        if (houseNumber.trim() || typeof lat !== "number" || typeof lng !== "number") {
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

      if (isEditingExistingProfile) {
        await updateProfile({
          fullName: fullName.trim(),
          username: username.trim(),
          password: password.trim() || undefined,
          phoneNumber: phoneNumber.trim(),
          sharePhoneNumber,
          cityId,
          address: nextAddress
        });
        await updateMyEquipment(selectedEquipmentIds);
      } else {
        await registerCurrentUser({
          fullName: fullName.trim(),
          username: username.trim(),
          password: password.trim(),
          phoneNumber: phoneNumber.trim(),
          sharePhoneNumber,
          cityId,
          address: nextAddress,
          equipmentIds: selectedEquipmentIds
        });
      }

      navigation.navigate("Profile");
    } catch (error) {
      Alert.alert("לא הצלחנו לשמור", "בדוק את החיבור לשרת או נסה שם משתמש אחר.");
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
          בחר עיר, רחוב, מספר בית, ציוד קבוע, פרטי קשר וגם שם משתמש וסיסמה כדי לשמור את הפרופיל שלך בשרת.
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

        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="שם משתמש"
          autoCapitalize="none"
          style={styles.input}
          placeholderTextColor={colors.muted}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={isEditingExistingProfile ? "סיסמה חדשה (לא חובה)" : "סיסמה"}
          secureTextEntry
          style={styles.input}
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.helperText}>
          לפחות 6 תווים. הסיסמה נשמרת בשרת כ־hash ולא כטקסט רגיל.
          {isEditingExistingProfile ? " אם לא תרשום סיסמה חדשה, הקיימת תישאר." : ""}
        </Text>

        <AutocompleteCityInput
          label="עיר"
          cities={cities}
          selectedCityId={cityId || undefined}
          onSelect={(city) => {
            setCityId(city.id);
            setSelectedStreet(null);
            setHouseNumber("");
          }}
        />

        <Text style={styles.helperText}>רשימת הערים כוללת את כל ערי ויישובי ישראל.</Text>

        <AutocompleteStreetInput
          label="רחוב מגורים"
          cityName={selectedCityRecord?.name ?? ""}
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
          כל סוג ציוד מופיע בשורת חיפוש משלו, וניתן לבחור יותר מפריט אחד בכל שורה. כל האינסולינים מרוכזים בשורה אחת.
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

        <Pressable style={styles.checkboxRow} onPress={() => setSharePhoneNumber((current) => !current)}>
          <MaterialCommunityIcons
            name={sharePhoneNumber ? "checkbox-marked" : "checkbox-blank-outline"}
            size={24}
            color={sharePhoneNumber ? colors.primary : colors.muted}
          />
          <Text style={styles.checkboxText}>אני מאשר שמספר הפלאפון שלי ישותף עם אנשים אחרים לצורך יצירת קשר</Text>
        </Pressable>

        <Pressable
          style={[
            styles.primaryButton,
            !fullName.trim() ||
            !username.trim() ||
            (!isEditingExistingProfile && !password.trim()) ||
            !phoneNumber.trim() ||
            !sharePhoneNumber ||
            !cityId ||
            selectedEquipmentIds.length === 0 ||
            isSavingProfile
              ? styles.buttonDisabled
              : null
          ]}
          disabled={
            !fullName.trim() ||
            !username.trim() ||
            (!isEditingExistingProfile && !password.trim()) ||
            !phoneNumber.trim() ||
            !sharePhoneNumber ||
            !cityId ||
            selectedEquipmentIds.length === 0 ||
            isSavingProfile
          }
          onPress={handleSubmit}
        >
          {isSavingProfile ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>{isEditingExistingProfile ? "שמור שינויים" : "סיום הרשמה"}</Text>
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
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  checkboxText: {
    flex: 1,
    color: colors.text,
    lineHeight: 22,
    fontWeight: "600"
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
