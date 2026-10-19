import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Medication, remainingLabel } from '../data/medications';
import { colors, shadow } from '../theme';
import { PACK_BG, PackShot } from './PackShot';

type Props = {
  med: Medication;
  onRefill: (med: Medication) => void;
  onInfo: (med: Medication) => void;
};

export function MedicationCard({ med, onRefill, onInfo }: Props) {
  const ratio = Math.max(0, Math.min(1, med.remaining / med.total));
  const low = ratio < 0.35;

  return (
    <View style={[styles.card, shadow.card]}>
      <View style={styles.top}>
        <View style={[styles.thumb, { backgroundColor: PACK_BG[med.kind] }]}>
          <PackShot kind={med.kind} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{med.name}</Text>
          <Text style={styles.sub}>{med.subtitle}</Text>
          <View style={styles.stockRow}>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${ratio * 100}%`, backgroundColor: low ? '#D97706' : '#059669' },
                ]}
              />
            </View>
            <Text style={[styles.stockLabel, { color: low ? '#7A4A00' : colors.emeraldDark }]}>
              {remainingLabel(med)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onRefill(med)}
          style={[styles.btn, styles.primary]}
        >
          <Ionicons name="refresh" size={18} color={colors.white} />
          <Text style={styles.primaryText}>Encomendar reposição</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onInfo(med)}
          style={[styles.btn, styles.ghost]}
        >
          <Text style={styles.ghostText}>Mais info</Text>
          <Ionicons name="chevron-forward" size={16} color="#0F4D3A" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 24, padding: 16, gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  thumb: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 6 },
  name: { fontSize: 17, fontWeight: '800', color: colors.ink },
  sub: { fontSize: 13, color: colors.muted, fontWeight: '500' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  stockLabel: { fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10 },
  btn: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  primary: { flex: 1.5, backgroundColor: colors.emerald },
  primaryText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  ghost: { flex: 1, backgroundColor: colors.chip },
  ghostText: { color: '#0F4D3A', fontSize: 14, fontWeight: '700' },
});