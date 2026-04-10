import React, { useMemo, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AutocompleteCityInput } from "../components/AutocompleteCityInput";
import { AutocompleteStreetInput } from "../components/AutocompleteStreetInput";
import { SectionCard } from "../components/SectionCard";
import { spacing } from "../constants/spacing";
import { geocodeStreetAddress } from "../services/streets";
import { cities, equipmentCatalog, useAppState } from "../hooks/useAppState";
import { RootStackParamList } from "../navigation/AppNavigator";
import { SearchMode, StreetSuggestion } from "../types/models";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "RequestEquipment">;

export function RequestEquipmentScreen({ navigation }: Props) {
  const { currentUser, selectedCity, runSearch } = useAppState();
  const availableEquipment = equipmentCatalog.filter((item) => currentUser.equipmentIds.includes(item.id));
  const groupedEquipment = availableEquipment.reduce<Record<string, typeof availableEquipment>>((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }

    groups[item.category].push(item);
    return groups;
  }, {});
  const orderedCategories = Object.keys(groupedEquipment).sort((left, right) => left.localeCompare(right, "he"));
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(availableEquipment[0] ? [availableEquipment[0].id] : []);
  const [searchMode, setSearchMode] = useState<SearchMode>("city");
  const [searchCityId, setSearchCityId] = useState(selectedCity.id);
  const [searchStreet, setSearchStreet] = useState<StreetSuggestion | null>(null);
  const [houseNumber, setHouseNumber] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const searchCity = useMemo(
    () => cities.find((city) => city.id === searchCityId) ?? selectedCity,
    [searchCityId, selectedCity]
  );

  function toggleEquipment(equipmentId: string) {
    setSelectedEquipmentIds((current) =>
      current.includes(equipmentId) ? current.filter((id) => id !== equipmentId) : [...current, equipmentId]
    );
  }

  async function handleSearch() {
    if (selectedEquipmentIds.length === 0) {
      return;
    }

    if (searchMode === "gps") {
      try {
        setIsLoadingLocation(true);
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!permission.granted) {
          Alert.alert("גישה למיקום נדחתה", "אפשר לעבור לחיפוש לפי עיר ורחוב.");
          return;
        }

        const currentPosition = await Location.getCurrentPositionAsync({});

        runSearch({
          equipmentIds: selectedEquipmentIds,
          searchMode: "gps",
          lat: currentPosition.coords.latitude,
          lng: currentPosition.coords.longitude,
          searchSummary: "לפי המיקום הנוכחי שלך"
        });
      } catch (error) {
        Alert.alert("לא הצלחנו לאתר מיקום", "נסה שוב או עבור לבחירת עיר ורחוב.");
        return;
      } finally {
        setIsLoadingLocation(false);
      }
    } else {
      let baseLat = searchStreet?.lat;
      let baseLng = searchStreet?.lng;
      let searchSummary = `לפי ${searchCity.name}`;

      if (searchStreet) {
        searchSummary = `לפי ${searchCity.name}, ${searchStreet.name}${houseNumber.trim() ? ` ${houseNumber.trim()}` : ""}`;
      }

      if (searchStreet && (houseNumber.trim() || typeof baseLat !== "number" || typeof baseLng !== "number")) {
        const exactAddress = await geocodeStreetAddress({
          cityName: searchCity.name,
          streetName: searchStreet.name,
          houseNumber: houseNumber.trim()
        }).catch(() => null);

        if (exactAddress) {
          baseLat = exactAddress.lat;
          baseLng = exactAddress.lng;
        }
      }

      runSearch({
        equipmentIds: selectedEquipmentIds,
        searchMode: "city",
        cityId: searchCityId,
        lat: baseLat,
        lng: baseLng,
        searchSummary
      });
    }

    navigation.navigate("Results");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>מבקשים ציוד לפי מיקום</Text>
        <Text style={styles.heroSubtitle}>
          בחר פריט אחד או יותר, בחר GPS או עיר ורחוב, ונציג קודם את האנשים הכי קרובים אליך.
        </Text>
      </View>

      <SectionCard title="מה אתה צריך?">
        <Text style={styles.helperText}>
          כאן מוצגים רק סוגי הציוד שהגדרת בפרופיל שלך. אפשר לבחור יותר מפריט אחד, למשל גם אינסולין וגם סנסור.
        </Text>
        <View style={styles.equipmentSections}>
          {orderedCategories.map((category) => (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <MaterialCommunityIcons name="tag-outline" size={14} color={colors.secondary} />
                <Text style={styles.categoryHeaderText}>{category}</Text>
              </View>

              <View style={styles.equipmentButtonGroup}>
                {groupedEquipment[category].map((item) => {
                  const selected = selectedEquipmentIds.includes(item.id);

                  return (
                    <Pressable
                      key={item.id}
                      style={[styles.equipmentButton, selected ? styles.equipmentButtonSelected : null]}
                      onPress={() => toggleEquipment(item.id)}
                    >
                      <Text style={[styles.equipmentButtonText, selected ? styles.equipmentButtonTextSelected : null]}>
                        {item.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
        {availableEquipment.length === 0 ? (
          <Text style={styles.helperText}>עדיין לא הוגדר ציוד בפרופיל. היכנס לעריכת הפרופיל והוסף ציוד קודם.</Text>
        ) : null}
      </SectionCard>

      <SectionCard title="איך לחפש?">
        <View style={styles.switchRow}>
          <Pressable
            style={[styles.switchButton, searchMode === "gps" ? styles.switchButtonActive : null]}
            onPress={() => setSearchMode("gps")}
          >
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={18}
              color={searchMode === "gps" ? "#FFFFFF" : colors.text}
            />
            <Text style={[styles.switchText, searchMode === "gps" ? styles.switchTextActive : null]}>
              השתמש במיקום שלי
            </Text>
          </Pressable>

          <Pressable
            style={[styles.switchButton, searchMode === "city" ? styles.switchButtonActive : null]}
            onPress={() => setSearchMode("city")}
          >
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={18}
              color={searchMode === "city" ? "#FFFFFF" : colors.text}
            />
            <Text style={[styles.switchText, searchMode === "city" ? styles.switchTextActive : null]}>בחר עיר</Text>
          </Pressable>
        </View>

        {searchMode === "city" ? (
          <>
            <AutocompleteCityInput
              label="עיר לחיפוש"
              cities={cities}
              selectedCityId={searchCityId}
              onSelect={(city) => {
                setSearchCityId(city.id);
                setSearchStreet(null);
                setHouseNumber("");
              }}
            />

            <Text style={styles.helperText}>אפשר לבחור כל עיר או יישוב מתוך רשימת הערים המלאה של ישראל.</Text>

            <AutocompleteStreetInput
              label="רחוב לחיפוש"
              cityName={searchCity.name}
              selectedStreet={searchStreet}
              onSelect={setSearchStreet}
            />

            <TextInput
              value={houseNumber}
              onChangeText={setHouseNumber}
              placeholder="מספר בית"
              style={styles.input}
              keyboardType="number-pad"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.helperText}>
              הרחובות נטענים לפי העיר שבחרת. אם תבחר גם רחוב, התוצאות ימוין לפי מיקום מדויק יותר. אם לא תבחר
              רחוב, החיפוש יתבצע לפי מרכז העיר.
            </Text>
          </>
        ) : (
          <Text style={styles.helperText}>האפליקציה תבקש הרשאה ותחשב את הקרבה לפי המיקום האמיתי שלך.</Text>
        )}
      </SectionCard>

      <Pressable
        style={[
          styles.primaryButton,
          isLoadingLocation || availableEquipment.length === 0 || selectedEquipmentIds.length === 0
            ? styles.primaryButtonDisabled
            : null
        ]}
        onPress={handleSearch}
        disabled={isLoadingLocation || availableEquipment.length === 0 || selectedEquipmentIds.length === 0}
      >
        <MaterialCommunityIcons name="map-search-outline" size={20} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>{isLoadingLocation ? "מאתר מיקום..." : "חפש ציוד קרוב"}</Text>
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
    backgroundColor: colors.infoSoft,
    borderRadius: 28,
    padding: spacing.lg,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "#D4E4FF"
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22
  },
  equipmentSections: {
    gap: spacing.md
  },
  categorySection: {
    gap: spacing.sm
  },
  categoryHeader: {
    alignSelf: "flex-start",
    backgroundColor: colors.secondarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  categoryHeaderText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: "800"
  },
  equipmentButtonGroup: {
    gap: spacing.sm
  },
  equipmentButton: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14
  },
  equipmentButtonSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary
  },
  equipmentButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  equipmentButtonTextSelected: {
    color: colors.primary
  },
  switchRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  switchButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8
  },
  switchButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  switchText: {
    color: colors.text,
    fontWeight: "700"
  },
  switchTextActive: {
    color: "#FFFFFF"
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
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8
  },
  primaryButtonDisabled: {
    opacity: 0.5
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
  }
});
