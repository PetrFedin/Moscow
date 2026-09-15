import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Viro3DObject,
  ViroAmbientLight,
  ViroARScene,
  ViroNode,
  ViroPortal,
  ViroPortalScene,
  ViroScene,
  ViroSphere,
  ViroText,
  ViroXRSceneNavigator,
  isQuest
} from '@reactvision/react-viro';
import { playTextGuide, stopTextGuide } from '../audio/audioGuide';
import RomanovFieldTest from './RomanovFieldTest.native';
import RomanovSurveyPacket from './RomanovSurveyPacket.native';
import { detectLanguage } from '../../i18n';
import {
  evidenceLabels,
  getRomanovHotspots,
  romanovHotspots,
  type RomanovEra,
  type RomanovHotspot
} from '../../spatial/romanov-hotspots';
import {
  defaultRomanovCalibration,
  isCalibrationProfile,
  type CalibrationProfile
} from '../../spatial/calibration';

const CALIBRATION_STORAGE_KEY = 'moscow:p0:romanov-calibration:v1';
const ERA_STORAGE_KEY = 'moscow:p0:romanov-era:v1';
const TRUST_STORAGE_KEY = 'moscow:p0:romanov-trust-mode:v1';
const calibrationEnabled = __DEV__ || process.env.EXPO_PUBLIC_ENABLE_CALIBRATION === '1';
const externalModelUrl = process.env.EXPO_PUBLIC_ROMANOV_GLB_URL;

type TrustMode = 'documented' | 'public';

const bundledModelSources: Record<RomanovEra, Record<TrustMode, number>> = {
  '1857': {
    documented: require('../../../assets/models/romanov-1857-documented-v1.glb'),
    public: require('../../../assets/models/romanov-1857-public-v1.glb')
  },
  '1859': {
    documented: require('../../../assets/models/romanov-1859-documented-v1.glb'),
    public: require('../../../assets/models/romanov-1859-public-v1.glb')
  }
};

const eraLabels: Record<RomanovEra, { year: string; title: string; evidence: string }> = {
  '1857': {
    year: '1857',
    title: 'До реставрации',
    evidence: 'Архивное состояние'
  },
  '1859': {
    year: '1859 / 1883',
    title: 'Реставрация Рихтера',
    evidence: 'Ранняя фотофиксация восстановленного состояния'
  }
};

const trustLabels: Record<TrustMode, { short: string; title: string; note: string }> = {
  documented: {
    short: 'Только факты',
    title: 'Подтверждённая геометрия',
    note: 'Показываются только элементы слоя documented.'
  },
  public: {
    short: '+ реконструкция',
    title: 'Публичная исследовательская реконструкция',
    note: 'Documented + reconstructed. Hypothesis-геометрия физически исключена из GLB.'
  }
};

type SceneProps = {
  sceneNavigator?: {
    viroAppProps?: {
      calibration?: CalibrationProfile;
      romanovEra?: RomanovEra;
      trustMode?: TrustMode;
      onHotspot?: (id: string) => void;
    };
  };
};

function RomanovPortal() {
  return (
    <ViroPortalScene passable position={[2.5, 0, -4]}>
      <ViroPortal position={[0, 0, 0]}>
        <Viro3DObject
          source={require('../../../assets/models/romanov-portal-frame.obj')}
          resources={[require('../../../assets/models/romanov-portal-frame.mtl')]}
          type="OBJ"
        />
      </ViroPortal>
      <ViroAmbientLight color="#d7c6a2" intensity={520} />
      <ViroText
        text="ПОРТАЛ · ИСТОРИЧЕСКАЯ СЦЕНА"
        position={[0, 0.3, -3]}
        scale={[0.24, 0.24, 0.24]}
        style={{ fontSize: 18, color: '#f0d39b', textAlign: 'center' }}
      />
      <ViroText
        text="Production-интерьер появится после отдельной проверки интерьеров"
        position={[0, -0.15, -3]}
        scale={[0.13, 0.13, 0.13]}
        style={{ fontSize: 15, color: '#d5d0c6', textAlign: 'center' }}
      />
    </ViroPortalScene>
  );
}

function RomanovSpatialScene({ sceneNavigator }: SceneProps) {
  const calibration = sceneNavigator?.viroAppProps?.calibration ?? defaultRomanovCalibration;
  const romanovEra = sceneNavigator?.viroAppProps?.romanovEra ?? '1859';
  const trustMode = sceneNavigator?.viroAppProps?.trustMode ?? 'public';
  const onHotspot = sceneNavigator?.viroAppProps?.onHotspot;
  const selectedSource = externalModelUrl && romanovEra === '1859' && trustMode === 'public'
    ? { uri: externalModelUrl }
    : bundledModelSources[romanovEra][trustMode];
  const era = eraLabels[romanovEra];
  const hotspots = getRomanovHotspots(romanovEra).filter((hotspot) => trustMode === 'public' || hotspot.evidence === 'documented');

  const content = (
    <>
      <ViroAmbientLight color="#ffffff" intensity={650} />
      <ViroNode
        position={calibration.translation}
        rotation={calibration.rotationEulerDeg}
        scale={[calibration.scale, calibration.scale, calibration.scale]}
      >
        <Viro3DObject key={`${romanovEra}-${trustMode}`} source={selectedSource} type="GLB" />
        <ViroText
          text={`${era.year} · ${trustMode === 'documented' ? 'FACT' : 'RESEARCH'} · ${isQuest ? 'VR' : 'AR'}`}
          position={[0, 14.2, 0]}
          scale={[0.24, 0.24, 0.24]}
          style={{ fontSize: 18, color: '#f0d39b', textAlign: 'center' }}
        />
        {hotspots.map((hotspot, index) => (
          <ViroNode key={`${romanovEra}-${trustMode}-${hotspot.id}`} position={hotspot.position}>
            <ViroSphere
              radius={0.24}
              widthSegmentCount={12}
              heightSegmentCount={12}
              onClick={() => onHotspot?.(hotspot.id)}
            />
            <ViroText
              text={String(index + 1)}
              position={[0, 0.05, -0.26]}
              scale={[0.11, 0.11, 0.11]}
              onClick={() => onHotspot?.(hotspot.id)}
              style={{ fontSize: 20, color: '#17130d', textAlign: 'center' }}
            />
          </ViroNode>
        ))}
      </ViroNode>
      <RomanovPortal />
    </>
  );

  return isQuest ? <ViroScene>{content}</ViroScene> : <ViroARScene>{content}</ViroARScene>;
}

const RomanovSpatialSceneFactory = RomanovSpatialScene as unknown as () => React.JSX.Element;

type CalibrationSliderProps = {
  label: string;
  value: number;
  minimumValue: number;
  maximumValue: number;
  step: number;
  onValueChange: (value: number) => void;
};

function CalibrationSlider({ label, value, minimumValue, maximumValue, step, onValueChange }: CalibrationSliderProps) {
  return (
    <View style={styles.controlRow}>
      <View style={styles.controlLabelRow}>
        <Text style={styles.controlLabel}>{label}</Text>
        <Text style={styles.controlValue}>{value.toFixed(step < 1 ? 2 : 0)}</Text>
      </View>
      <Slider
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor="#d7bb84"
        maximumTrackTintColor="#4b4f55"
        thumbTintColor="#f0d39b"
      />
    </View>
  );
}

export default function MoscowSpatialNavigator() {
  const language = detectLanguage();
  const [calibration, setCalibration] = useState<CalibrationProfile>(defaultRomanovCalibration);
  const [romanovEra, setRomanovEra] = useState<RomanovEra>('1859');
  const [trustMode, setTrustMode] = useState<TrustMode>('public');
  const [panelOpen, setPanelOpen] = useState(false);
  const [fieldTestOpen, setFieldTestOpen] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');

  const activeHotspot = useMemo<RomanovHotspot | null>(
    () => romanovHotspots.find((item) => item.id === activeHotspotId) ?? null,
    [activeHotspotId]
  );

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(CALIBRATION_STORAGE_KEY),
      AsyncStorage.getItem(ERA_STORAGE_KEY),
      AsyncStorage.getItem(TRUST_STORAGE_KEY)
    ])
      .then(([rawCalibration, rawEra, rawTrust]) => {
        if (rawCalibration) {
          const parsed: unknown = JSON.parse(rawCalibration);
          if (isCalibrationProfile(parsed)) setCalibration(parsed);
        }
        if (rawEra === '1857' || rawEra === '1859') setRomanovEra(rawEra);
        if (rawTrust === 'documented' || rawTrust === 'public') setTrustMode(rawTrust);
      })
      .catch(() => undefined);

    return () => {
      stopTextGuide().catch(() => undefined);
    };
  }, []);

  const selectEra = (era: RomanovEra) => {
    setRomanovEra(era);
    setActiveHotspotId(null);
    stopTextGuide().catch(() => undefined);
    AsyncStorage.setItem(ERA_STORAGE_KEY, era).catch(() => undefined);
  };

  const selectTrustMode = (mode: TrustMode) => {
    setTrustMode(mode);
    setActiveHotspotId(null);
    stopTextGuide().catch(() => undefined);
    AsyncStorage.setItem(TRUST_STORAGE_KEY, mode).catch(() => undefined);
  };

  const activateHotspot = (id: string) => {
    const hotspot = romanovHotspots.find((item) => item.id === id);
    if (!hotspot) return;
    setActiveHotspotId(id);
    const story = language === 'ru' ? hotspot.storyRu : hotspot.storyEn;
    playTextGuide(story, language === 'ru' ? 'ru-RU' : 'en-US');
  };

  const replayHotspot = () => {
    if (!activeHotspot) return;
    playTextGuide(
      language === 'ru' ? activeHotspot.storyRu : activeHotspot.storyEn,
      language === 'ru' ? 'ru-RU' : 'en-US'
    );
  };

  const closeHotspot = () => {
    setActiveHotspotId(null);
    stopTextGuide().catch(() => undefined);
  };

  const setTranslation = (axis: 0 | 1 | 2, value: number) => {
    setCalibration((current) => {
      const translation: [number, number, number] = [...current.translation];
      translation[axis] = value;
      return { ...current, translation };
    });
    setSaveState('idle');
  };

  const setYaw = (value: number) => {
    setCalibration((current) => ({
      ...current,
      rotationEulerDeg: [current.rotationEulerDeg[0], value, current.rotationEulerDeg[2]]
    }));
    setSaveState('idle');
  };

  const saveCalibration = async () => {
    try {
      await AsyncStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(calibration));
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  const resetCalibration = async () => {
    setCalibration(defaultRomanovCalibration);
    setSaveState('idle');
    await AsyncStorage.removeItem(CALIBRATION_STORAGE_KEY).catch(() => undefined);
  };

  const era = eraLabels[romanovEra];
  const evidence = evidenceLabels[language];
  const trust = trustLabels[trustMode];

  return (
    <View style={styles.root}>
      <ViroXRSceneNavigator
        initialScene={{ scene: RomanovSpatialSceneFactory }}
        viroAppProps={{ calibration, romanovEra, trustMode, onHotspot: activateHotspot }}
        pbrEnabled
        hdrEnabled
        shadowsEnabled
        multisamplingEnabled
        style={StyleSheet.absoluteFill}
      />

      {!isQuest && (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <View style={styles.eraPanel}>
            <Text style={styles.eraKicker}>3D TIME MACHINE</Text>
            <View style={styles.eraButtons}>
              {(['1857', '1859'] as RomanovEra[]).map((item) => (
                <Pressable key={item} onPress={() => selectEra(item)} style={[styles.eraButton, romanovEra === item && styles.eraButtonActive]}>
                  <Text style={[styles.eraButtonText, romanovEra === item && styles.eraButtonTextActive]}>{eraLabels[item].year}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.eraTitle}>{era.title}</Text>
            <Text style={styles.eraEvidence}>{era.evidence}</Text>
            <Text style={styles.trustKicker}>РЕЖИМ ДОВЕРИЯ</Text>
            <View style={styles.trustButtons}>
              {(['documented', 'public'] as TrustMode[]).map((item) => (
                <Pressable key={item} onPress={() => selectTrustMode(item)} style={[styles.trustButton, trustMode === item && styles.trustButtonActive]}>
                  <Text style={[styles.trustButtonText, trustMode === item && styles.trustButtonTextActive]}>{trustLabels[item].short}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.trustNote}>{trust.title} · {trust.note}</Text>
          </View>

          {activeHotspot && !panelOpen && (
            <View style={styles.hotspotPanel}>
              <View style={styles.hotspotTop}>
                <View style={styles.hotspotCopy}>
                  <Text style={styles.hotspotEvidence}>{evidence[activeHotspot.evidence]}</Text>
                  <Text style={styles.hotspotTitle}>{language === 'ru' ? activeHotspot.titleRu : activeHotspot.titleEn}</Text>
                </View>
                <Pressable style={styles.hotspotClose} onPress={closeHotspot}><Text style={styles.hotspotCloseText}>×</Text></Pressable>
              </View>
              <Text style={styles.hotspotStory}>{language === 'ru' ? activeHotspot.storyRu : activeHotspot.storyEn}</Text>
              <Pressable style={styles.audioReplay} onPress={replayHotspot}><Text style={styles.audioReplayText}>▶ {language === 'ru' ? 'Слушать ещё раз' : 'Replay audio'}</Text></Pressable>
            </View>
          )}

          {calibrationEnabled && (
            <>
              <Pressable style={styles.calibrationToggle} onPress={() => { setPanelOpen((current) => !current); closeHotspot(); }}>
                <Text style={styles.calibrationToggleText}>{panelOpen ? 'Закрыть калибровку' : 'Калибровка AR'}</Text>
              </Pressable>

              {panelOpen && (
                <View style={styles.panel}>
                  <Text style={styles.panelKicker}>P0 · MANUAL ALIGNMENT</Text>
                  <Text style={styles.panelTitle}>Совместите модель с фасадом</Text>
                  <Text style={styles.panelBody}>Настройте позицию, поворот и масштаб по устойчивым архитектурным ориентирам. Один профиль используется для обеих эпох и обоих режимов доверия.</Text>
                  <CalibrationSlider label="X · вправо / влево" value={calibration.translation[0]} minimumValue={-10} maximumValue={10} step={0.05} onValueChange={(value) => setTranslation(0, value)} />
                  <CalibrationSlider label="Y · выше / ниже" value={calibration.translation[1]} minimumValue={-8} maximumValue={8} step={0.05} onValueChange={(value) => setTranslation(1, value)} />
                  <CalibrationSlider label="Z · ближе / дальше" value={calibration.translation[2]} minimumValue={-20} maximumValue={-1} step={0.05} onValueChange={(value) => setTranslation(2, value)} />
                  <CalibrationSlider label="Yaw · поворот" value={calibration.rotationEulerDeg[1]} minimumValue={-180} maximumValue={180} step={1} onValueChange={setYaw} />
                  <CalibrationSlider label="Scale · масштаб" value={calibration.scale} minimumValue={0.25} maximumValue={3} step={0.01} onValueChange={(value) => { setCalibration((current) => ({ ...current, scale: value })); setSaveState('idle'); }} />
                  <View style={styles.actionRow}>
                    <Pressable style={styles.primaryButton} onPress={saveCalibration}><Text style={styles.primaryButtonText}>Сохранить</Text></Pressable>
                    <Pressable style={styles.secondaryButton} onPress={resetCalibration}><Text style={styles.secondaryButtonText}>Сбросить</Text></Pressable>
                  </View>
                  <Pressable style={styles.fieldButton} onPress={() => { setPanelOpen(false); setSurveyOpen(true); }}>
                    <Text style={styles.fieldButtonText}>Обмерный пакет · 5 точек</Text>
                  </Pressable>
                  <Pressable style={styles.fieldButton} onPress={() => { setPanelOpen(false); setFieldTestOpen(true); }}>
                    <Text style={styles.fieldButtonText}>Измерить ошибку · 5 / 10 / 15 м</Text>
                  </Pressable>
                  {saveState === 'saved' && <Text style={styles.savedText}>Профиль сохранён на устройстве</Text>}
                  {saveState === 'error' && <Text style={styles.errorText}>Не удалось сохранить профиль</Text>}
                </View>
              )}
            </>
          )}
        </View>
      )}

      {fieldTestOpen && !isQuest && <RomanovFieldTest calibration={calibration} era={romanovEra} onClose={() => setFieldTestOpen(false)} />}
      {surveyOpen && !isQuest && <RomanovSurveyPacket onClose={() => setSurveyOpen(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  eraPanel: { position: 'absolute', top: 54, left: 14, right: 14, borderRadius: 20, backgroundColor: 'rgba(12,14,17,0.90)', borderWidth: 1, borderColor: '#4c463a', padding: 13 },
  eraKicker: { color: '#b99b69', fontSize: 9, letterSpacing: 1.5, fontWeight: '900' },
  eraButtons: { flexDirection: 'row', gap: 8, marginTop: 8 },
  eraButton: { flex: 1, minHeight: 36, borderRadius: 12, borderWidth: 1, borderColor: '#4a4d53', alignItems: 'center', justifyContent: 'center' },
  eraButtonActive: { backgroundColor: '#d7bb84', borderColor: '#d7bb84' },
  eraButtonText: { color: '#ddd5c8', fontSize: 11, fontWeight: '900' },
  eraButtonTextActive: { color: '#17130d' },
  eraTitle: { color: '#fff8ea', fontSize: 14, fontWeight: '900', marginTop: 8 },
  eraEvidence: { color: '#a7abb1', fontSize: 9, marginTop: 2 },
  trustKicker: { color: '#8f949b', fontSize: 8, letterSpacing: 1.2, fontWeight: '900', marginTop: 9 },
  trustButtons: { flexDirection: 'row', gap: 8, marginTop: 6 },
  trustButton: { flex: 1, minHeight: 34, borderRadius: 11, borderWidth: 1, borderColor: '#454951', alignItems: 'center', justifyContent: 'center' },
  trustButtonActive: { backgroundColor: '#262119', borderColor: '#9d845b' },
  trustButtonText: { color: '#a7abb2', fontSize: 10, fontWeight: '900' },
  trustButtonTextActive: { color: '#e8c98c' },
  trustNote: { color: '#777c84', fontSize: 8.5, lineHeight: 12, marginTop: 6 },
  calibrationToggle: { position: 'absolute', top: 272, left: 18, borderRadius: 16, backgroundColor: 'rgba(12,14,17,0.88)', borderWidth: 1, borderColor: '#806f52', paddingHorizontal: 14, paddingVertical: 11 },
  calibrationToggleText: { color: '#f0d39b', fontSize: 12, fontWeight: '900' },
  hotspotPanel: { position: 'absolute', left: 14, right: 14, bottom: 26, borderRadius: 22, backgroundColor: 'rgba(15,18,22,0.97)', borderWidth: 1, borderColor: '#5b5141', padding: 17 },
  hotspotTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  hotspotCopy: { flex: 1 },
  hotspotEvidence: { color: '#d7bb84', fontSize: 9, letterSpacing: 1.1, fontWeight: '900' },
  hotspotTitle: { color: '#fff8ea', fontSize: 20, lineHeight: 24, fontWeight: '900', marginTop: 5 },
  hotspotStory: { color: '#c5c7cc', fontSize: 13, lineHeight: 19, marginTop: 10 },
  hotspotClose: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: '#454951', alignItems: 'center', justifyContent: 'center' },
  hotspotCloseText: { color: '#ddd', fontSize: 21, lineHeight: 22 },
  audioReplay: { marginTop: 12, minHeight: 42, borderRadius: 13, backgroundColor: '#27231c', alignItems: 'center', justifyContent: 'center' },
  audioReplayText: { color: '#e8c98c', fontSize: 12, fontWeight: '900' },
  panel: { position: 'absolute', left: 14, right: 14, bottom: 24, borderRadius: 22, backgroundColor: 'rgba(15,18,22,0.96)', borderWidth: 1, borderColor: '#555048', padding: 17 },
  panelKicker: { color: '#b99b69', fontSize: 9, letterSpacing: 1.4, fontWeight: '900' },
  panelTitle: { color: '#fff8ea', fontSize: 20, fontWeight: '900', marginTop: 5 },
  panelBody: { color: '#adb0b6', fontSize: 12, lineHeight: 17, marginTop: 7, marginBottom: 8 },
  controlRow: { marginTop: 8 },
  controlLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  controlLabel: { color: '#d0d1d4', fontSize: 11, fontWeight: '700' },
  controlValue: { color: '#e8c98c', fontSize: 11, fontVariant: ['tabular-nums'] },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  primaryButton: { flex: 1, borderRadius: 14, backgroundColor: '#d7bb84', paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { color: '#17130d', fontSize: 12, fontWeight: '900' },
  secondaryButton: { flex: 1, borderRadius: 14, borderWidth: 1, borderColor: '#4d5158', paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#d7d7d9', fontSize: 12, fontWeight: '800' },
  fieldButton: { minHeight: 42, borderRadius: 14, borderWidth: 1, borderColor: '#806f52', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  fieldButtonText: { color: '#e8c98c', fontSize: 11, fontWeight: '900' },
  savedText: { color: '#9ed0a7', fontSize: 10, marginTop: 8 },
  errorText: { color: '#e89b94', fontSize: 10, marginTop: 8 }
});
