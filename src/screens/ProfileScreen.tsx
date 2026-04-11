import React from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { RootStackParamList } from "../navigation/AppNavigator";
import { SectionCard } from "../components/SectionCard";
import { equipmentCatalog, useAppState } from "../hooks/useAppState";
import { colors } from "../theme/colors";
import { spacing } from "../constants/spacing";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export function ProfileScreen({ navigation }: Props) {
  const { activeTemporaryCity, clearTemporaryLocation, currentUser, deleteCurrentUser, selectedCity } = useAppState();
  const myEquipment = equipmentCatalog.filter((item) => currentUser.equipmentIds.includes(item.id));
  const groupedEquipment = myEquipment.reduce<Record<string, typeof myEquipment>>((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }

    groups[item.category].push(item);
    return groups;
  }, {});
  const orderedCategories = Object.keys(groupedEquipment).sort((left, right) => left.localeCompare(right, "he"));

  const activeTemporaryLocation = currentUser.temporaryLocation
    ? new Date(currentUser.temporaryLocation.expiresAt).getTime() > Date.now()
      ? currentUser.temporaryLocation
      : undefined
    : undefined;

  function handleDeleteAccount() {
    Alert.alert("למחוק את החשבון?", "המשתמש והציוד שלו יימחקו מהמערכת ותועבר למסך ההרשמה.", [
      {
        text: "ביטול",
        style: "cancel"
      },
      {
        text: "מחק חשבון",
        style: "destructive",
        onPress: async () => {
          await deleteCurrentUser();
          navigation.reset({
            index: 0,
            routes: [{ name: "Register" }]
          });
        }
      }
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.topActions}>
          <Pressable style={styles.topMiniButton} onPress={() => navigation.navigate("Register")}>
            <MaterialCommunityIcons name="account-edit-outline" size={16} color={colors.secondary} />
            <Text style={styles.topMiniButtonText}>עריכת פרופיל</Text>
          </Pressable>
          <Pressable style={styles.topMiniButton} onPress={() => navigation.navigate("TemporaryLocation")}>
            <MaterialCommunityIcons name="map-marker-check-outline" size={16} color={colors.secondary} />
            <Text style={styles.topMiniButtonText}>מיקום זמני</Text>
          </Pressable>
        </View>
        <Text style={styles.heroEyebrow}>ברוך הבא</Text>
        <Text style={styles.heroTitle}>{currentUser.fullName || "משתמש חדש"}</Text>
        <Text style={styles.heroSubtitle}>בקשת ציוד, עריכת פרופיל ועדכון מיקום זמני במקום אחד.</Text>
      </View>

      <SectionCard title="פרטי משתמש">
        <View style={styles.row}>
          <Text style={styles.value}>{currentUser.fullName || "לא הוגדר"}</Text>
          <Text style={styles.label}>שם</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.value}>{currentUser.username || "לא הוגדר"}</Text>
          <Text style={styles.label}>שם משתמש</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.value}>{currentUser.phoneNumber || "לא הוגדר"}</Text>
          <Text style={styles.label}>פלאפון</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.value}>{selectedCity.name}</Text>
          <Text style={styles.label}>עיר</Text>
        </View>
        <View style={styles.addressBlock}>
          <Text style={styles.label}>כתובת מגורים</Text>
          <Text style={styles.addressValue}>
            {currentUser.address
              ? `${currentUser.address.streetName}${currentUser.address.houseNumber ? ` ${currentUser.address.houseNumber}` : ""}`
              : "עדיין לא הוגדרה כתובת מדויקת"}
          </Text>
        </View>
        {activeTemporaryLocation && activeTemporaryCity ? (
          <>
            <View style={styles.row}>
              <Text style={styles.value}>{activeTemporaryCity.name}</Text>
              <Text style={styles.label}>מיקום זמני</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.value}>{activeTemporaryLocation.durationHours} שעות</Text>
              <Text style={styles.label}>משך הדיווח</Text>
            </View>
          </>
        ) : null}
      </SectionCard>

      <SectionCard title="הציוד שמוגדר בפרופיל">
        <Text style={styles.equipmentIntro}>
          זה הציוד שמשמש גם כדי שאנשים אחרים ימצאו אותך, וגם כדי להציג לך רק ציוד רלוונטי במסך חיפוש ציוד.
        </Text>

        {orderedCategories.length === 0 ? (
          <Text style={styles.emptyEquipment}>עדיין לא הוגדר ציוד בפרופיל.</Text>
        ) : (
          orderedCategories.map((category) => (
            <View key={category} style={styles.equipmentSection}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{category}</Text>
              </View>

              <View style={styles.equipmentWrap}>
                {groupedEquipment[category].map((item) => (
                  <View key={item.id} style={styles.equipmentChip}>
                    <Text style={styles.equipmentChipText}>{item.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard title="פעולות">
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("RequestEquipment")}>
          <MaterialCommunityIcons name="magnify" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>חיפוש ובקשת ציוד</Text>
        </Pressable>

        <View style={styles.temporaryBlock}>
          <Text style={styles.temporaryTitle}>מיקום זמני</Text>
          <Text style={styles.temporarySubtitle}>עדכון זמני לעיר אחרת מופיע כאן מתחת לאזור החיפוש.</Text>

          {activeTemporaryLocation && activeTemporaryCity ? (
            <View style={styles.temporaryInfo}>
              <Text style={styles.temporaryInfoText}>
                פעיל עכשיו: {activeTemporaryCity.name} למשך {activeTemporaryLocation.durationHours} שעות
              </Text>
            </View>
          ) : (
            <View style={styles.temporaryInfo}>
              <Text style={styles.temporaryInfoText}>אין כרגע מיקום זמני פעיל</Text>
            </View>
          )}

          <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("TemporaryLocation")}>
            <MaterialCommunityIcons name="map-marker-plus-outline" size={18} color={colors.secondary} />
            <Text style={styles.secondaryButtonText}>הגדרת מיקום זמני</Text>
          </Pressable>

          {activeTemporaryLocation ? (
            <Pressable style={styles.ghostButton} onPress={clearTemporaryLocation}>
              <MaterialCommunityIcons name="map-marker-remove-outline" size={18} color={colors.text} />
              <Text style={styles.ghostButtonText}>נקה מיקום זמני</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("MyEquipment")}>
          <MaterialCommunityIcons name="playlist-edit" size={18} color={colors.secondary} />
          <Text style={styles.secondaryButtonText}>עריכת ציוד קיים</Text>
        </Pressable>

        <Pressable style={styles.deleteButton} onPress={handleDeleteAccount}>
          <MaterialCommunityIcons name="delete-outline" size={18} color="#FFFFFF" />
          <Text style={styles.deleteButtonText}>מחק חשבון</Text>
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
    backgroundColor: colors.secondarySoft,
    borderRadius: 28,
    padding: spacing.lg,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "#F2D5B8"
  },
  topActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  topMiniButton: {
    backgroundColor: "#FFF8EF",
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#F2D5B8",
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  topMiniButtonText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: "700"
  },
  heroEyebrow: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right"
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right"
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
    textAlign: "right"
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs
  },
  addressBlock: {
    gap: 6,
    paddingVertical: spacing.xs
  },
  label: {
    color: colors.muted,
    fontWeight: "600"
  },
  value: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700"
  },
  addressValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700"
  },
  equipmentIntro: {
    color: colors.muted,
    lineHeight: 22
  },
  emptyEquipment: {
    color: colors.muted,
    fontWeight: "600"
  },
  equipmentSection: {
    gap: spacing.sm
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999
  },
  categoryBadgeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800"
  },
  equipmentWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  equipmentChip: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  equipmentChipText: {
    color: colors.text,
    fontWeight: "700"
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
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
  },
  secondaryButton: {
    backgroundColor: colors.secondarySoft,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8
  },
  temporaryBlock: {
    gap: spacing.sm,
    backgroundColor: colors.infoSoft,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#D4E4FF"
  },
  temporaryTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800"
  },
  temporarySubtitle: {
    color: colors.muted,
    lineHeight: 21
  },
  temporaryInfo: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  temporaryInfoText: {
    color: colors.text,
    fontWeight: "600"
  },
  ghostButton: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  secondaryButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: "700"
  },
  ghostButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  deleteButton: {
    backgroundColor: "#C74242",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
  }
});
