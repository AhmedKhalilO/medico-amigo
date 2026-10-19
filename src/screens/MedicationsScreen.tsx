import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fab } from '../components/Fab';
import { MedicationCard } from '../components/MedicationCard';
import type { Medication } from '../data/medications';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { api, errorMessage } from '../services/api';
import { colors } from '../theme';

const FILTERS = ['Todos', 'Comprimidos', 'Xaropes'] as const;
type Filter = (typeof FILTERS)[number];

export function MedicationsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('Todos');

  const load = useCallback(async () => {
    try {
      setMeds(await api.medications());
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Recharge à chaque fois que l'onglet reprend le focus (ex. après l'ajout d'un médicament).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    return meds.filter((m) => {
      const byText = !q || m.name.toLowerCase().includes(q);
      const byKind =
        filter === 'Todos' || (filter === 'Xaropes' ? m.kind === 'syrup' : m.kind !== 'syrup');
      return byText && byKind;
    });
  }, [meds, query, filter]);

  const lowCount = meds.filter((m) => m.remaining / m.total < 0.35).length;

  const onRefill = async (m: Medication) => {
    try {
      await api.refill(m.id);
      Alert.alert('Reposição pedida', `O pedido de ${m.name} foi enviado para análise.`);
    } catch (e) {
      Alert.alert('Não foi possível pedir a reposição', errorMessage(e));
    }
  };

  const onInfo = (m: Medication) =>
    Alert.alert(
      m.name,
      [
        m.subtitle,
        m.times.length ? `Horários: ${m.times.join(', ')}` : null,
        m.expiry ? `Validade: ${m.expiry}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.h1}>Os meus medicamentos</Text>
          <Text style={styles.sub}>
            {meds.length} ativos · {lowCount} a reabastecer
          </Text>
        </View>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput
          accessibilityLabel="Pesquisar medicamento"
          placeholder="Pesquisar medicamento"
          placeholderTextColor="#5B6B66"
          value={query}
          onChangeText={setQuery}
          style={styles.input}
        />
      </View>

      <View style={styles.chips}>
        {FILTERS.map((f) => {
          const active = f === filter;
          return (
            <Pressable
              key={f}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setFilter(f)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && { color: colors.white }]}>{f}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ gap: 14, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
          renderItem={({ item }) => <MedicationCard med={item} onRefill={onRefill} onInfo={onInfo} />}
          ListEmptyComponent={
            <Text style={styles.empty}>{error ?? 'Nenhum medicamento encontrado.'}</Text>
          }
        />
      )}

      <Fab
        label="Registar novo medicamento"
        icon="add-circle"
        background={colors.emerald}
        foreground={colors.white}
        onPress={() => nav.navigate('Scan')}
        style={{ right: 20, bottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  sub: { fontSize: 14, color: colors.muted, fontWeight: '500', marginTop: 2 },
  search: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    elevation: 3,
  },
  input: { flex: 1, fontSize: 15, color: colors.ink },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.ink },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 32 },
});