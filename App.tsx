import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LoginScreen } from './src/screens/LoginScreen';
import { api } from './src/services/api';
import { setNumbers } from './src/services/intents';
import { colors } from './src/theme';

function Gate() {
  const { status, retry } = useAuth();

  // Numéros 112 / SNS 24 fournis par le backend (valeurs par défaut conservées si injoignable).
  useEffect(() => {
    api
      .config()
      .then((c) => setNumbers({ emergency: c.emergencyNumber, sns24: c.sns24Number }))
      .catch(() => {});
  }, []);

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.emerald} size="large" />
      </View>
    );
  }

  if (status === 'unreachable') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Sem ligação ao servidor</Text>
        <Text style={styles.text}>Verifique a rede e o endereço da API (EXPO_PUBLIC_API_URL).</Text>
        <Pressable accessibilityRole="button" onPress={retry} style={styles.button}>
          <Text style={styles.buttonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  if (status === 'signedOut') return <LoginScreen />;

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Gate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink },
  text: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  button: { height: 48, paddingHorizontal: 24, borderRadius: 24, backgroundColor: colors.emerald, justifyContent: 'center', marginTop: 8 },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
});