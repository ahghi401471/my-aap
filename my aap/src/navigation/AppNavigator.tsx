import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AppStateProvider } from "../hooks/useAppState";
import { colors } from "../theme/colors";
import { MyEquipmentScreen } from "../screens/MyEquipmentScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { RequestEquipmentScreen } from "../screens/RequestEquipmentScreen";
import { ResultsScreen } from "../screens/ResultsScreen";

export type RootStackParamList = {
  Register: undefined;
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

export function AppNavigator() {
  return (
    <AppStateProvider>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          initialRouteName="Register"
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.background }
          }}
        >
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "הרשמה" }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "פרופיל משתמש" }} />
          <Stack.Screen name="MyEquipment" component={MyEquipmentScreen} options={{ title: "הציוד שלי" }} />
          <Stack.Screen
            name="RequestEquipment"
            component={RequestEquipmentScreen}
            options={{ title: "פתיחת בקשה לציוד" }}
          />
          <Stack.Screen name="Results" component={ResultsScreen} options={{ title: "תוצאות לפי קרבה" }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppStateProvider>
  );
}
