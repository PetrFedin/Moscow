import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PhysicalPressable from '../../ui/PhysicalPressable';

type RomanovEra = '1857' | '1859';
type TrustMode = 'documented' | 'public';

type Props = {
  initialEra?: RomanovEra;
  initialTrustMode?: TrustMode;
  onBackToModel?: () => void;
  onClose?: () => void;
};

const ERA_KEY = 'moscow:p0:romanov-era:v1';
const TRUST_KEY = 'moscow:p0:romanov-trust-mode:v1';
const stages = ['SEARCHING', 'CANDIDATE', 'ANCHORED', 'CALIBRATED', 'VERIFIED'];

export default function MoscowSpatialJourneyFallback({
  initialEra = '1859',
  initialTrustMode = 'public',
  onBackToModel,
  onClose
}: Props) {
  const [demoPortal, setDemoPortal] = useState(false);
  const [era, setEra] = useState<RomanovEra>(initialEra);
  const [trustMode, setTrustMode] = useState<TrustMode>(initialTrustMode);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(ERA_KEY),
      AsyncStorage.getItem(TRUST_KEY)
    ]).then(([storedEra, storedTrust]) => {
      if (storedEra === '1857' || storedEra === '1859') setEra(storedEra);
      if (storedTrust === 'documented' || storedTrust === 'public') setTrustMode(storedTrust);
    }).catch(() => undefined);
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.kicker}>SPATIAL STATE · PREVIEW</Text>
        <Text style={styles.title}>AR runtime проверяется только в нативной сборке</Text>
        <Text style={styles.body}>Выбрано: {era === '1857' ? '1857' : '1859 / 1883'} · {trustMode === 'documented' ? 'только факты' : '+ реконструкция'}.</Text>
        <View style={styles.rail}>
          {stages.map((stage, index) => (
            <View key={stage} style={styles.railItem}>
              <View style={[styles.dot, index === 0 && styles.dotActive]} />
              <Text style={[styles.railText, index === 0 && styles.railTextActive]}>{stage}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.note}>Browser preview не может создать AR anchor и поэтому не имеет права перейти в `verified`. Нативный путь использует hit-test → local anchor → calibration → survey/field gate → persistent anchor.</Text>
        {demoPortal && (
          <View style={styles.demoCard}>
            <Text style={styles.demoKicker}>DEMO PORTAL · NOT VERIFIED</Text>
            <Text style={styles.demoText}>Показывается только сценарий перехода. Это не field-verified spatial scene.</Text>
          </View>
        )}
        <View style={styles.actions}>
          {onBackToModel && <PhysicalPressable style={styles.secondary} contentStyle={styles.center} onPress={onBackToModel}><Text style={styles.secondaryText}>← 3D-модель</Text></PhysicalPressable>}
          <PhysicalPressable style={styles.primary} contentStyle={styles.center} strong hapticEvent="spatial-enter" onPress={() => setDemoPortal((current) => !current)}><Text style={styles.primaryText}>{demoPortal ? 'Закрыть demo portal' : 'Portal · DEMO preview'}</Text></PhysicalPressable>
        </View>
        {onClose && <PhysicalPressable style={styles.close} contentStyle={styles.center} onPress={onClose}><Text style={styles.closeText}>Закрыть</Text></PhysicalPressable>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050607', alignItems: 'center', justifyContent: 'center', padding: 22 },
  card: { width: '100%', maxWidth: 660, borderRadius: 24, backgroundColor: '#111418', borderWidth: 1, borderColor: '#373d45', padding: 20 },
  kicker: { color: '#b99b69', fontSize: 9, letterSpacing: 1.4, fontWeight: '900' },
  title: { color: '#fff8ea', fontSize: 25, lineHeight: 31, fontWeight: '900', marginTop: 7 },
  body: { color: '#a7acb3', fontSize: 13, lineHeight: 19, marginTop: 8 },
  rail: { flexDirection: 'row', marginTop: 22 },
  railItem: { flex: 1, alignItems: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#3b4148' },
  dotActive: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#d7bb84' },
  railText: { color: '#666d75', fontSize: 7, fontWeight: '900', marginTop: 5 },
  railTextActive: { color: '#e0c793' },
  note: { color: '#8f949c', fontSize: 11, lineHeight: 17, marginTop: 18 },
  demoCard: { borderRadius: 16, borderWidth: 1, borderColor: '#806b4a', backgroundColor: '#211b13', padding: 12, marginTop: 14 },
  demoKicker: { color: '#e0bd79', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  demoText: { color: '#cbbd9f', fontSize: 10, lineHeight: 15, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  secondary: { flex: 1, minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: '#464d55' },
  secondaryText: { color: '#cdbb97', fontSize: 10, fontWeight: '900' },
  primary: { flex: 1.4, minHeight: 46, borderRadius: 14, backgroundColor: '#d7bb84' },
  primaryText: { color: '#17130d', fontSize: 10, fontWeight: '900' },
  close: { minHeight: 44, borderRadius: 13, marginTop: 8 },
  closeText: { color: '#7f858d', fontSize: 9, fontWeight: '900' }
});
