import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { callEmergency, callSns24, openPharmaciesMap } from '../services/intents';
import { colors } from '../theme';

type Tile = {
  label: string;
  hint: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  bg: string;
  fg: string;
  onPress: () => void;
};

const TILES: Tile[] = [
  // Intent d'appel -> 112
  { label: 'Ligar 112', hint: 'Appeler le 112', icon: 'call', bg: colors.danger, fg: colors.white, onPress: callEmergency },
  // Intent d'appel -> SNS 24 (808 24 24 24)
  { label: 'SNS 24', hint: 'Appeler le SNS 24', icon: 'heart', bg: colors.blueSoft, fg: colors.blueInk, onPress: callSns24 },
  // Intent carte -> pharmacies à proximité
  { label: 'Farmácia aberta', hint: 'Ouvrir la carte des pharmacies', icon: 'location', bg: colors.yellowSoft, fg: colors.yellowInk, onPress: openPharmaciesMap },
];

export function EmergencyShortcuts() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Atalhos de emergência</Text>
      <View style={styles.row}>
        {TILES.map((t) => (
          <Pressable
            key={t.label}
            accessibilityRole="button"
            accessibilityLabel={t.label}
            accessibilityHint={t.hint}
            onPress={t.onPress}
            style={[styles.tile, { backgroundColor: t.bg }]}
          >
            <Ionicons name={t.icon} size={22} color={t.fg} />
            <Text style={[styles.label, { color: t.fg }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  title: { fontSize: 15, fontWeight: '800', color: colors.ink },
  row: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, height: 76, borderRadius: 20, paddingHorizontal: 14, justifyContent: 'center', gap: 4 },
  label: { fontSize: 14, fontWeight: '800' },
});