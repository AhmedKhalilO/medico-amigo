import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrescriptionRequest, RequestStatus, api, errorMessage } from '../services/api';
import { colors, shadow } from '../theme';

const STATUS: Record<RequestStatus, { label: string; bg: string; fg: string }> = {
  IN_REVIEW: { label: 'Em análise', bg: colors.yellowSoft, fg: colors.yellowInk },
  APPROVED: { label: 'Aprovado', bg: colors.blueSoft, fg: colors.blueInk },
  READY: { label: 'Pronto', bg: colors.emeraldSoft, fg: colors.emeraldDark },
  COLLECTED: { label: 'Levantado', bg: '#E5E7EB', fg: '#374151' },
};

export function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<PrescriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await api.prescriptions());
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.h1}>Atividade</Text>
      <Text style={styles.sub}>Os seus pedidos de reposição</Text>

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
          renderItem={({ item }) => {
            const s = STATUS[item.status];
            return (
              <View style={[styles.card, shadow.card]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.medicationName}</Text>
                  <Text style={styles.date}>
                    Pedido a {new Date(item.createdAt).toLocaleDateString('pt-PT')}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.badgeText, { color: s.fg }]}>{s.label}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>{error ?? 'Ainda não fez nenhum pedido de reposição.'}</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, gap: 12 },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  sub: { fontSize: 14, color: colors.muted, fontWeight: '500', marginBottom: 8 },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 15, fontWeight: '800', color: colors.ink },
  date: { fontSize: 12, color: colors.muted, fontWeight: '600', marginTop: 2 },
  badge: { height: 30, paddingHorizontal: 12, borderRadius: 15, justifyContent: 'center' },
  badgeText: { fontSize: 12, fontWeight: '800' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 32 },
});