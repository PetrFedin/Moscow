import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { evidenceLabels, getRomanovHotspots } from '../../spatial/romanov-hotspots';
import { getRomanovSourceById } from '../../spatial/romanov-sources';
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
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const hotspots = getRomanovHotspots(era, trustMode);
  const selectedHotspot = hotspots.find((hotspot) => hotspot.id === selectedHotspotId) ?? hotspots[0] ?? null;

  const selectEra = (next: RomanovEra) => {
    setEra(next);
    setSelectedHotspotId(null);
    onStateChange?.({ era: next, trustMode });
  };
  const selectTrust = (next: TrustMode) => {
    setTrustMode(next);
    setSelectedHotspotId(null);
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

      <View style={styles.hotspotPanel}>
        <View style={styles.hotspotHeader}>
          <View>
            <Text style={styles.hotspotKicker}>ТОЧКИ ОСМОТРА</Text>
            <Text style={styles.hotspotHint}>Выберите элемент модели. AR запускается отдельно — только после осмотра 3D.</Text>
          </View>
          <Text style={styles.hotspotCount}>{hotspots.length}</Text>
        </View>

        <View style={styles.hotspotList}>
          {hotspots.map((hotspot, index) => {
            const active = selectedHotspot?.id === hotspot.id;
            return (
              <PhysicalPressable
                key={hotspot.id}
                style={[styles.hotspotButton, active && styles.hotspotButtonActive]}
                contentStyle={styles.hotspotButtonContent}
                accessibilityLabel={`3D · Точка осмотра · ${hotspot.titleRu}`}
                onPress={() => setSelectedHotspotId(hotspot.id)}
              >
                <Text style={[styles.hotspotIndex, active && styles.hotspotIndexActive]}>{String(index + 1).padStart(2, '0')}</Text>
                <View style={styles.hotspotButtonCopy}>
                  <Text style={[styles.hotspotTitle, active && styles.hotspotTitleActive]}>{hotspot.titleRu}</Text>
                  <Text style={styles.hotspotEvidence}>{evidenceLabels.ru[hotspot.evidence]}</Text>
                </View>
              </PhysicalPressable>
            );
          })}
        </View>

        {selectedHotspot && (
          <View style={styles.hotspotStory}>
            <Text style={styles.hotspotStoryTitle}>{selectedHotspot.titleRu}</Text>
            <Text style={styles.hotspotStoryBody}>{selectedHotspot.storyRu}</Text>
            <Text style={styles.hotspotSourcesLabel}>ИСТОЧНИКИ</Text>
            {selectedHotspot.sourceIds.map((sourceId) => {
              const source = getRomanovSourceById(sourceId);
              if (!source) return null;
              return (
                <PhysicalPressable
                  key={source.id}
                  style={styles.sourceRow}
                  contentStyle={styles.sourceRowContent}
                  accessibilityLabel={`Открыть источник · ${source.titleRu}`}
                  onPress={() => Linking.openURL(source.sourcePage)}
                >
                  <Text style={styles.sourceTitle}>{source.titleRu}</Text>
                  <Text style={styles.sourceArrow}>↗</Text>
                </PhysicalPressable>
              );
            })}
          </View>
        )}
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
  hotspotPanel: { width: '100%', maxWidth: 620, borderRadius: 18, borderWidth: 1, borderColor: '#30353d', backgroundColor: '#0d1014', padding: 12, marginTop: 12 },
  hotspotHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  hotspotKicker: { color: '#b99b69', fontSize: 8, letterSpacing: 1.2, fontWeight: '900' },
  hotspotHint: { color: '#747a83', fontSize: 9, lineHeight: 13, marginTop: 3, maxWidth: 470 },
  hotspotCount: { color: '#f0d39b', fontSize: 18, fontWeight: '900' },
  hotspotList: { gap: 7, marginTop: 10 },
  hotspotButton: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: '#343941' },
  hotspotButtonActive: { borderColor: '#9c8259', backgroundColor: '#1c1711' },
  hotspotButtonContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8 },
  hotspotIndex: { width: 34, color: '#6f757d', fontSize: 9, fontWeight: '900' },
  hotspotIndexActive: { color: '#e7c98f' },
  hotspotButtonCopy: { flex: 1, minWidth: 0 },
  hotspotTitle: { color: '#c8ccd1', fontSize: 11, fontWeight: '900' },
  hotspotTitleActive: { color: '#fff3dc' },
  hotspotEvidence: { color: '#777d85', fontSize: 8, marginTop: 2 },
  hotspotStory: { borderRadius: 14, backgroundColor: '#14181d', padding: 12, marginTop: 10 },
  hotspotStoryTitle: { color: '#fff8ea', fontSize: 15, fontWeight: '900' },
  hotspotStoryBody: { color: '#9da3ab', fontSize: 10.5, lineHeight: 16, marginTop: 5 },
  hotspotSourcesLabel: { color: '#7c828a', fontSize: 7.5, letterSpacing: 1.1, fontWeight: '900', marginTop: 10, marginBottom: 3 },
  sourceRow: { minHeight: 40, borderTopWidth: 1, borderTopColor: '#2c3138' },
  sourceRowContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  sourceTitle: { color: '#c8b995', fontSize: 9.5, flex: 1, paddingRight: 8 },
  sourceArrow: { color: '#d7bb84', fontSize: 14 },
  flow: { flexDirection: 'row', alignItems: 'center', marginTop: 22 },
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
