import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import { errorMessage } from '../services/api';
import { colors } from '../theme';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === 'register';

  const submit = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      if (isRegister) await signUp(name, email, password);
      else await signIn(email, password);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logo}>
          <Text style={styles.logoText}>M</Text>
        </View>
        <Text style={styles.title}>Médico Amigo</Text>
        <Text style={styles.subtitle}>
          {isRegister ? 'Crie a sua conta para gerir os seus medicamentos.' : 'Inicie sessão para continuar.'}
        </Text>

        <View style={styles.form}>
          {isRegister && (
            <Field label="Nome" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
          )}
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <Field
            label="Palavra-passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            textContentType={isRegister ? 'newPassword' : 'password'}
          />
          {isRegister && <Text style={styles.hint}>Mínimo de 8 caracteres.</Text>}

          {error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}

          <Pressable accessibilityRole="button" onPress={submit} disabled={busy} style={styles.primary}>
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryText}>{isRegister ? 'Criar conta' : 'Entrar'}</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setError(null);
              setMode(isRegister ? 'login' : 'register');
            }}
            style={styles.link}
          >
            <Text style={styles.linkText}>
              {isRegister ? 'Já tenho conta · Entrar' : 'Ainda não tenho conta · Criar conta'}
            </Text>
          </Pressable>

          {__DEV__ && !isRegister && (
            <Text style={styles.demo}>Conta de demonstração: marta@example.com / medico1234</Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#5B6B66"
        style={styles.input}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 24, gap: 8 },
  logo: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.emerald, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  logoText: { color: colors.white, fontSize: 30, fontWeight: '800' },
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: colors.muted, fontWeight: '500', marginBottom: 16 },
  form: { gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: colors.muted },
  input: { height: 52, borderRadius: 16, backgroundColor: colors.white, paddingHorizontal: 16, fontSize: 16, color: colors.ink, borderWidth: 1, borderColor: colors.border },
  hint: { fontSize: 12, color: colors.muted, marginTop: -6 },
  error: { fontSize: 14, color: colors.danger, fontWeight: '600' },
  primary: { height: 52, borderRadius: 26, backgroundColor: colors.emerald, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  link: { height: 44, alignItems: 'center', justifyContent: 'center' },
  linkText: { color: colors.emeraldDark, fontSize: 14, fontWeight: '700' },
  demo: { fontSize: 12, color: colors.muted, textAlign: 'center' },
});