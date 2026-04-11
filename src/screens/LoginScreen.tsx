import React, { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { SectionCard } from "../components/SectionCard";
import { spacing } from "../constants/spacing";
import { useAppState } from "../hooks/useAppState";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { loginCurrentUser } = useAppState();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      Alert.alert("חסרים פרטים", "הכנס שם משתמש וסיסמה.");
      return;
    }

    setIsSubmitting(true);

    try {
      await loginCurrentUser(username.trim(), password.trim());
      navigation.reset({
        index: 0,
        routes: [{ name: "Profile" }]
      });
    } catch (error) {
      Alert.alert("הכניסה נכשלה", "בדוק את שם המשתמש, הסיסמה והחיבור לשרת.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>ציוד סוכרת קרוב אליך</Text>
        <Text style={styles.heroTitle}>כניסה למשתמש קיים</Text>
        <Text style={styles.heroSubtitle}>אם כבר נרשמת, אפשר להיכנס כאן עם שם משתמש וסיסמה.</Text>
      </View>

      <SectionCard title="כניסה">
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="שם משתמש"
          autoCapitalize="none"
          style={styles.input}
          placeholderTextColor={colors.muted}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="סיסמה"
          secureTextEntry
          style={styles.input}
          placeholderTextColor={colors.muted}
        />

        <Pressable
          style={[styles.primaryButton, !username.trim() || !password.trim() || isSubmitting ? styles.buttonDisabled : null]}
          disabled={!username.trim() || !password.trim() || isSubmitting}
          onPress={handleLogin}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>כניסה</Text>
          )}
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("Register")}>
          <Text style={styles.secondaryButtonText}>אין לך חשבון? להרשמה</Text>
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
    backgroundColor: colors.primarySoft,
    borderRadius: 28,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "#C8ECDD"
  },
  heroEyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700"
  },
  heroTitle: {
    fontSize: 31,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right"
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.muted,
    lineHeight: 24,
    textAlign: "right"
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
    color: colors.text,
    fontSize: 16
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56
  },
  buttonDisabled: {
    opacity: 0.5
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
    alignItems: "center"
  },
  secondaryButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: "700"
  }
});
