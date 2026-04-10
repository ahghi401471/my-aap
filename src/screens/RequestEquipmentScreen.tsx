import React, { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AutocompleteCityInput } from "../components/AutocompleteCityInput";
import { SectionCard } from "../components/SectionCard";
import { spacing } from "../constants/spacing";
import { cities, equipmentCatalog, useAppState } from "../hooks/useAppState";
import { RootStackParamList } from "../navigation/AppNavigator";
import { SearchMode } from "../types/models";
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
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(availableEquipment[0]?.id ?? "");
  const [searchMode, setSearchMode] = useState<SearchMode>("city");
  const [searchCityId, setSearchCityId] = useState(selectedCity.id);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  async function handleSearch() {
    if (!selectedEquipmentId) {
      return;
    }

    if (searchMode === "gps") {
      try {
        setIsLoadingLocation(true);
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!permission.granted) {
          Alert.alert("גישה למיקום נדחתה", "אפשר לבחור במקום זה עיר לחיפוש.");
          return;
        }

        const currentPosition = await Location.getCurrentPositionAsync({});

        runSearch({
          equipmentId: selectedEquipmentId,
          searchMode: "gps",
          lat: currentPosition.coords.latitude,
          lng: currentPosition.coords.longitude
        });
      } catch (error) {
        Alert.alert("לא הצלחנו לאתר מיקום", "נסה שוב או עבור לבחירת עיר.");
        return;
      } finally {
        setIsLoadingLocation(false);
      }
    } else {
      runSearch({
        equipmentId: selectedEquipmentId,
        searchMode: "city",
        cityId: searchCityId
      });
    }

    navigation.navigate("Results");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>מבקשים ציוד לפי מיקום</Text>
        <Text style={styles.heroSubtitle}>
          בחר ציוד, בחר GPS או עיר, ונציג קודם את האנשים הכי קרובים אליך.
        </Text>
      </View>

      <SectionCard title="מה אתה צריך?">
        <Text style={styles.helperText}>
          כאן מוצגים רק סוגי הציוד שהגדרת בפרופיל שלך. בחר בלחיצה אחת את מה שאתה צריך.
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
                  const selected = item.id === selectedEquipmentId;

                  return (
                    <Pressable
                      key={item.id}
                      style={[styles.equipmentButton, selected ? styles.equipmentButtonSelected : null]}
                      onPress={() => setSelectedEquipmentId(item.id)}
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
            <Text style={[styles.switchText, searchMode === "city" ? styles.switchTextActive : null]}>
              בחר עיר
            </Text>
          </Pressable>
        </View>

        {searchMode === "city" ? (
          <AutocompleteCityInput
            label="עיר לחיפוש"
            cities={cities}
            selectedCityId={searchCityId}
            onSelect={(city) => setSearchCityId(city.id)}
          />
        ) : (
          <Text style={styles.helperText}>
            האפליקציה תבקש הרשאה ותחשב את הקרבה לפי המיקום האמיתי שלך.
          </Text>
        )}
      </SectionCard>

      <Pressable
        style={[
          styles.primaryButton,
          isLoadingLocation || availableEquipment.length === 0 ? styles.primaryButtonDisabled : null
        ]}
        onPress={handleSearch}
        disabled={isLoadingLocation || availableEquipment.length === 0}
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
