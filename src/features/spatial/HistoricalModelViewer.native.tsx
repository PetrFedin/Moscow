import React, { useEffect, useRef, useState } from 'react';
import { Linking, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Viro3DObject,
  Viro3DSceneNavigator,
  ViroAmbientLight,
  ViroDirectionalLight,
  ViroNode,
  ViroOrbitCamera,
  ViroPinchStateTypes,
  ViroRotateStateTypes,
  ViroScene,
  ViroSphere,
  ViroText,
  isQuest
} from '@reactvision/react-viro';
import { buildRomanovHotspotNarration, evidenceLabels, getRomanovHotspots, romanovHotspotToViroPosition, type RomanovEra } from '../../spatial/romanov-hotspots';
import { getRomanovModelSource, type RomanovTrustMode } from '../../spatial/romanovModelPack.native';
import { getRomanovSourceById } from '../../spatial/romanov-sources';
import { playTextGuide, stopTextGuide } from '../audio/audioGuide';
import PhysicalPressable from '../../ui/PhysicalPressable';
import { speechLocale, tr, type AppLanguage } from '../../i18n';

type Props = {
  language?: AppLanguage;
  onClose: () => void;
  onBackToArchive: () => void;
  onOpenSpatial: () => void;
  initialEra?: RomanovEra;
  initialTrustMode?: RomanovTrustMode;
  onStateChange?: (state: { era: RomanovEra; trustMode: RomanovTrustMode }) => void;
};

type SceneProps = {
  sceneNavigator?: {
    viroAppProps?: {
      era?: RomanovEra;
      trustMode?: RomanovTrustMode;
      selectedHotspotId?: string | null;
      onHotspotPress?: (id: string) => void;
    };
  };
};

const eraLabels: Record<RomanovEra, { year: string }> = {
  '1857': { year: '1857' },
  '1859': { year: '1859 / 1883' }
};

function eraTitle(era: RomanovEra, language: AppLanguage) {
  return era === '1857'
    ? tr(language, 'До реставрации', 'Before restoration', '修复前')
    : tr(language, 'После реставрации Рихтера', 'After Richter restoration', '里希特修复后');
}

function hotspotTitle(hotspot: ReturnType<typeof getRomanovHotspots>[number], language: AppLanguage) {
  return language === 'zh' ? hotspot.titleZh : language === 'en' ? hotspot.titleEn : hotspot.titleRu;
}

function hotspotStory(hotspot: ReturnType<typeof getRomanovHotspots>[number], language: AppLanguage) {
  return language === 'zh' ? hotspot.storyZh : language === 'en' ? hotspot.storyEn : hotspot.storyRu;
}

function sourceTitle(source: NonNullable<ReturnType<typeof getRomanovSourceById>>, language: AppLanguage) {
  return language === 'zh' ? source.titleZh : language === 'en' ? source.titleEn : source.titleRu;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function RomanovInspectionScene({ sceneNavigator }: SceneProps) {
  const era = sceneNavigator?.viroAppProps?.era ?? '1859';
  const trustMode = sceneNavigator?.viroAppProps?.trustMode ?? 'public';
  const selectedHotspotId = sceneNavigator?.viroAppProps?.selectedHotspotId ?? null;
  const onHotspotPress = sceneNavigator?.viroAppProps?.onHotspotPress;
  const hotspots = getRomanovHotspots(era, trustMode);
  const [yaw, setYaw] = useState(-12);
  const [scale, setScale] = useState(0.78);
  const rotateBase = useRef(yaw);
  const pinchBase = useRef(scale);

  const onRotate = (state: number, factor: number) => {
    if (state === ViroRotateStateTypes.ROTATE_START) rotateBase.current = yaw;
    setYaw(rotateBase.current + factor);
  };

  const onPinch = (state: number, factor: number) => {
    if (state === ViroPinchStateTypes.PINCH_START) pinchBase.current = scale;
    setScale(clamp(pinchBase.current * factor, 0.42, 1.55));
  };

  return (
    <ViroScene>
      <ViroAmbientLight color="#fff3db" intensity={520} />
      <ViroDirectionalLight color="#fff2d3" direction={[-0.4, -1, -0.2]} intensity={650} castsShadow />
      <ViroDirectionalLight color="#9eb8d4" direction={[0.7, -0.2, 0.8]} intensity={240} />
      <ViroOrbitCamera active position={[0, 8.5, 34]} focalPoint={[0, 6.2, 0]} fieldOfView={48} />

      <ViroNode position={[0, -4.4, 0]} rotation={[0, yaw, 0]} scale={[scale, scale, scale]}>
        <Viro3DObject
          key={`${era}-${trustMode}`}
          source={getRomanovModelSource(era, trustMode)}
          type="GLB"
          onRotate={onRotate}
          onPinch={onPinch}
        />
        {hotspots.map((hotspot, index) => {
          const active = hotspot.id === selectedHotspotId;
          const position = romanovHotspotToViroPosition(hotspot.position);
          return (
            <ViroNode key={hotspot.id} position={position}>
              <ViroSphere
                radius={active ? 0.24 : 0.18}
                widthSegmentCount={12}
                heightSegmentCount={8}
                onClick={() => onHotspotPress?.(hotspot.id)}
              />
              <ViroText
                text={String(index + 1).padStart(2, '0')}
                position={[0, 0.42, 0]}
                scale={[0.14, 0.14, 0.14]}
                style={{ fontSize: 15, color: active ? '#fff0c9' : '#d7bb84', textAlign: 'center' }}
              />
            </ViroNode>
          );
        })}
      </ViroNode>

      <ViroText
        text={`${eraLabels[era].year} · ${trustMode === 'documented' ? 'DOCUMENTED' : 'PUBLIC RESEARCH'}`}
        position={[0, 14.5, -1]}
        scale={[0.28, 0.28, 0.28]}
        style={{ fontSize: 17, color: '#f0d39b', textAlign: 'center' }}
      />
    </ViroScene>
  );
}

const RomanovInspectionSceneFactory = RomanovInspectionScene as unknown as () => React.JSX.Element;

export default function HistoricalModelViewer({
  language = 'ru',
  onClose,
  onBackToArchive,
  onOpenSpatial,
  initialEra = '1859',
  initialTrustMode = 'public',
  onStateChange
}: Props) {
  const [era, setEra] = useState<RomanovEra>(initialEra);
  const [trustMode, setTrustMode] = useState<RomanovTrustMode>(initialTrustMode);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [isHotspotSpeaking, setIsHotspotSpeaking] = useState(false);
  const hotspots = getRomanovHotspots(era, trustMode);
  const selectedHotspot = hotspots.find((hotspot) => hotspot.id === selectedHotspotId) ?? hotspots[0] ?? null;

  const stopHotspotAudio = () => {
    void stopTextGuide().catch(() => undefined);
    setIsHotspotSpeaking(false);
  };

  useEffect(() => () => {
    void stopTextGuide().catch(() => undefined);
  }, []);

  const selectHotspot = (id: string) => {
    stopHotspotAudio();
    setSelectedHotspotId(id);
  };

  const toggleHotspotAudio = () => {
    if (!selectedHotspot) return;
    if (isHotspotSpeaking) {
      stopHotspotAudio();
      return;
    }
    setIsHotspotSpeaking(true);
    playTextGuide(
      buildRomanovHotspotNarration(selectedHotspot, language),
      speechLocale(language),
      () => setIsHotspotSpeaking(false)
    );
  };

  const selectEra = (next: RomanovEra) => {
    stopHotspotAudio();
    setEra(next);
    setSelectedHotspotId(null);
    onStateChange?.({ era: next, trustMode });
  };

  const selectTrust = (next: RomanovTrustMode) => {
    stopHotspotAudio();
    setTrustMode(next);
    setSelectedHotspotId(null);
    onStateChange?.({ era, trustMode: next });
  };

  return (
    <View style={styles.root}>
      <Viro3DSceneNavigator
        initialScene={{ scene: RomanovInspectionSceneFactory as never }}
        viroAppProps={{ era, trustMode, selectedHotspotId: selectedHotspot?.id ?? null, onHotspotPress: selectHotspot }}
        debug={false}
        onExitViro={onClose}
        hdrEnabled
        pbrEnabled
        bloomEnabled
        shadowsEnabled
        multisamplingEnabled
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>3D MODEL · ONE ASSET PIPELINE</Text>
            <Text style={styles.title}>{tr(language, 'Палаты бояр Романовых', 'Chambers of the Romanov Boyars', '罗曼诺夫贵族宅邸')}</Text>
            <Text style={styles.subtitle}>{tr(language, 'Текущая эпоха и режим доверия сохраняются при переходе в AR/VR и обратно.', 'The selected era and evidence mode are preserved when entering AR/VR and returning.', '进入AR/VR并返回时，会保留当前时代与证据模式。')}</Text>
          </View>
          <PhysicalPressable style={styles.close} contentStyle={styles.center} onPress={() => { stopHotspotAudio(); onClose(); }} accessibilityLabel={`3D · ${tr(language, 'Закрыть просмотр', 'Close viewer', '关闭查看器')}`}>
            <Text style={styles.closeText}>×</Text>
          </PhysicalPressable>
        </View>

        <View style={styles.controls}>
          <Text style={styles.controlLabel}>{tr(language, 'ЭПОХА', 'ERA', '时代')}</Text>
          <View style={styles.row}>
            {(['1857', '1859'] as RomanovEra[]).map((item) => (
              <PhysicalPressable
                key={item}
                style={[styles.choice, era === item && styles.choiceActive]}
                contentStyle={styles.choiceContent}
                hapticEvent="epoch-snap"
                accessibilityLabel={`3D · ${tr(language, 'Эпоха', 'Era', '时代')} · ${eraLabels[item].year} · ${eraTitle(item, language)}`}
                onPress={() => selectEra(item)}
              >
                <Text style={[styles.choiceYear, era === item && styles.choiceYearActive]}>{eraLabels[item].year}</Text>
                <Text style={styles.choiceSub}>{eraTitle(item, language)}</Text>
              </PhysicalPressable>
            ))}
          </View>

          <Text style={styles.controlLabel}>{tr(language, 'ДОСТОВЕРНОСТЬ', 'EVIDENCE', '证据等级')}</Text>
          <View style={styles.row}>
            <PhysicalPressable
              style={[styles.trust, trustMode === 'documented' && styles.trustActive]}
              contentStyle={styles.center}
              accessibilityLabel={`3D · ${tr(language, 'Только факты', 'Facts only', '仅事实')}`}
              onPress={() => selectTrust('documented')}
            >
              <Text style={[styles.trustText, trustMode === 'documented' && styles.trustTextActive]}>{tr(language, 'Только факты', 'Facts only', '仅事实')}</Text>
            </PhysicalPressable>
            <PhysicalPressable
              style={[styles.trust, trustMode === 'public' && styles.trustActive]}
              contentStyle={styles.center}
              accessibilityLabel={`3D · ${tr(language, 'Реконструкция', 'Reconstruction', '重建')}`}
              onPress={() => selectTrust('public')}
            >
              <Text style={[styles.trustText, trustMode === 'public' && styles.trustTextActive]}>{tr(language, '+ реконструкция', '+ reconstruction', '+ 重建')}</Text>
            </PhysicalPressable>
          </View>
        </View>

        <View style={styles.hotspotDock} pointerEvents="box-none">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hotspotScroller}>
            {hotspots.map((hotspot, index) => {
              const active = selectedHotspot?.id === hotspot.id;
              return (
                <PhysicalPressable
                  key={hotspot.id}
                  style={[styles.hotspotChip, active && styles.hotspotChipActive]}
                  contentStyle={styles.hotspotChipContent}
                  accessibilityLabel={`3D · ${tr(language, 'Точка осмотра', 'Hotspot', '观察点')} · ${hotspotTitle(hotspot, language)}`}
                  onPress={() => selectHotspot(hotspot.id)}
                >
                  <Text style={[styles.hotspotChipIndex, active && styles.hotspotChipIndexActive]}>{String(index + 1).padStart(2, '0')}</Text>
                  <Text style={[styles.hotspotChipText, active && styles.hotspotChipTextActive]} numberOfLines={1}>{hotspotTitle(hotspot, language)}</Text>
                </PhysicalPressable>
              );
            })}
          </ScrollView>

          {selectedHotspot && (
            <View style={styles.hotspotCard}>
              <View style={styles.hotspotCardTop}>
                <View style={styles.hotspotCardCopy}>
                  <Text style={styles.hotspotEvidence}>{evidenceLabels[language][selectedHotspot.evidence]}</Text>
                  <Text style={styles.hotspotTitle}>{hotspotTitle(selectedHotspot, language)}</Text>
                  <Text style={styles.hotspotStory} numberOfLines={4}>{hotspotStory(selectedHotspot, language)}</Text>
                </View>
                <PhysicalPressable
                  style={[styles.audioGuideButton, isHotspotSpeaking && styles.audioGuideButtonActive]}
                  contentStyle={styles.center}
                  accessibilityLabel={isHotspotSpeaking ? tr(language, '3D · Остановить аудиогид точки', '3D · Stop hotspot audio', '3D · 停止观察点音频') : tr(language, '3D · Слушать аудиогид точки', '3D · Play hotspot audio', '3D · 播放观察点音频')}
                  onPress={toggleHotspotAudio}
                >
                  <Text style={[styles.audioGuideIcon, isHotspotSpeaking && styles.audioGuideIconActive]}>
                    {isHotspotSpeaking ? '■' : '▶'}
                  </Text>
                </PhysicalPressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sourceScroller}>
                {selectedHotspot.sourceIds.map((sourceId) => {
                  const source = getRomanovSourceById(sourceId);
                  if (!source) return null;
                  return (
                    <PhysicalPressable
                      key={source.id}
                      style={styles.sourceChip}
                      contentStyle={styles.sourceChipContent}
                      accessibilityLabel={`${tr(language, 'Открыть источник', 'Open source', '打开来源')} · ${sourceTitle(source, language)}`}
                      onPress={() => Linking.openURL(source.sourcePage)}
                    >
                      <Text style={styles.sourceChipText} numberOfLines={1}>{sourceTitle(source, language)} ↗</Text>
                    </PhysicalPressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.bottom}>
          <Text style={styles.gesture}>{tr(language, 'Прямое управление: rotate · pinch · переходы прерываемы', 'Direct control: rotate · pinch · transitions are interruptible', '直接控制：旋转 · 缩放 · 可随时中断切换')}</Text>
          <Text style={styles.modeNote}>{isQuest ? tr(language, 'Quest обнаружен: следующий режим продолжит эту же эпоху в VR.', 'Quest detected: the next mode continues the same era in VR.', '已检测到Quest：下一模式将在VR中继续同一时代。') : tr(language, 'Телефон: следующий режим продолжит эту же эпоху в AR.', 'Phone: the next mode continues the same era in AR.', '手机：下一模式将在AR中继续同一时代。')}</Text>
          <View style={styles.actions}>
            <PhysicalPressable style={styles.secondary} contentStyle={styles.center} accessibilityLabel={`3D · ${tr(language, 'Назад в архив', 'Back to archive', '返回档案')}`} onPress={() => { stopHotspotAudio(); onBackToArchive(); }}>
              <Text style={styles.secondaryText}>{tr(language, '← Архив', '← Archive', '← 档案')}</Text>
            </PhysicalPressable>
            <PhysicalPressable
              style={styles.primary}
              contentStyle={styles.center}
              strong
              hapticEvent="spatial-enter"
              accessibilityLabel={isQuest ? tr(language, '3D · Открыть VR на Quest', '3D · Open VR on Quest', '3D · 在Quest打开VR') : tr(language, '3D · Открыть AR на месте', '3D · Open on-site AR', '3D · 打开现场AR')}
              onPress={() => { stopHotspotAudio(); onOpenSpatial(); }}
            >
              <Text style={styles.primaryText}>{isQuest ? tr(language, 'Открыть VR на Quest', 'Open VR on Quest', '在Quest打开VR') : tr(language, 'Открыть AR на месте', 'Open on-site AR', '打开现场AR')}</Text>
            </PhysicalPressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07090c' },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, padding: 14 },
  headerCopy: { flex: 1, borderRadius: 18, backgroundColor: 'rgba(8,10,13,0.88)', borderWidth: 1, borderColor: '#323740', padding: 13 },
  kicker: { color: '#b99b69', fontSize: 8, letterSpacing: 1.3, fontWeight: '900' },
  title: { color: '#fff8ea', fontSize: 19, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#969ba4', fontSize: 9.5, lineHeight: 14, marginTop: 4 },
  close: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(8,10,13,0.9)', borderWidth: 1, borderColor: '#3d4249' },
  closeText: { color: '#fff8ea', fontSize: 25, lineHeight: 27 },
  controls: { position: 'absolute', top: 126, left: 14, right: 14, borderRadius: 18, backgroundColor: 'rgba(8,10,13,0.86)', borderWidth: 1, borderColor: '#30343a', padding: 11 },
  controlLabel: { color: '#767b84', fontSize: 7.5, letterSpacing: 1.2, fontWeight: '900', marginBottom: 5 },
  row: { flexDirection: 'row', gap: 7, marginBottom: 8 },
  choice: { flex: 1, minHeight: 44, borderRadius: 11, borderWidth: 1, borderColor: '#3b4047' },
  choiceContent: { justifyContent: 'center', paddingHorizontal: 10 },
  choiceActive: { borderColor: '#c5a56d', backgroundColor: '#211b13' },
  choiceYear: { color: '#cacdd2', fontSize: 10.5, fontWeight: '900' },
  choiceYearActive: { color: '#f0d39b' },
  choiceSub: { color: '#777c84', fontSize: 7.5, marginTop: 2 },
  trust: { flex: 1, minHeight: 44, borderRadius: 11, borderWidth: 1, borderColor: '#3b4047' },
  trustActive: { borderColor: '#8f7854', backgroundColor: '#211b13' },
  trustText: { color: '#989da5', fontSize: 9, fontWeight: '900' },
  trustTextActive: { color: '#e8c98c' },
  hotspotDock: { position: 'absolute', left: 14, right: 14, top: 318 },
  hotspotScroller: { gap: 7, paddingRight: 18 },
  hotspotChip: { maxWidth: 210, minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: '#40464e', backgroundColor: 'rgba(10,13,16,0.9)' },
  hotspotChipActive: { borderColor: '#b99b69', backgroundColor: 'rgba(33,27,19,0.94)' },
  hotspotChipContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7 },
  hotspotChipIndex: { color: '#7a8088', fontSize: 8, fontWeight: '900', marginRight: 7 },
  hotspotChipIndexActive: { color: '#e7c98f' },
  hotspotChipText: { color: '#aeb3ba', fontSize: 9, fontWeight: '900', maxWidth: 158 },
  hotspotChipTextActive: { color: '#fff3dc' },
  hotspotCard: { marginTop: 8, borderRadius: 16, borderWidth: 1, borderColor: '#3c424a', backgroundColor: 'rgba(10,13,16,0.94)', padding: 11 },
  hotspotCardTop: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  hotspotCardCopy: { flex: 1, minWidth: 0 },
  hotspotEvidence: { color: '#8baa93', fontSize: 7.5, fontWeight: '900', letterSpacing: 0.6 },
  hotspotTitle: { color: '#fff8ea', fontSize: 14, fontWeight: '900', marginTop: 3 },
  hotspotStory: { color: '#a0a5ad', fontSize: 9.5, lineHeight: 14, marginTop: 4 },
  audioGuideButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#6f6047', backgroundColor: '#211b13' },
  audioGuideButtonActive: { borderColor: '#d7bb84', backgroundColor: '#d7bb84' },
  audioGuideIcon: { color: '#e7c98f', fontSize: 14, fontWeight: '900' },
  audioGuideIconActive: { color: '#17130d' },
  sourceScroller: { gap: 6, paddingTop: 8, paddingRight: 10 },
  sourceChip: { minHeight: 34, maxWidth: 220, borderRadius: 11, borderWidth: 1, borderColor: '#3f454d' },
  sourceChipContent: { justifyContent: 'center', paddingHorizontal: 9 },
  sourceChipText: { color: '#cfbc96', fontSize: 8.5, fontWeight: '800' },
  bottom: { position: 'absolute', left: 14, right: 14, bottom: 18, borderRadius: 20, backgroundColor: 'rgba(8,10,13,0.92)', borderWidth: 1, borderColor: '#363b43', padding: 13 },
  gesture: { color: '#e2d2b4', fontSize: 10, fontWeight: '800' },
  modeNote: { color: '#838891', fontSize: 9, lineHeight: 13, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  secondary: { flex: 1, minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: '#494e55' },
  secondaryText: { color: '#c8b995', fontSize: 9.5, fontWeight: '900' },
  primary: { flex: 1.35, minHeight: 44, borderRadius: 13, backgroundColor: '#d7bb84' },
  primaryText: { color: '#17130d', fontSize: 10, fontWeight: '900' }
});
