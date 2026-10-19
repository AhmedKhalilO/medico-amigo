import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import { api, errorMessage } from '../services/api';
import { colors, shadow } from '../theme';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, setUser, signOut } = useAuth();
  const [phone, setPhone] = useState(user?.doctorPhone ?? '');
  const [saving, setSaving] = useState(false);

  const dirty = phone.trim() !== (user?.doctorPhone ?? '');

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { user: updated } = await api.updateMe({ doctorPhone: phone.trim() || null });
      setUser(updated);
      Alert.alert('Guardado', 'O número do seu médico foi atualizado.');
    } catch (e) {
      Alert.alert('Não foi possível guardar', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.h1}>Perfil</Text>

        <View style={[styles.card, shadow.card]}>
          <Text style={styles.label}>Nome</Text>
          <Text style={styles.value}>{user?.name}</Text>
          <Text style={[styles.label, { marginTop: 12 }]}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>

        <View style={[styles.card, shadow.card]}>
          <Text style={styles.label}>Número do seu médico</Text>
          <TextInput
            accessibilityLabel="Número do seu médico"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+351 210 000 000"
            placeholderTextColor="#5B6B66"
            style={styles.input}
          />
          <Text style={styles.hint}>Usado pelo botão « Contactar médico » no ecrã Início.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={save}
            disabled={!dirty || saving}
            style={[styles.primary, (!dirty || saving) && { opacity: 0.5 }]}
          >
            {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Guardar</Text>}
          </Pressable>
        </View>

        <Pressable accessibilityRole="button" onPress={signOut} style={styles.logout}>
          <Text style={styles.logoutText}>Terminar sessão</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  card: { backgroundColor: colors.white, borderRadius: 24, padding: 18, gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: colors.muted },
  value: { fontSize: 16, fontWeight: '800', color: colors.ink },
  input: { height: 52, borderRadius: 16, backgroundColor: colors.bg, paddingHorizontal: 16, fontSize: 16, color: colors.ink, borderWidth: 1, borderColor: colors.border, marginTop: 4 },
  hint: { fontSize: 12, color: colors.muted },
  primary: { height: 48, borderRadius: 24, backgroundColor: colors.emerald, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  primaryText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  logout: { height: 48, borderRadius: 24, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  logoutText: { color: colors.danger, fontSize: 15, fontWeight: '800' },
});