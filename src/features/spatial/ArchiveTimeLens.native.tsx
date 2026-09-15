import Slider from '@react-native-community/slider';
import { CameraView } from 'expo-camera';
import React, { useMemo, useState } from 'react';
import { Image, Linking, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { Place } from '../../data/places';
import type { AppLanguage } from '../../i18n';
import { romanovSources } from '../../spatial/romanov-sources';

type Props = {
  place: Place;
  language: AppLanguage;
  onClose: () => void;
  onOpenSpatial: () => void;
};

export default function ArchiveTimeLens({ place, language, onClose, onOpenSpatial }: Props) {
  const [opacity, setOpacity] = useState(0.52);
  const [archiveVisible, setArchiveVisible] = useState(true);
  const isRomanov = place.id === 'romanov-chambers';
  const archive = useMemo(() => romanovSources.find((source) => source.id === 'timm-1857'), []);
  const ru = language === 'ru';

  return (
    <View style={styles.root}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      {isRomanov && archiveVisible && archive?.mediaUrl && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Image
            source={{ uri: archive.mediaUrl }}
            style={[StyleSheet.absoluteFill, { opacity }]}
            resizeMode="cover"
          />
        </View>
      )}

      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>{ru ? 'ЛИНЗА ВРЕМЕНИ' : 'TIME LENS'}</Text>
            <Text style={styles.title}>{place.title}</Text>
            <Text style={styles.subtitle}>
              {isRomanov
                ? (ru ? '1857 · архив поверх живой камеры' : '1857 · archive over live camera')
                : (ru ? 'Навигационная камера · архив ещё не верифицирован' : 'Camera guidance · archive not yet verified')}
            </Text>
          </View>
          <Pressable style={styles.close} onPress={onClose} accessibilityLabel={ru ? 'Закрыть' : 'Close'}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <View pointerEvents="none" style={styles.alignment}>
          <View style={styles.crossH} />
          <View style={styles.crossV} />
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
          <Text style={styles.alignmentText}>{ru ? 'Совместите основные линии фасада' : 'Align the main facade lines'}</Text>
        </View>

        <View style={styles.bottomPanel}>
          {isRomanov && archive ? (
            <>
              <View style={styles.sourceTop}>
                <View style={styles.sourceCopy}>
                  <Text style={styles.sourceKicker}>{ru ? 'АРХИВНЫЙ ИСТОЧНИК' : 'ARCHIVAL SOURCE'}</Text>
                  <Text style={styles.sourceTitle}>{archive.titleRu}</Text>
                  <Text style={styles.sourceMeta}>{archive.author} · {archive.year}</Text>
                </View>
                <View style={styles.publicBadge}><Text style={styles.publicBadgeText}>PUBLIC DOMAIN</Text></View>
              </View>

              <View style={styles.sliderRow}>
                <Text style={styles.sliderLabel}>{ru ? 'Сейчас' : 'Now'}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={0.92}
                  value={archiveVisible ? opacity : 0}
                  onValueChange={(value) => { setOpacity(value); setArchiveVisible(value > 0.01); }}
                  minimumTrackTintColor="#d7bb84"
                  maximumTrackTintColor="#4b4f56"
                  thumbTintColor="#f0d39b"
                />
                <Text style={styles.sliderLabel}>1857</Text>
              </View>

              <View style={styles.actionRow}>
                <Pressable style={styles.secondaryButton} onPress={() => setArchiveVisible((current) => !current)}>
                  <Text style={styles.secondaryText}>{archiveVisible ? (ru ? 'Скрыть архив' : 'Hide archive') : (ru ? 'Показать архив' : 'Show archive')}</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={() => Linking.openURL(archive.sourcePage)}>
                  <Text style={styles.secondaryText}>{ru ? 'Источник ↗' : 'Source ↗'}</Text>
                </Pressable>
              </View>

              <Pressable style={styles.primaryButton} onPress={onOpenSpatial}>
                <Text style={styles.primaryText}>{ru ? 'Перейти из архива в 3D / AR' : 'Continue from archive to 3D / AR'}</Text>
              </Pressable>
              <Text style={styles.notice}>
                {ru
                  ? 'Архивная накладка — визуальный инструмент совмещения, а не метрически точная AR-привязка. Точная модель проверяется отдельно по контрольным точкам.'
                  : 'The archive overlay is a visual alignment aid, not a metric AR anchor. Precise model alignment is verified separately with control points.'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.sourceKicker}>{ru ? 'ЧТО ИСКАТЬ ГЛАЗАМИ' : 'WHAT TO LOOK FOR'}</Text>
              <Text style={styles.sourceTitle}>{place.highlights[0]}</Text>
              <Text style={styles.notice}>{ru ? 'Для этой точки архивная накладка появится только после проверки источника и прав.' : 'An archive overlay will be enabled here only after source and rights verification.'}</Text>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#030405' },
  overlay: { flex: 1, justifyContent: 'space-between', padding: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headerCopy: { flex: 1, minWidth: 0, borderRadius: 18, backgroundColor: 'rgba(7,9,11,0.84)', padding: 14 },
  kicker: { color: '#c4a56e', fontSize: 9, letterSpacing: 1.5, fontWeight: '900' },
  title: { color: '#fff8eb', fontSize: 20, fontWeight: '900', marginTop: 5 },
  subtitle: { color: '#a9adb4', fontSize: 10, marginTop: 4 },
  close: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(7,9,11,0.86)', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#fff7e9', fontSize: 26, lineHeight: 28 },
  alignment: { alignSelf: 'center', width: 270, height: 270, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 22 },
  crossH: { position: 'absolute', left: 82, right: 82, top: 134, height: 1, backgroundColor: 'rgba(244,210,149,0.88)' },
  crossV: { position: 'absolute', top: 82, bottom: 82, left: 134, width: 1, backgroundColor: 'rgba(244,210,149,0.88)' },
  cornerTL: { position: 'absolute', left: 0, top: 0, width: 54, height: 54, borderLeftWidth: 2, borderTopWidth: 2, borderColor: 'rgba(244,210,149,0.7)' },
  cornerTR: { position: 'absolute', right: 0, top: 0, width: 54, height: 54, borderRightWidth: 2, borderTopWidth: 2, borderColor: 'rgba(244,210,149,0.7)' },
  cornerBL: { position: 'absolute', left: 0, bottom: 0, width: 54, height: 54, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: 'rgba(244,210,149,0.7)' },
  cornerBR: { position: 'absolute', right: 0, bottom: 0, width: 54, height: 54, borderRightWidth: 2, borderBottomWidth: 2, borderColor: 'rgba(244,210,149,0.7)' },
  alignmentText: { color: '#fff2d8', fontSize: 10, fontWeight: '900', borderRadius: 10, backgroundColor: 'rgba(7,9,11,0.72)', paddingHorizontal: 10, paddingVertical: 6 },
  bottomPanel: { borderRadius: 21, backgroundColor: 'rgba(8,10,13,0.92)', borderWidth: 1, borderColor: '#393c41', padding: 15 },
  sourceTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  sourceCopy: { flex: 1, minWidth: 0 },
  sourceKicker: { color: '#a98e60', fontSize: 8, letterSpacing: 1.3, fontWeight: '900' },
  sourceTitle: { color: '#f1ece2', fontSize: 14, lineHeight: 19, fontWeight: '900', marginTop: 4 },
  sourceMeta: { color: '#8e9299', fontSize: 9, marginTop: 3 },
  publicBadge: { borderRadius: 8, borderWidth: 1, borderColor: '#4f7658', backgroundColor: '#17251b', paddingHorizontal: 7, paddingVertical: 5 },
  publicBadgeText: { color: '#abd1b2', fontSize: 7, fontWeight: '900' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  slider: { flex: 1 },
  sliderLabel: { color: '#c7c9cd', fontSize: 9, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 9 },
  secondaryButton: { flex: 1, minHeight: 38, borderRadius: 12, borderWidth: 1, borderColor: '#454950', alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#cbb995', fontSize: 9, fontWeight: '900' },
  primaryButton: { minHeight: 44, borderRadius: 13, backgroundColor: '#d7bb84', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryText: { color: '#17130d', fontSize: 11, fontWeight: '900' },
  notice: { color: '#7f848c', fontSize: 9, lineHeight: 13, marginTop: 8 }
});
