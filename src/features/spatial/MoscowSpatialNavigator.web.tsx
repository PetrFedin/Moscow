import '@google/model-viewer';
import { Asset } from 'expo-asset';
import React, { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { romanovHotspots, type RomanovEra } from '../../spatial/romanov-hotspots';
import { romanovSources } from '../../spatial/romanov-sources';

type TrustMode = 'documented' | 'public';

const assetModules: Record<RomanovEra, Record<TrustMode, number>> = {
  '1857': {
    documented: require('../../../assets/models/romanov-1857-documented-v1.glb'),
    public: require('../../../assets/models/romanov-1857-public-v1.glb')
  },
  '1859': {
    documented: require('../../../assets/models/romanov-1859-documented-v1.glb'),
    public: require('../../../assets/models/romanov-1859-public-v1.glb')
  }
};

const eraCopy = {
  '1857': { year: '1857', title: 'До реставрации' },
  '1859': { year: '1859 / 1883', title: 'Реставрация Рихтера' }
} as const;

const trustCopy = {
  documented: {
    button: 'Только подтверждённое',
    title: 'Documented',
    body: 'Показываются только узлы, отнесённые к подтверждённой геометрии.'
  },
  public: {
    button: '+ реконструкция',
    title: 'Public research',
    body: 'Documented + reconstructed. Hypothesis-геометрия исключена из публичной модели.'
  }
} as const;

export default function MoscowSpatialNavigatorWeb() {
  const [era, setEra] = useState<RomanovEra>('1859');
  const [trustMode, setTrustMode] = useState<TrustMode>('public');

  const modelUrl = useMemo(() => Asset.fromModule(assetModules[era][trustMode]).uri, [era, trustMode]);
  const hotspots = useMemo(
    () => romanovHotspots.filter((item) => (item.era === 'both' || item.era === era) && (trustMode === 'public' || item.evidence === 'documented')),
    [era, trustMode]
  );

  const modelViewer = React.createElement('model-viewer' as any, {
    key: `${era}-${trustMode}`,
    src: modelUrl,
    alt: `Палаты бояр Романовых — ${eraCopy[era].year}`,
    'camera-controls': true,
    'auto-rotate': true,
    'rotation-per-second': '12deg',
    'shadow-intensity': '1',
    'shadow-softness': '0.8',
    exposure: '1.05',
    'interaction-prompt': 'auto',
    style: {
      width: '100%',
      height: 'min(62vh, 560px)',
      minHeight: '380px',
      display: 'block',
      background: 'radial-gradient(circle at 50% 35%, #252a31 0%, #111419 52%, #070809 100%)',
      borderRadius: '22px'
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.header}>
        <Text style={styles.kicker}>ROMANOV · SPATIAL PREVIEW</Text>
        <Text style={styles.title}>Покрутите настоящую модель</Text>
        <Text style={styles.body}>Это интерактивный web-viewer тех же GLB, которые нативное приложение загружает в AR/VR. Здесь нет имитации AR — только проверка модели, эпох и уровня достоверности.</Text>
      </View>

      <View style={styles.controlBlock}>
        <Text style={styles.controlKicker}>ЭПОХА</Text>
        <View style={styles.row}>
          {(['1857', '1859'] as RomanovEra[]).map((item) => (
            <Pressable key={item} onPress={() => setEra(item)} style={[styles.button, era === item && styles.buttonActive]}>
              <Text style={[styles.buttonText, era === item && styles.buttonTextActive]}>{eraCopy[item].year}</Text>
              <Text style={[styles.buttonSub, era === item && styles.buttonSubActive]}>{eraCopy[item].title}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.controlKicker}>РЕЖИМ ДОВЕРИЯ</Text>
        <View style={styles.row}>
          {(['documented', 'public'] as TrustMode[]).map((item) => (
            <Pressable key={item} onPress={() => setTrustMode(item)} style={[styles.trustButton, trustMode === item && styles.trustButtonActive]}>
              <Text style={[styles.trustButtonText, trustMode === item && styles.trustButtonTextActive]}>{trustCopy[item].button}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.trustDescription}><Text style={styles.trustStrong}>{trustCopy[trustMode].title}. </Text>{trustCopy[trustMode].body}</Text>
      </View>

      <View style={styles.viewer}>{modelViewer}</View>

      <View style={styles.hotspotSection}>
        <Text style={styles.sectionTitle}>Точки истории в выбранной сцене</Text>
        <Text style={styles.sectionBody}>В нативном AR эти точки нажимаются прямо на модели и запускают аудио. В preview они показаны как доказательная карта сцены.</Text>
        {hotspots.map((hotspot, index) => {
          const sources = hotspot.sourceIds.map((id) => romanovSources.find((source) => source.id === id)).filter(Boolean);
          return (
            <View key={hotspot.id} style={styles.hotspotCard}>
              <View style={styles.hotspotNumber}><Text style={styles.hotspotNumberText}>{index + 1}</Text></View>
              <View style={styles.hotspotCopy}>
                <Text style={styles.hotspotTitle}>{hotspot.titleRu}</Text>
                <Text style={styles.hotspotEvidence}>{hotspot.evidence === 'documented' ? 'Подтверждено источником' : hotspot.evidence === 'reconstructed' ? 'Исследовательская реконструкция' : 'Гипотеза'}</Text>
                <Text style={styles.hotspotStory}>{hotspot.storyRu}</Text>
                <Text style={styles.sourceKicker}>ИСТОЧНИКИ</Text>
                <View style={styles.sourceWrap}>
                  {sources.map((source) => source && (
                    <Pressable key={source.id} onPress={() => Linking.openURL(source.sourcePage)} style={styles.sourceChip}>
                      <Text style={styles.sourceChipText}>{source.titleRu} ↗</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.nativeNote}>
        <Text style={styles.nativeTitle}>Что появится только на телефоне</Text>
        <Text style={styles.nativeBody}>ARKit / ARCore · камера · ручная X/Y/Z/yaw/scale-калибровка · измерение ошибки по 5 контрольным точкам на 5/10/15 м · portal scene · native audio.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flexGrow: 1, backgroundColor: '#070809', padding: 22, paddingBottom: 64 },
  header: { alignItems: 'center', maxWidth: 760, width: '100%', alignSelf: 'center', marginTop: 16 },
  kicker: { color: '#b99b69', fontSize: 10, letterSpacing: 1.7, fontWeight: '900' },
  title: { color: '#fff8ea', fontSize: 32, lineHeight: 38, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  body: { color: '#a7abb2', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 9, maxWidth: 650 },
  controlBlock: { maxWidth: 760, width: '100%', alignSelf: 'center', marginTop: 22, borderRadius: 20, borderWidth: 1, borderColor: '#30343a', backgroundColor: '#101318', padding: 15 },
  controlKicker: { color: '#7f848d', fontSize: 8, letterSpacing: 1.4, fontWeight: '900', marginTop: 4, marginBottom: 7 },
  row: { flexDirection: 'row', gap: 9, marginBottom: 10 },
  button: { flex: 1, minHeight: 58, borderRadius: 14, borderWidth: 1, borderColor: '#3c4148', backgroundColor: '#15191e', justifyContent: 'center', paddingHorizontal: 13 },
  buttonActive: { borderColor: '#d7bb84', backgroundColor: '#211c14' },
  buttonText: { color: '#d0d2d6', fontSize: 13, fontWeight: '900' },
  buttonTextActive: { color: '#f0d39b' },
  buttonSub: { color: '#747982', fontSize: 9, marginTop: 2 },
  buttonSubActive: { color: '#bca77f' },
  trustButton: { flex: 1, minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: '#3c4148', alignItems: 'center', justifyContent: 'center' },
  trustButtonActive: { borderColor: '#917a56', backgroundColor: '#211c14' },
  trustButtonText: { color: '#979ba3', fontSize: 11, fontWeight: '900' },
  trustButtonTextActive: { color: '#e8c98c' },
  trustDescription: { color: '#858a92', fontSize: 10, lineHeight: 15 },
  trustStrong: { color: '#c9b58e', fontWeight: '900' },
  viewer: { maxWidth: 980, width: '100%', alignSelf: 'center', marginTop: 16, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: '#2d3137' },
  hotspotSection: { maxWidth: 760, width: '100%', alignSelf: 'center', marginTop: 24 },
  sectionTitle: { color: '#f3eee4', fontSize: 20, fontWeight: '900' },
  sectionBody: { color: '#858a92', fontSize: 11, lineHeight: 17, marginTop: 5, marginBottom: 6 },
  hotspotCard: { flexDirection: 'row', gap: 12, borderRadius: 17, borderWidth: 1, borderColor: '#2d3238', backgroundColor: '#101318', padding: 14, marginTop: 9 },
  hotspotNumber: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#d7bb84', alignItems: 'center', justifyContent: 'center' },
  hotspotNumberText: { color: '#17130d', fontWeight: '900' },
  hotspotCopy: { flex: 1 },
  hotspotTitle: { color: '#ebe7de', fontSize: 14, fontWeight: '900' },
  hotspotEvidence: { color: '#b99b69', fontSize: 9, fontWeight: '900', marginTop: 3 },
  hotspotStory: { color: '#969aa2', fontSize: 11, lineHeight: 16, marginTop: 7 },
  sourceKicker: { color: '#777c84', fontSize: 8, letterSpacing: 1.2, fontWeight: '900', marginTop: 10 },
  sourceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5 },
  sourceChip: { borderRadius: 10, borderWidth: 1, borderColor: '#3b4047', backgroundColor: '#161a1f', paddingHorizontal: 8, paddingVertical: 6 },
  sourceChipText: { color: '#c7b58f', fontSize: 9, fontWeight: '700' },
  nativeNote: { maxWidth: 760, width: '100%', alignSelf: 'center', marginTop: 24, borderRadius: 18, borderWidth: 1, borderColor: '#443c31', backgroundColor: '#17130f', padding: 15 },
  nativeTitle: { color: '#e7c98f', fontSize: 13, fontWeight: '900' },
  nativeBody: { color: '#9d9486', fontSize: 10, lineHeight: 16, marginTop: 5 }
});
