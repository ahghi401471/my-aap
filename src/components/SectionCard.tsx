import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { spacing } from "../constants/spacing";
import { colors } from "../theme/colors";

export function SectionCard({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerAccent} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  headerAccent: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.secondary
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.text
  }
});
