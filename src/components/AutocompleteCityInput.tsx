import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { City } from "../types/models";
import { spacing } from "../constants/spacing";
import { colors } from "../theme/colors";

type Props = {
  label: string;
  cities: City[];
  selectedCityId?: string;
  onSelect: (city: City) => void;
};

export function AutocompleteCityInput({ label, cities, selectedCityId, onSelect }: Props) {
  const selectedCity = cities.find((city) => city.id === selectedCityId);
  const [query, setQuery] = useState(selectedCity?.name ?? "");
  const [isOpen, setIsOpen] = useState(false);

  const filteredCities = useMemo(() => {
    if (!query.trim()) {
      return cities.slice(0, 8);
    }

    return cities.filter((city) => city.name.includes(query.trim())).slice(0, 8);
  }, [cities, query]);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={query}
        onChangeText={(value) => {
          setQuery(value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="התחל להקליד עיר"
        style={styles.input}
        placeholderTextColor={colors.muted}
      />
      {isOpen ? (
        <View style={styles.dropdown}>
          {filteredCities.map((city) => (
            <Pressable
              key={city.id}
              style={styles.option}
              onPress={() => {
                setQuery(city.name);
                setIsOpen(false);
                onSelect(city);
              }}
            >
              <Text style={styles.optionText}>{city.name}</Text>
            </Pressable>
          ))}
          {filteredCities.length === 0 ? <Text style={styles.emptyText}>לא נמצאו ערים</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs
  },
  label: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: "600"
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
    color: colors.text,
    fontSize: 16,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  dropdown: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  optionText: {
    color: colors.text,
    fontSize: 16
  },
  emptyText: {
    padding: spacing.md,
    color: colors.muted,
    textAlign: "center"
  }
});
