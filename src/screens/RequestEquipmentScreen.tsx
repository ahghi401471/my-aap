import React, { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AutocompleteCityInput } from "../components/AutocompleteCityInput";
import { EquipmentPicker } from "../components/EquipmentPicker";
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
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>מבקשים ציוד לפי מיקום</Text>
        <Text style={styles.heroSubtitle}>
          בחר ציוד, בחר GPS או עיר, ונציג קודם את האנשים הכי קרובים אליך.
        </Text>
      </View>

      <SectionCard title="מה אתה צריך?">
        <Text style={styles.helperText}>
          בחר פריט אחד מהרשימה. אפשר לחפש לפי שם האינסולין, הסנסור, המשאבה או סוג הציוד.
        </Text>
        <EquipmentPicker
          items={equipmentCatalog}
          selectedIds={selectedEquipmentId ? [selectedEquipmentId] : []}
          onToggle={(equipmentId) => setSelectedEquipmentId(equipmentId)}
          label="חיפוש ציוד מבוקש"
          multiSelect={false}
        />
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
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center"
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
  }
});
