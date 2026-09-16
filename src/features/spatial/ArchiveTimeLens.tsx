import Slider from '@react-native-community/slider';
import React, { useMemo, useState } from 'react';
import { Image, Linking, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { Place } from '../../data/places';
import type { AppLanguage } from '../../i18n';
import { romanovSources } from '../../spatial/romanov-sources';

type LensState = { opacity: number; visible: boolean };

type Props = {
  place: Place;
  language: AppLanguage;
  initialOpacity?: number;
  initialVisible?: boolean;
  onStateChange?: (state: LensState) => void;
  onClose: () => void;
  onOpenSpatial: () => void;
};

const clampOpacity = (value: number) => Math.max(0, Math.min(0.92, value));

export default function ArchiveTimeLensFallback({
  place,
  language,
  initialOpacity = 0.52,
  initialVisible = true,
  onStateChange,
  onClose,
  onOpenSpatial
}: Props) {
  const [opacity, setOpacity] = useState(() => clampOpacity(initialOpacity));
  const [archiveVisible, setArchiveVisible] = useState(initialVisible);
  const isRomanov = place.id === 'romanov-chambers';
  const archive = useMemo(() => romanovSources.find((source) => source.id === 'timm-1857'), []);
  const ru = language === 'ru';
  const effectiveOpacity = archiveVisible ? opacity : 0;

  const updateOpacity = (value: number) => {
    const nextOpacity = clampOpacity(value);
    const nextVisible = nextOpacity > 0.01;
    setOpacity(nextOpacity);
    setArchiveVisible(nextVisible);
    onStateChange?.({ opacity: nextOpacity, visible: nextVisible });
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>{ru ? 'ЛИНЗА ВРЕМЕНИ · PREVIEW' : 'TIME LENS · PREVIEW'}</Text>
          <Text style={styles.title}>{place.title}</Text>
          <Text style={styles.subtitle}>{ru ? 'Живая камера работает в нативной iOS/Android сборке.' : 'Live camera is available in the native iOS/Android build.'}</Text>
        </View>
        <Pressable style={styles.close} onPress={onClose} accessibilityLabel={ru ? 'Закрыть линзу времени' : 'Close time lens'}><Text style={styles.closeText}>×</Text></Pressable>
      </View>

      {isRomanov && archive?.mediaUrl ? (
        <View style={styles.archiveCard}>
          <Image source={{ uri: archive.mediaUrl }} style={[styles.archiveImage, { opacity: effectiveOpacity }]} resizeMode="contain" />
          <View style={styles.info}>
            <View style={styles.infoCopy}>
              <Text style={styles.sourceKicker}>PUBLIC DOMAIN · {archive.year}</Text>
              <Text style={styles.sourceTitle}>{archive.titleRu}</Text>
              <Text style={styles.sourceMeta}>{archive.author}</Text>
            </View>
            <Pressable style={styles.sourceButton} onPress={() => Linking.openURL(archive.sourcePage)}><Text style={styles.sourceButtonText}>{ru ? 'Источник ↗' : 'Source ↗'}</Text></Pressable>
          </View>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>{ru ? 'Сейчас' : 'Now'}</Text>
            <Slider
              testID="archive-opacity"
              accessibilityLabel={ru ? 'Прозрачность архивного слоя' : 'Archive layer opacity'}
              style={styles.slider}
              minimumValue={0}
              maximumValue={0.92}
              value={effectiveOpacity}
              onValueChange={updateOpacity}
              minimumTrackTintColor="#d7bb84"
              maximumTrackTintColor="#43474e"
              thumbTintColor="#f0d39b"
            />
            <Text style={styles.sliderLabel}>1857</Text>
          </View>
          <Text testID="archive-opacity-value" style={styles.opacityValue}>{ru ? 'Архив' : 'Archive'} · {Math.round(effectiveOpacity * 100)}%</Text>
          <Pressable style={styles.primary} onPress={onOpenSpatial}><Text style={styles.primaryText}>{ru ? 'Открыть 3D-машину времени' : 'Open the 3D time machine'}</Text></Pressable>
        </View>
      ) : (
        <View style={styles.empty}><Text style={styles.emptyTitle}>{ru ? 'Архивная накладка ещё не верифицирована' : 'Archive overlay is not verified yet'}</Text><Text style={styles.emptyBody}>{ru ? 'Для этой точки сначала нужны проверенный источник и права.' : 'This stop first needs a verified source and rights.'}</Text></View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070809', padding: 18 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headerCopy: { flex: 1, minWidth: 0 },
  kicker: { color: '#b99b69', fontSize: 9, letterSpacing: 1.4, fontWeight: '900' },
  title: { color: '#fff8ea', fontSize: 24, fontWeight: '900', marginTop: 5 },
  subtitle: { color: '#8f949c', fontSize: 11, marginTop: 4 },
  close: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#171a1f', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#f6f0e5', fontSize: 26, lineHeight: 28 },
  archiveCard: { flex: 1, marginTop: 16, borderRadius: 22, borderWidth: 1, borderColor: '#32363d', backgroundColor: '#101318', padding: 14, justifyContent: 'center' },
  archiveImage: { width: '100%', height: '58%', minHeight: 300, backgroundColor: '#050607', borderRadius: 16 },
  info: { flexDirection: 'row', gap: 10, marginTop: 12, alignItems: 'center' },
  infoCopy: { flex: 1 },
  sourceKicker: { color: '#7eb289', fontSize: 8, letterSpacing: 1.1, fontWeight: '900' },
  sourceTitle: { color: '#eee9df', fontSize: 15, fontWeight: '900', marginTop: 4 },
  sourceMeta: { color: '#858a92', fontSize: 10, marginTop: 3 },
  sourceButton: { minHeight: 38, borderRadius: 12, borderWidth: 1, borderColor: '#454a51', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  sourceButtonText: { color: '#d7bb84', fontSize: 9, fontWeight: '900' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 13 },
  slider: { flex: 1 },
  sliderLabel: { color: '#92969e', fontSize: 9, fontWeight: '800' },
  opacityValue: { color: '#d5c29d', fontSize: 9, fontWeight: '900', textAlign: 'center', marginTop: 3 },
  primary: { minHeight: 46, borderRadius: 14, backgroundColor: '#d7bb84', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  primaryText: { color: '#17130d', fontSize: 11, fontWeight: '900' },
  empty: { borderRadius: 20, borderWidth: 1, borderColor: '#30343a', backgroundColor: '#111418', padding: 20, marginTop: 20 },
  emptyTitle: { color: '#eee9df', fontSize: 17, fontWeight: '900' },
  emptyBody: { color: '#8e939b', fontSize: 12, lineHeight: 18, marginTop: 6 }
});
