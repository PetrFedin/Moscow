import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import PhysicalPressable from '../../ui/PhysicalPressable';

type RomanovEra = '1857' | '1859';
type TrustMode = 'documented' | 'public';

type Props = {
  onClose: () => void;
  onBackToArchive: () => void;
  onOpenSpatial: () => void;
  initialEra?: RomanovEra;
  initialTrustMode?: TrustMode;
  onStateChange?: (state: { era: RomanovEra; trustMode: TrustMode }) => void;
};

const eraLabel: Record<RomanovEra, string> = {
  '1857': '1857 · до реставрации',
  '1859': '1859 / 1883 · после реставрации'
};

export default function HistoricalModelViewerFallback({
  onClose,
  onBackToArchive,
  onOpenSpatial,
  initialEra = '1859',
  initialTrustMode = 'public',
  onStateChange
}: Props) {
  const [era, setEra] = useState<RomanovEra>(initialEra);
  const [trustMode, setTrustMode] = useState<TrustMode>(initialTrustMode);

  const selectEra = (next: RomanovEra) => {
    setEra(next);
    onStateChange?.({ era: next, trustMode });
  };
  const selectTrust = (next: TrustMode) => {
    setTrustMode(next);
    onStateChange?.({ era, trustMode: next });
  };

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.kicker}>3D MODEL · ROMANOV</Text>
      <Text style={styles.title}>Одна историческая модель — несколько режимов</Text>
      <Text style={styles.body}>Preview сохраняет выбранную эпоху и уровень достоверности при переходе в spatial mode и обратно. Нативная сборка использует ту же GLB-модель в 3D, AR и Quest.</Text>

      <View style={styles.controlCard}>
        <Text style={styles.controlLabel}>ЭПОХА</Text>
        <View style={styles.row}>
          {(['1857', '1859'] as RomanovEra[]).map((item) => (
            <PhysicalPressable
              key={item}
              style={[styles.choice, era === item && styles.choiceActive]}
              contentStyle={styles.center}
              hapticEvent="epoch-snap"
              accessibilityLabel={`3D · Эпоха · ${eraLabel[item]}`}
              onPress={() => selectEra(item)}
            >
              <Text style={[styles.choiceText, era === item && styles.choiceTextActive]}>{eraLabel[item]}</Text>
            </PhysicalPressable>
          ))}
        </View>
        <Text style={styles.controlLabel}>ДОСТОВЕРНОСТЬ</Text>
        <View style={styles.row}>
          <PhysicalPressable
            style={[styles.choice, trustMode === 'documented' && styles.choiceActive]}
            contentStyle={styles.center}
            accessibilityLabel="3D · Только факты"
            onPress={() => selectTrust('documented')}
          >
            <Text style={[styles.choiceText, trustMode === 'documented' && styles.choiceTextActive]}>Только факты</Text>
          </PhysicalPressable>
          <PhysicalPressable
            style={[styles.choice, trustMode === 'public' && styles.choiceActive]}
            contentStyle={styles.center}
            accessibilityLabel="3D · Реконструкция"
            onPress={() => selectTrust('public')}
          >
            <Text style={[styles.choiceText, trustMode === 'public' && styles.choiceTextActive]}>+ реконструкция</Text>
          </PhysicalPressable>
        </View>
      </View>

      <View style={styles.flow}>
        {['Архив', '3D', 'AR', 'VR'].map((item, index) => (
          <React.Fragment key={item}>
            <View style={[styles.step, index === 1 && styles.stepActive]}><Text style={[styles.stepText, index === 1 && styles.stepTextActive]}>{item}</Text></View>
            {index < 3 && <Text style={styles.arrow}>→</Text>}
          </React.Fragment>
        ))}
      </View>
      <View style={styles.actions}>
        <PhysicalPressable style={styles.secondary} contentStyle={styles.center} accessibilityLabel="3D · Назад в архив" onPress={onBackToArchive}>
          <Text style={styles.secondaryText}>← Архив</Text>
        </PhysicalPressable>
        <PhysicalPressable style={styles.primary} contentStyle={styles.center} strong hapticEvent="spatial-enter" accessibilityLabel="3D · Открыть spatial mode" onPress={onOpenSpatial}>
          <Text style={styles.primaryText}>Открыть spatial mode</Text>
        </PhysicalPressable>
      </View>
      <PhysicalPressable style={styles.closeButton} contentStyle={styles.center} accessibilityLabel="3D · Закрыть" onPress={onClose}>
        <Text style={styles.close}>Закрыть</Text>
      </PhysicalPressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flexGrow: 1, backgroundColor: '#07090c', alignItems: 'center', justifyContent: 'center', padding: 28 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  kicker: { color: '#b99b69', fontSize: 10, letterSpacing: 1.5, fontWeight: '900' },
  title: { color: '#fff8ea', fontSize: 27, lineHeight: 33, fontWeight: '900', textAlign: 'center', marginTop: 10, maxWidth: 560 },
  body: { color: '#9ea3ab', fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 620, marginTop: 10 },
  controlCard: { width: '100%', maxWidth: 560, borderRadius: 18, borderWidth: 1, borderColor: '#333840', backgroundColor: '#101318', padding: 12, marginTop: 20 },
  controlLabel: { color: '#7e838b', fontSize: 8, letterSpacing: 1.2, fontWeight: '900', marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  choice: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: '#41464d' },
  choiceActive: { borderColor: '#b99b69', backgroundColor: '#211b13' },
  choiceText: { color: '#aeb2b8', fontSize: 10, fontWeight: '900', textAlign: 'center' },
  choiceTextActive: { color: '#edcf95' },
  flow: { flexDirection: 'row', alignItems: 'center', marginTop: 26 },
  step: { minWidth: 64, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 14, borderWidth: 1, borderColor: '#3c4148', alignItems: 'center' },
  stepActive: { backgroundColor: '#d7bb84', borderColor: '#d7bb84' },
  stepText: { color: '#c4c8cd', fontSize: 11, fontWeight: '900' },
  stepTextActive: { color: '#17130d' },
  arrow: { color: '#686d75', marginHorizontal: 7 },
  actions: { flexDirection: 'row', gap: 10, width: '100%', maxWidth: 520, marginTop: 28 },
  secondary: { flex: 1, minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: '#454a51' },
  secondaryText: { color: '#d0bb91', fontWeight: '900' },
  primary: { flex: 1.4, minHeight: 46, borderRadius: 14, backgroundColor: '#d7bb84' },
  primaryText: { color: '#17130d', fontWeight: '900' },
  closeButton: { marginTop: 12, minWidth: 100, minHeight: 44 },
  close: { color: '#777d85', fontSize: 11 }
});
