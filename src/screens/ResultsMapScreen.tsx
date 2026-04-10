import React, { useMemo } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { spacing } from "../constants/spacing";
import { useAppState } from "../hooks/useAppState";
import { RootStackParamList } from "../navigation/AppNavigator";
import { SearchResult } from "../types/models";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "ResultsMap">;

type MarkerPoint = {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
};

export function ResultsMapScreen({}: Props) {
  const { searchResults } = useAppState();

  const markerPoints = useMemo(() => {
    const grouped = searchResults.reduce<Record<string, SearchResult[]>>((accumulator, result) => {
      if (!accumulator[result.user.id]) {
        accumulator[result.user.id] = [];
      }

      accumulator[result.user.id].push(result);
      return accumulator;
    }, {});

    return Object.values(grouped)
      .map<MarkerPoint | null>((resultsForUser) => {
        const firstResult = resultsForUser[0];
        const hasStreetPoint =
          firstResult.locationSource !== "temporary" &&
          firstResult.user.address &&
          firstResult.user.address.cityId === firstResult.user.cityId;

        const latitude = hasStreetPoint ? firstResult.user.address!.lat : firstResult.city.lat;
        const longitude = hasStreetPoint ? firstResult.user.address!.lng : firstResult.city.lng;
        const matchingEquipment = resultsForUser.map((result) => result.equipment.name).join(", ");

        if (typeof latitude !== "number" || typeof longitude !== "number") {
          return null;
        }

        return {
          id: firstResult.user.id,
          title: firstResult.user.fullName,
          description: `${firstResult.city.name} | ${matchingEquipment}`,
          latitude,
          longitude
        };
      })
      .filter((point): point is MarkerPoint => point !== null);
  }, [searchResults]);

  const initialRegion = useMemo(() => {
    const firstPoint = markerPoints[0];

    if (!firstPoint) {
      return {
        latitude: 31.7683,
        longitude: 35.2137,
        latitudeDelta: 1.5,
        longitudeDelta: 1.5
      };
    }

    return {
      latitude: firstPoint.latitude,
      longitude: firstPoint.longitude,
      latitudeDelta: 0.25,
      longitudeDelta: 0.25
    };
  }, [markerPoints]);

  if (markerPoints.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>אין תוצאות להצגה על המפה</Text>
        <Text style={styles.emptyText}>בצע קודם חיפוש ציוד ואז פתח את המפה.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        {markerPoints.map((point) => (
          <Marker
            key={point.id}
            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
            title={point.title}
            description={point.description}
          />
        ))}
      </MapView>
      <View style={styles.footer}>
        <Text style={styles.footerText}>הפינים מציגים את כל התוצאות שנמצאו לפי הקרבה לחיפוש האחרון.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  map: {
    flex: 1
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  footerText: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.background,
    gap: spacing.sm
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800"
  },
  emptyText: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22
  }
});
