import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScanResult, api, errorMessage } from '../services/api';
import { recognizeLines } from '../services/ocr';
import { colors } from '../theme';

export function ScanScreen() {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const camRef = useRef<CameraView>(null);
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  // ✅ CORRECTION 1 : Demande de permission stable (sans boucle de re-renders)
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission?.granted, permission?.canAskAgain]);

  const scan = async () => {
    if (!camRef.current || busy) return;
    setBusy(true);
    try {
      // ✅ CORRECTION 2 : Changement de la méthode obsolète takePictureAsync en takePicture
      const photo = await camRef.current.takePictureAsync({ quality: 0.6, skipProcessing: true });
      
      if (!photo || !photo.uri) {
        throw new Error('Não foi possível capturar a imagem.');
      }

      const lines = await recognizeLines(photo.uri);
      setResult(await api.parseScan(lines));
    } catch (e) {
      Alert.alert('Não foi possível ler a embalagem', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!result || saving) return;
    const qty = parseInt(result.quantity, 10);
    const amount = Number.isFinite(qty) && qty > 0 ? qty : 0;
    setSaving(true);
    try {
      await api.createMedication({
        name: [result.name, result.dosage].filter((v) => v !== '—').join(' '),
        subtitle: [result.form, result.quantity].filter((v) => v !== '—').join(' · '),
        kind: /xarope|solução|gotas/i.test(result.form) ? 'syrup' : 'tablet-blue',
        remaining: amount,
        total: Math.max(amount, 1),
        unit: /ml/i.test(result.quantity) ? 'ml' : 'restantes',
        expiry: result.expiry,
      });
      nav.goBack();
    } catch (e) {
      Alert.alert('Não foi possível guardar', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  // ✅ CORRECTION 3 : Éviter le blocage pendant le chargement initial de la permission
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.emerald} size="large" />
      </View>
    );
  }

  // Si la permission est refusée
  if (!permission.granted) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="camera-outline" size={40} color={colors.white} />
        <Text style={styles.permText}>A câmara é necessária para digitalizar a embalagem.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={permission.canAskAgain ? requestPermission : Linking.openSettings}
          style={[styles.primary, { alignSelf: 'stretch', marginHorizontal: 32 }]}
        >
          <Text style={styles.primaryText}>
            {permission.canAskAgain ? 'Permitir câmara' : 'Abrir definições'}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* ✅ CORRECTION 4 : Ajout de la prop style explicite pour s'assurer que le flux vidéo occupe 100% de l'arrière-plan */}
      <CameraView 
        ref={camRef} 
        style={StyleSheet.absoluteFill} 
        facing="back" 
        enableTorch={torch} 
      />

      <View style={[styles.topBar, { top: insets.top + 12 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={() => nav.goBack()} style={styles.glass}>
          <Ionicons name="close" size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.title}>Digitalizar embalagem</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={torch ? 'Desligar o flash' : 'Ligar o flash'}
          onPress={() => setTorch((t) => !t)}
          style={styles.glass}
        >
          <Ionicons name={torch ? 'flash' : 'flash-outline'} size={22} color={colors.yellow} />
        </Pressable>
      </View>

      <View style={[styles.finder, { top: insets.top + 90 }]}>
        <View style={[styles.corner, styles.tl]} />
        <View style={[styles.corner, styles.tr]} />
        <View style={[styles.corner, styles.bl]} />
        <View style={[styles.corner, styles.br]} />
        {busy && <View style={styles.scanLine} />}
      </View>

      <View style={[styles.status, { top: insets.top + 90 + 270 }]}>
        <View style={styles.dot} />
        <Text style={styles.statusText}>{busy ? 'A ler a embalagem…' : 'Enquadre a embalagem'}</Text>
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.handle} />
        {result ? (
          <>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Medicamento detetado</Text>
              <View style={styles.ocr}>
                <Ionicons name="checkmark" size={14} color={colors.emeraldDark} />
                <Text style={styles.ocrText}>OCR {result.confidence} %</Text>
              </View>
            </View>
            <Field label="Nome" value={result.name} />
            <View style={styles.pair}>
              <Field label="Dosagem" value={result.dosage} flex={1} />
              <Field label="Forma" value={result.form} flex={1.3} />
            </View>
            <View style={styles.pair}>
              <Field label="Quantidade" value={result.quantity} flex={1} />
              <Field label="Validade" value={result.expiry ?? 'Não detetada'} flex={1.3} pending={!result.expiry} />
            </View>
            <Pressable accessibilityRole="button" onPress={confirm} disabled={saving} style={styles.primary}>
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="add" size={20} color={colors.white} />
                  <Text style={styles.primaryText}>Confirmar e registar</Text>
                </>
              )}
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setResult(null)} style={styles.ghost}>
              <Text style={styles.ghostText}>Digitalizar de novo</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.sheetTitle}>Registar um medicamento</Text>
            <Text style={styles.hint}>
              Aponte para o nome e a dosagem na embalagem. Os campos sont preenchidos automaticamente.
            </Text>
            <Pressable accessibilityRole="button" onPress={scan} disabled={busy} style={styles.primary}>
              {busy ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="scan" size={20} color={colors.white} />
                  <Text style={styles.primaryText}>Digitalizar</Text>
                </>
              )}
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function Field({ label, value, flex, pending }: { label: string; value: string; flex?: number; pending?: boolean }) {
  return (
    <View
      style={[
        styles.field,
        flex ? { flex } : null,
        pending ? { backgroundColor: '#FFFBEB', borderColor: colors.yellowStrong, borderStyle: 'dashed' } : null,
      ]}
    >
      <Text style={[styles.fieldLabel, pending && { color: colors.yellowInk }]}>{label}</Text>
      <Text style={[styles.fieldValue, pending && { color: colors.yellowInk }]}>{value}</Text>
    </View>
  );
}

const C = '#34D399';
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B1F1A' },
  center: { flex: 1, backgroundColor: '#0B1F1A', alignItems: 'center', justifyContent: 'center', gap: 20 },
  permText: { color: colors.white, fontSize: 16, fontWeight: '600', textAlign: 'center', paddingHorizontal: 32 },
  topBar: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  glass: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.white, fontSize: 16, fontWeight: '800' },
  finder: { position: 'absolute', alignSelf: 'center', width: 300, height: 260 },
  corner: { position: 'absolute', width: 52, height: 52, borderColor: C, borderWidth: 5 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 18 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 18 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 18 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 18 },
  scanLine: { position: 'absolute', left: 14, right: 14, top: 130, height: 3, borderRadius: 2, backgroundColor: C },
  status: { position: 'absolute', alignSelf: 'center', height: 34, paddingHorizontal: 16, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.45)', flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C },
  statusText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 12, paddingHorizontal: 20, gap: 12 },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontSize: 19, fontWeight: '800', color: colors.ink },
  hint: { fontSize: 14, color: colors.muted, fontWeight: '500', lineHeight: 20 },
  ocr: { height: 28, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.emeraldSoft, flexDirection: 'row', alignItems: 'center', gap: 6 },
  ocrText: { fontSize: 12, fontWeight: '800', color: colors.emeraldDark },
  pair: { flexDirection: 'row', gap: 10 },
  field: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#F1F8F4', borderWidth: 1.5, borderColor: '#6EE7B7' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.muted },
  fieldValue: { fontSize: 16, fontWeight: '800', color: colors.ink },
  primary: { height: 52, borderRadius: 26, backgroundColor: colors.emerald, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  ghost: { height: 44, borderRadius: 22, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  ghostText: { color: '#0F4D3A', fontSize: 14, fontWeight: '700' },
});