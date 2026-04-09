import React, { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
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
  const { selectedCity, runSearch } = useAppState();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(equipmentCatalog[0]?.id ?? "");
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
      <SectionCard title="מה אתה צריך?">
        <View style={styles.optionGroup}>
          {equipmentCatalog.map((item) => {
            const selected = item.id === selectedEquipmentId;

            return (
              <Pressable
                key={item.id}
                style={[styles.optionChip, selected ? styles.optionChipSelected : null]}
                onPress={() => setSelectedEquipmentId(item.id)}
              >
                <Text style={[styles.optionChipText, selected ? styles.optionChipTextSelected : null]}>
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>

      <SectionCard title="איך לחפש?">
        <View style={styles.switchRow}>
          <Pressable
            style={[styles.switchButton, searchMode === "gps" ? styles.switchButtonActive : null]}
            onPress={() => setSearchMode("gps")}
          >
            <Text style={[styles.switchText, searchMode === "gps" ? styles.switchTextActive : null]}>
              השתמש במיקום שלי
            </Text>
          </Pressable>

          <Pressable
            style={[styles.switchButton, searchMode === "city" ? styles.switchButtonActive : null]}
            onPress={() => setSearchMode("city")}
          >
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

      <Pressable style={styles.primaryButton} onPress={handleSearch} disabled={isLoadingLocation}>
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
  optionGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  optionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  optionChipSelected: {
    borderColor: colors.secondary,
    backgroundColor: "#FFF1D6"
  },
  optionChipText: {
    color: colors.text,
    fontWeight: "600"
  },
  optionChipTextSelected: {
    color: colors.secondary
  },
  switchRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  switchButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center"
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
