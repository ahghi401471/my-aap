import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

import { AppStateProvider, useAppState } from "../hooks/useAppState";
import { colors } from "../theme/colors";
import { MyEquipmentScreen } from "../screens/MyEquipmentScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { RequestEquipmentScreen } from "../screens/RequestEquipmentScreen";
import { ResultsScreen } from "../screens/ResultsScreen";
import { TemporaryLocationScreen } from "../screens/TemporaryLocationScreen";

export type RootStackParamList = {
  Register: undefined;
  TemporaryLocation: undefined;
  Profile: undefined;
  MyEquipment: undefined;
  RequestEquipment: undefined;
  Results: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    primary: colors.primary,
    border: colors.border
  }
};

function NavigatorContent() {
  const { hasCompletedRegistration, isHydrated } = useAppState();

  if (!isHydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName={hasCompletedRegistration ? "Profile" : "Register"}
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background }
        }}
      >
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: "הרשמה", headerShown: !hasCompletedRegistration }}
        />
        <Stack.Screen
          name="TemporaryLocation"
          component={TemporaryLocationScreen}
          options={{ title: "מיקום זמני" }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: "דף הבית", headerBackVisible: false }}
        />
        <Stack.Screen name="MyEquipment" component={MyEquipmentScreen} options={{ title: "הציוד שלי" }} />
        <Stack.Screen
          name="RequestEquipment"
          component={RequestEquipmentScreen}
          options={{ title: "פתיחת בקשה לציוד" }}
        />
        <Stack.Screen name="Results" component={ResultsScreen} options={{ title: "תוצאות לפי קרבה" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export function AppNavigator() {
  return (
    <AppStateProvider>
      <NavigatorContent />
    </AppStateProvider>
  );
}
