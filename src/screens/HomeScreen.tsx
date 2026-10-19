import React, { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { useAuth } from '../auth/AuthContext';
import { EmergencyShortcuts } from '../components/EmergencyShortcuts';
import { Fab } from '../components/Fab';
import { Dashboard, api, errorMessage, startOfTodayIso } from '../services/api';
import { callDoctor } from '../services/intents';
import { colors, shadow } from '../theme';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 20) return 'Boa tarde';
  return 'Boa noite';
}

const W = 196;
const H = 70;
const PAD = 6;

/** Construit la courbe à partir de la série de 7 jours renvoyée par le backend. */
function buildChart(series: number[]) {
  const values = series.length >= 2 ? series : [0, 0];
  const max = Math.max(1, ...values);
  const step = (W - PAD * 2) / (values.length - 1);
  const pts = values.map((v, i) => ({
    x: PAD + i * step,
    y: H - PAD - (v / max) * (H - PAD * 2 - 4),
  }));
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return { line, area: `${line} L${last.x.toFixed(1)} ${H} L${pts[0].x.toFixed(1)} ${H} Z`, last };
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api.dashboard(startOfTodayIso()));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const takeDose = async () => {
    if (!data?.nextDose) return;
    try {
      await api.takeDose(data.nextDose.medicationId);
      await load();
    } catch (e) {
      Alert.alert('Não foi possível registar a toma', errorMessage(e));
    }
  };

  const req = data?.requests;
  const chart = buildChart(req?.series ?? []);
  const next = data?.nextDose;
  const ready = data?.readyMedications ?? [];

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#FBE9A6', '#D9F1E3', '#BFE8D2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name ?? '?').charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.greet}>{greeting()}</Text>
            <Text style={styles.name}>Olá, {user?.name ?? ''}</Text>
          </View>
        </View>

        {error && (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        )}

        <View style={[styles.dose, shadow.card]}>
          <View style={styles.doseIcon}>
            <Ionicons name="time-outline" size={28} color="#0F4D3A" />
          </View>
          <View style={{ flex: 1 }}>
            {next ? (
              <>
                <Text style={styles.doseKicker}>
                  PRÓXIMA TOMA · {next.time}
                  {next.tomorrow ? ' (AMANHÃ)' : ''}
                </Text>
                <Text style={styles.doseName}>{next.name}</Text>
              </>
            ) : (
              <>
                <Text style={styles.doseKicker}>PRÓXIMA TOMA</Text>
                <Text style={styles.doseName}>Sem tomas programadas</Text>
              </>
            )}
          </View>
          {next && !next.tomorrow && (
            <Pressable accessibilityRole="button" onPress={takeDose} style={styles.doseBtn}>
              <Text style={styles.doseBtnText}>Tomada</Text>
            </Pressable>
          )}
        </View>

        <EmergencyShortcuts />

        <View style={[styles.card, shadow.card]}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cardTitle}>Pedidos de receita</Text>
              <Text style={styles.cardSub}>Últimos 7 dias</Text>
            </View>
            <View style={styles.live}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Em direto</Text>
            </View>
          </View>

          <View style={styles.chartRow}>
            <View>
              <Text style={styles.big}>{req?.active ?? 0}</Text>
              <Text style={styles.cardSub}>pedidos ativos</Text>
            </View>
            <Svg
              width={W}
              height={H}
              viewBox={`0 0 ${W} ${H}`}
              accessibilityLabel="Gráfico dos pedidos de receita nos últimos 7 dias"
            >
              <Defs>
                <SvgGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#059669" stopOpacity={0.28} />
                  <Stop offset="1" stopColor="#059669" stopOpacity={0} />
                </SvgGradient>
              </Defs>
              <Path d={chart.area} fill="url(#fill)" />
              <Path d={chart.line} fill="none" stroke="#059669" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              <Circle cx={chart.last.x} cy={chart.last.y} r={5} fill="#FFFFFF" stroke="#059669" strokeWidth={3} />
            </Svg>
          </View>

          <View style={styles.row}>
            <Badge bg={colors.yellowSoft} fg={colors.yellowInk} text={`${req?.inReview ?? 0} em análise`} />
            <Badge bg={colors.blueSoft} fg={colors.blueInk} text={`${req?.approved ?? 0} aprovado`} />
            <Badge bg={colors.emeraldSoft} fg={colors.emeraldDark} text={`${req?.ready ?? 0} pronto`} />
          </View>
        </View>

        {ready.length > 0 && (
          <View style={[styles.ready, shadow.card]}>
            <View style={styles.readyIcon}>
              <Ionicons name="checkmark" size={22} color={colors.emerald} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.readyName}>
                {ready[0].name}
                {ready.length > 1 ? `  +${ready.length - 1}` : ''}
              </Text>
              <Text style={styles.cardSub}>Pronta para levantar</Text>
            </View>
          </View>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Intent d'appel -> médecin (numéro défini dans le Perfil) */}
      <Fab
        label="Contactar médico"
        icon="chatbubble-ellipses-outline"
        background={colors.yellowStrong}
        foreground="#3B2A00"
        onPress={() => callDoctor(user?.doctorPhone)}
        style={{ right: 20, bottom: 20 }}
      />
    </View>
  );
}

function Badge({ bg, fg, text }: { bg: string; fg: string; text: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: 300, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
  content: { paddingHorizontal: 20, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.emerald, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 18, fontWeight: '800' },
  greet: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  name: { fontSize: 21, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  error: { fontSize: 13, color: colors.danger, fontWeight: '700', backgroundColor: colors.white, padding: 10, borderRadius: 12 },
  dose: { backgroundColor: colors.emerald, borderRadius: 24, paddingVertical: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  doseIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  doseKicker: { color: '#D5F2E3', fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  doseName: { color: colors.white, fontSize: 18, fontWeight: '800' },
  doseBtn: { height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.white, justifyContent: 'center' },
  doseBtnText: { color: colors.emeraldDark, fontSize: 14, fontWeight: '800' },
  card: { backgroundColor: colors.white, borderRadius: 24, paddingVertical: 16, paddingHorizontal: 18, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.ink },
  cardSub: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  live: { height: 28, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.emeraldSoft, flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#059669' },
  liveText: { fontSize: 12, fontWeight: '800', color: colors.emeraldDark },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  big: { fontSize: 38, lineHeight: 40, fontWeight: '800', color: colors.ink, letterSpacing: -1 },
  badge: { flex: 1, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  ready: { backgroundColor: colors.white, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  readyIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.emeraldSoft, alignItems: 'center', justifyContent: 'center' },
  readyName: { fontSize: 14, fontWeight: '800', color: colors.ink },
});