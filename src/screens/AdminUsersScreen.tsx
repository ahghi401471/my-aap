import React, { useEffect, useMemo, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AutocompleteCityInput } from "../components/AutocompleteCityInput";
import { EquipmentPicker } from "../components/EquipmentPicker";
import { SectionCard } from "../components/SectionCard";
import { spacing } from "../constants/spacing";
import { cities, equipmentCatalog, useAppState } from "../hooks/useAppState";
import { RootStackParamList } from "../navigation/AppNavigator";
import { AdminUserRow, createAdminUser, deleteAdminUser, listAdminUsers } from "../services/api";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "AdminUsers">;

export function AdminUsersScreen({}: Props) {
  const { currentUser } = useAppState();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cityId, setCityId] = useState(cities[0]?.id ?? "");
  const [equipmentIds, setEquipmentIds] = useState<string[]>([]);

  const canSubmit = useMemo(
    () =>
      !!fullName.trim() &&
      !!username.trim() &&
      password.trim().length >= 6 &&
      !!phoneNumber.trim() &&
      !!cityId &&
      equipmentIds.length > 0,
    [cityId, equipmentIds.length, fullName, password, phoneNumber, username]
  );

  async function loadUsers() {
    setIsLoading(true);
    try {
      const rows = await listAdminUsers(currentUser.id);
      setUsers(rows);
    } catch (error) {
      Alert.alert("שגיאה", "לא הצלחנו לטעון את רשימת המשתמשים.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreateUser() {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createAdminUser({
        requesterUserId: currentUser.id,
        fullName: fullName.trim(),
        username: username.trim(),
        password: password.trim(),
        phoneNumber: phoneNumber.trim(),
        cityId,
        equipmentIds
      });

      setFullName("");
      setUsername("");
      setPassword("");
      setPhoneNumber("");
      setEquipmentIds([]);
      await loadUsers();
      Alert.alert("נשמר", "המשתמש נוסף בהצלחה.");
    } catch (error) {
      Alert.alert("שגיאה", "לא הצלחנו להוסיף משתמש. בדוק ששם המשתמש פנוי.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDeleteUser(user: AdminUserRow) {
    Alert.alert("להסיר משתמש?", `${user.fullName} יוסר מהמערכת.`, [
      { text: "ביטול", style: "cancel" },
      {
        text: "הסר",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAdminUser(user.id, currentUser.id);
            await loadUsers();
          } catch (error) {
            Alert.alert("שגיאה", "לא הצלחנו להסיר את המשתמש.");
          }
        }
      }
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionCard title="הוספת משתמש חדש">
        <TextInput value={fullName} onChangeText={setFullName} style={styles.input} placeholder="שם מלא" placeholderTextColor={colors.muted} />
        <TextInput value={username} onChangeText={setUsername} style={styles.input} placeholder="שם משתמש" autoCapitalize="none" placeholderTextColor={colors.muted} />
        <TextInput value={password} onChangeText={setPassword} style={styles.input} placeholder="סיסמה (לפחות 6)" secureTextEntry placeholderTextColor={colors.muted} />
        <TextInput value={phoneNumber} onChangeText={setPhoneNumber} style={styles.input} placeholder="פלאפון" keyboardType="phone-pad" placeholderTextColor={colors.muted} />

        <AutocompleteCityInput label="עיר" cities={cities} selectedCityId={cityId} onSelect={(city) => setCityId(city.id)} />

        <EquipmentPicker items={equipmentCatalog} selectedIds={equipmentIds} onChange={setEquipmentIds} label="ציוד" />

        <Pressable style={[styles.primaryButton, !canSubmit || isSubmitting ? styles.disabled : null]} onPress={handleCreateUser} disabled={!canSubmit || isSubmitting}>
          <Text style={styles.primaryButtonText}>{isSubmitting ? "שומר..." : "הוסף משתמש"}</Text>
        </Pressable>
      </SectionCard>

      <SectionCard title="ניהול משתמשים קיימים">
        <Pressable style={[styles.secondaryButton, isLoading ? styles.disabled : null]} onPress={loadUsers} disabled={isLoading}>
          <Text style={styles.secondaryButtonText}>{isLoading ? "טוען..." : "רענן רשימה"}</Text>
        </Pressable>

        {users.map((user) => {
          const cityName = cities.find((city) => city.id === user.cityId)?.name ?? user.cityId;
          return (
            <View key={user.id} style={styles.userRow}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.fullName}</Text>
                <Text style={styles.userMeta}>@{user.username} · {cityName}</Text>
                <Text style={styles.userMeta}>{user.phoneNumber}</Text>
              </View>
              <Pressable style={styles.deleteButton} onPress={() => handleDeleteUser(user)}>
                <Text style={styles.deleteButtonText}>הסר</Text>
              </Pressable>
            </View>
          );
        })}

        {users.length === 0 ? <Text style={styles.emptyText}>אין משתמשים להצגה.</Text> : null}
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 14
  },
  primaryButtonText: { color: "#FFF", fontWeight: "700" },
  secondaryButton: {
    backgroundColor: colors.secondarySoft,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 12
  },
  secondaryButtonText: { color: colors.secondary, fontWeight: "700" },
  disabled: { opacity: 0.5 },
  userRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  userInfo: { flex: 1, gap: 2 },
  userName: { color: colors.text, fontWeight: "800", fontSize: 16 },
  userMeta: { color: colors.muted },
  deleteButton: {
    backgroundColor: "#FCE8E8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  deleteButtonText: { color: "#B42318", fontWeight: "700" },
  emptyText: { color: colors.muted }
});
