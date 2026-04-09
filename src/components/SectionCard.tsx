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
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text
  }
});
