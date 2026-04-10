import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { spacing } from "../constants/spacing";
import { searchStreets } from "../services/streets";
import { colors } from "../theme/colors";
import { StreetSuggestion } from "../types/models";

type Props = {
  label: string;
  cityName?: string;
  selectedStreet?: StreetSuggestion | null;
  onSelect: (street: StreetSuggestion | null) => void;
};

export function AutocompleteStreetInput({ label, cityName, selectedStreet, onSelect }: Props) {
  const [query, setQuery] = useState(selectedStreet?.name ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streets, setStreets] = useState<StreetSuggestion[]>([]);
  const previousCityName = useRef(cityName);

  useEffect(() => {
    setQuery(selectedStreet?.name ?? "");
  }, [selectedStreet?.id, selectedStreet?.name]);

  useEffect(() => {
    if (previousCityName.current === cityName) {
      return;
    }

    previousCityName.current = cityName;
    setQuery("");
    setStreets([]);
    setIsOpen(false);
    onSelect(null);
  }, [cityName, onSelect]);

  useEffect(() => {
    let active = true;

    if (!cityName || query.trim().length < 2) {
      setStreets([]);
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    setIsLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const nextStreets = await searchStreets(cityName, query);

        if (active) {
          setStreets(nextStreets);
        }
      } catch (error) {
        if (active) {
          setStreets([]);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [cityName, query]);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={query}
        editable={Boolean(cityName)}
        onChangeText={(value) => {
          setQuery(value);
          setIsOpen(true);
          onSelect(null);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={cityName ? "התחל להקליד רחוב" : "בחר קודם עיר"}
        style={[styles.input, !cityName ? styles.inputDisabled : null]}
        placeholderTextColor={colors.muted}
      />

      {isOpen && cityName ? (
        <View style={styles.dropdown}>
          {isLoading ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.statusText}>מחפש רחובות...</Text>
            </View>
          ) : streets.length > 0 ? (
            streets.map((street) => (
              <Pressable
                key={street.id}
                style={styles.option}
                onPress={() => {
                  setQuery(street.name);
                  setIsOpen(false);
                  onSelect(street);
                }}
              >
                <Text style={styles.optionText}>{street.name}</Text>
                <Text style={styles.optionSubtext}>{street.cityName}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyText}>לא נמצאו רחובות תואמים בעיר שנבחרה</Text>
          )}
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
  inputDisabled: {
    opacity: 0.6
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.md
  },
  statusText: {
    color: colors.muted,
    fontWeight: "600"
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 2
  },
  optionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  optionSubtext: {
    color: colors.muted,
    fontSize: 13
  },
  emptyText: {
    padding: spacing.md,
    color: colors.muted,
    textAlign: "center"
  }
});
