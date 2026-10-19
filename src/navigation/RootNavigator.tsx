import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityScreen } from '../screens/ActivityScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MedicationsScreen } from '../screens/MedicationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { colors } from '../theme';

export type RootStackParamList = {
  Tabs: undefined;
  Scan: undefined;
};

type IconPair = { on: React.ComponentProps<typeof Ionicons>['name']; off: React.ComponentProps<typeof Ionicons>['name'] };

const ICONS: Record<string, IconPair> = {
  Início: { on: 'home', off: 'home-outline' },
  Receitas: { on: 'document-text', off: 'document-text-outline' },
  Atividade: { on: 'pulse', off: 'pulse-outline' },
  Perfil: { on: 'person', off: 'person-outline' },
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.emeraldDark,
        tabBarInactiveTintColor: '#4A5E57',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: styles.bar,
        tabBarIcon: ({ focused, color }) => (
          <View style={[styles.pill, focused && styles.pillActive]}>
            <Ionicons name={focused ? ICONS[route.name].on : ICONS[route.name].off} size={22} color={color} />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Início" component={HomeScreen} />
      <Tab.Screen name="Receitas" component={MedicationsScreen} />
      <Tab.Screen name="Atividade" component={ActivityScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="Scan" component={ScanScreen} options={{ presentation: 'fullScreenModal' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 84,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderTopWidth: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    elevation: 16,
    shadowColor: '#0F2A24',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -10 },
  },
  pill: { width: 56, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: colors.emeraldSoft },
});