import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Viro3DObject,
  ViroAmbientLight,
  ViroARScene,
  ViroNode,
  ViroPortal,
  ViroPortalScene,
  ViroScene,
  ViroText,
  ViroXRSceneNavigator,
  isQuest,
  type ViroARHitTestResult
} from '@reactvision/react-viro';
import {
  defaultRomanovCalibration,
  isCalibrationProfile,
  type CalibrationProfile
} from '../../spatial/calibration';
import type { RomanovFieldSession } from '../../spatial/fieldVerification';
import type { RomanovPersistentAnchor } from '../../spatial/persistentAnchor';
import type { RomanovEra } from '../../spatial/romanov-hotspots';
import { getRomanovModelSource, type RomanovTrustMode } from '../../spatial/romanovModelPack.native';
import { summarizeRomanovReleaseGate } from '../../spatial/romanovReleaseGate';
import {
  createEmptyRomanovSurveyPacket,
  type RomanovSurveyPacket
} from '../../spatial/romanovSurvey';
import type { SpatialStage } from '../../e2e/experienceContract';
import PhysicalPressable from '../../ui/PhysicalPressable';
import { haptic } from '../../ui/haptics';
import RomanovFieldTest from './RomanovFieldTest.native';
import RomanovSurveyPacket from './RomanovSurveyPacket.native';

const CALIBRATION_KEY = 'moscow:p0:romanov-calibration:v1';
const SURVEY_KEY = 'moscow:p0:romanov-survey-packet:v1';
const FIELD_KEY = 'moscow:p0:romanov-field-sessions:v1';
const ANCHOR_KEY = 'moscow:p0:romanov-persistent-anchors:v1';
const ERA_KEY = 'moscow:p0:romanov-era:v1';
const TRUST_KEY = 'moscow:p0:romanov-trust-mode:v1';

const HIT_PRIORITY: ViroARHitTestResult['type'][] = [
  'DepthPoint',
  'ExistingPlaneUsingExtent',
  'ExistingPlane',
  'FeaturePoint'
];

type Props = {
  initialEra?: RomanovEra;
  initialTrustMode?: RomanovTrustMode;
  onBackToModel?: () => void;
  onClose?: () => void;
};

type LocalAnchor = {
  anchorId: string;
  hitType: ViroARHitTestResult['type'];
  position: [number, number, number];
};

type SceneProps = {
  sceneNavigator?: {
    viroAppProps?: {
      calibration?: CalibrationProfile;
      era?: RomanovEra;
      trustMode?: RomanovTrustMode;
      requestId?: number;
      portalVisible?: boolean;
      onCandidate?: (hitType: ViroARHitTestResult['type']) => void;
      onAnchored?: (anchor: LocalAnchor) => void;
      onAnchorError?: (message: string) => void;
    };
  };
};

const isUsablePoint = (value?: number[] | null): value is [number, number, number] => Boolean(
  Array.isArray(value)
  && value.length >= 3
  && value.slice(0, 3).every(Number.isFinite)
  && !(value[0] === 0 && value[1] === 0 && value[2] === 0)
);

function pickHit(results: ViroARHitTestResult[]) {
  for (const type of HIT_PRIORITY) {
    const match = results.find((item) => item.type === type && isUsablePoint(item.transform?.position));
    if (match) return match;
  }
  return null;
}

function PortalScene() {
  return (
    <ViroPortalScene passable position={[2.6, 0, -4]}>
      <ViroPortal position={[0, 0, 0]}>
        <Viro3DObject
          source={require('../../../assets/models/romanov-portal-frame.obj')}
          resources={[require('../../../assets/models/romanov-portal-frame.mtl')]}
          type="OBJ"
        />
      </ViroPortal>
      <ViroAmbientLight color="#dac79f" intensity={520} />
      <ViroText
        text="ИСТОРИЧЕСКИЙ ПОРТАЛ"
        position={[0, 0.3, -3]}
        scale={[0.23, 0.23, 0.23]}
        style={{ fontSize: 18, color: '#f0d39b', textAlign: 'center' }}
      />
      <ViroText
        text="Интерьер остаётся demo-layer до отдельной исторической проверки"
        position={[0, -0.2, -3]}
        scale={[0.12, 0.12, 0.12]}
        style={{ fontSize: 14, color: '#d2cdc3', textAlign: 'center' }}
      />
    </ViroPortalScene>
  );
}

function SpatialScene({ sceneNavigator }: SceneProps) {
  const arRef = useRef<ViroARScene | null>(null);
  const lastRequest = useRef(0);
  const calibration = sceneNavigator?.viroAppProps?.calibration ?? defaultRomanovCalibration;
  const era = sceneNavigator?.viroAppProps?.era ?? '1859';
  const trustMode = sceneNavigator?.viroAppProps?.trustMode ?? 'public';
  const requestId = sceneNavigator?.viroAppProps?.requestId ?? 0;
  const portalVisible = sceneNavigator?.viroAppProps?.portalVisible ?? false;
  const onCandidate = sceneNavigator?.viroAppProps?.onCandidate;
  const onAnchored = sceneNavigator?.viroAppProps?.onAnchored;
  const onAnchorError = sceneNavigator?.viroAppProps?.onAnchorError;

  useEffect(() => {
    if (isQuest || requestId <= 0 || requestId === lastRequest.current) return;
    lastRequest.current = requestId;
    let cancelled = false;

    const run = async () => {
      const scene = arRef.current;
      if (!scene) {
        onAnchorError?.('AR scene ещё не готова. Дождитесь стабилизации tracking.');
        return;
      }
      const { width, height } = Dimensions.get('window');
      const results = await scene.performARHitTestWithPoint(width / 2, height / 2) as ViroARHitTestResult[];
      if (cancelled) return;
      const hit = pickHit(Array.isArray(results) ? results : []);
      if (!hit) {
        onAnchorError?.('Устойчивый кандидат не найден. Наведите центр на фасад и повторите.');
        return;
      }
      onCandidate?.(hit.type);
      const node = await scene.createAnchoredNode(hit);
      if (cancelled) return;
      if (!node?.anchorId) {
        onAnchorError?.('AR runtime не вернул anchorId.');
        return;
      }
      const position = node.transform?.position ?? hit.transform.position;
      onAnchored?.({
        anchorId: node.anchorId,
        hitType: hit.type,
        position: [position[0], position[1], position[2]]
      });
    };

    run().catch((error) => {
      if (!cancelled) onAnchorError?.(error instanceof Error ? error.message : 'Не удалось создать AR anchor.');
    });
    return () => { cancelled = true; };
  }, [onAnchorError, onAnchored, onCandidate, requestId]);

  const content = (
    <>
      <ViroAmbientLight color="#ffffff" intensity={650} />
      <ViroNode
        position={calibration.translation}
        rotation={calibration.rotationEulerDeg}
        scale={[calibration.scale, calibration.scale, calibration.scale]}
      >
        <Viro3DObject source={getRomanovModelSource(era, trustMode)} type="GLB" />
        <ViroText
          text={`${era === '1857' ? '1857' : '1859 / 1883'} · ${trustMode === 'documented' ? 'FACT' : 'RESEARCH'}`}
          position={[0, 14.2, 0]}
          scale={[0.22, 0.22, 0.22]}
          style={{ fontSize: 18, color: '#f0d39b', textAlign: 'center' }}
        />
      </ViroNode>
      {portalVisible && <PortalScene />}
    </>
  );

  return isQuest ? <ViroScene>{content}</ViroScene> : <ViroARScene ref={arRef}>{content}</ViroARScene>;
}

const SpatialSceneFactory = SpatialScene as unknown as () => React.JSX.Element;

const stageOrder: Exclude<SpatialStage, 'portal-preview' | 'portal-entered'>[] = [
  'searching', 'candidate', 'anchored', 'calibrated', 'verified'
];

const stageLabels: Record<(typeof stageOrder)[number], string> = {
  searching: 'SEARCHING',
  candidate: 'CANDIDATE',
  anchored: 'ANCHORED',
  calibrated: 'CALIBRATED',
  verified: 'VERIFIED'
};

function CalibrationControl(props: {
  label: string;
  value: number;
  minimumValue: number;
  maximumValue: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.calibrationRow}>
      <View style={styles.calibrationLabelRow}>
        <Text style={styles.calibrationLabel}>{props.label}</Text>
        <Text style={styles.calibrationValue}>{props.value.toFixed(props.step < 1 ? 2 : 0)}</Text>
      </View>
      <Slider
        value={props.value}
        minimumValue={props.minimumValue}
        maximumValue={props.maximumValue}
        step={props.step}
        onValueChange={props.onChange}
        minimumTrackTintColor="#d7bb84"
        maximumTrackTintColor="#454a51"
        thumbTintColor="#f0d39b"
      />
    </View>
  );
}

export default function MoscowSpatialJourney({
  initialEra = '1859',
  initialTrustMode = 'public',
  onBackToModel,
  onClose
}: Props) {
  const [era, setEra] = useState<RomanovEra>(initialEra);
  const [trustMode, setTrustMode] = useState<RomanovTrustMode>(initialTrustMode);
  const [calibration, setCalibration] = useState<CalibrationProfile>(defaultRomanovCalibration);
  const [stage, setStage] = useState<SpatialStage>('searching');
  const [requestId, setRequestId] = useState(0);
  const [localAnchor, setLocalAnchor] = useState<LocalAnchor | null>(null);
  const [statusMessage, setStatusMessage] = useState('Наведите центр экрана на устойчивую часть фасада.');
  const [releaseBlockers, setReleaseBlockers] = useState<string[]>([]);
  const [portalVisible, setPortalVisible] = useState(false);
  const [calibrationOpen, setCalibrationOpen] = useState(false);
  const [fieldOpen, setFieldOpen] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const demoPreview = __DEV__ || process.env.EXPO_PUBLIC_DEMO_MODE === '1';

  const stageIndex = Math.max(0, stageOrder.indexOf(stage === 'portal-preview' || stage === 'portal-entered' ? 'verified' : stage));

  const reloadReleaseGate = async (nextCalibration = calibration) => {
    const [rawSurvey, rawSessions, rawAnchors] = await Promise.all([
      AsyncStorage.getItem(SURVEY_KEY),
      AsyncStorage.getItem(FIELD_KEY),
      AsyncStorage.getItem(ANCHOR_KEY)
    ]);
    const survey: RomanovSurveyPacket = rawSurvey ? JSON.parse(rawSurvey) : createEmptyRomanovSurveyPacket();
    const sessions: RomanovFieldSession[] = rawSessions ? JSON.parse(rawSessions) : [];
    const anchors: RomanovPersistentAnchor[] = rawAnchors ? JSON.parse(rawAnchors) : [];
    const gate = summarizeRomanovReleaseGate({ calibration: nextCalibration, survey, sessions, anchors });
    setReleaseBlockers(gate.blockers);
    if (gate.state === 'field-verified-spatial-scene') {
      setStage('verified');
      setStatusMessage('Field verification и independent persistent-anchor resolve подтверждены.');
      void haptic('anchor-verified');
    }
    return gate;
  };

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(CALIBRATION_KEY),
      AsyncStorage.getItem(ERA_KEY),
      AsyncStorage.getItem(TRUST_KEY)
    ]).then(([rawCalibration, rawEra, rawTrust]) => {
      let loadedCalibration = defaultRomanovCalibration;
      if (rawCalibration) {
        const parsed: unknown = JSON.parse(rawCalibration);
        if (isCalibrationProfile(parsed)) loadedCalibration = parsed;
      }
      setCalibration(loadedCalibration);
      if (rawEra === '1857' || rawEra === '1859') setEra(rawEra);
      if (rawTrust === 'documented' || rawTrust === 'public') setTrustMode(rawTrust);
      if (rawCalibration) {
        setStage('calibrated');
        setStatusMessage('Сохранённый calibration profile загружен. Проверяем release gate…');
      }
      reloadReleaseGate(loadedCalibration).catch(() => undefined);
    }).catch(() => undefined);
  }, []);

  const requestAnchor = () => {
    setPortalVisible(false);
    setStatusMessage('Ищем устойчивую поверхность в центре экрана…');
    setStage('searching');
    setLocalAnchor(null);
    setRequestId((current) => current + 1);
  };

  const handleCandidate = (hitType: ViroARHitTestResult['type']) => {
    setStage('candidate');
    setStatusMessage(`Найден кандидат: ${hitType}. Создаём session anchor…`);
    void haptic('epoch-snap');
  };

  const handleAnchored = (anchor: LocalAnchor) => {
    setLocalAnchor(anchor);
    setStage('anchored');
    setStatusMessage('Session anchor создан. Теперь совместите модель и сохраните калибровку.');
    setCalibrationOpen(true);
    void haptic('anchor-created');
  };

  const handleAnchorError = (message: string) => {
    setStage('searching');
    setStatusMessage(message);
    void haptic('field-warning');
  };

  const setTranslation = (axis: 0 | 1 | 2, value: number) => {
    setCalibration((current) => {
      const translation: [number, number, number] = [...current.translation];
      translation[axis] = value;
      return { ...current, translation };
    });
  };

  const saveCalibration = async () => {
    await AsyncStorage.setItem(CALIBRATION_KEY, JSON.stringify(calibration));
    setStage('calibrated');
    setStatusMessage('Калибровка сохранена. Verified остаётся заблокирован до полного field release gate.');
    setCalibrationOpen(false);
    await reloadReleaseGate(calibration).catch(() => undefined);
  };

  const openPortal = async () => {
    const gate = await reloadReleaseGate().catch(() => null);
    const verified = gate?.state === 'field-verified-spatial-scene';
    if (!verified && !demoPreview) {
      setStatusMessage('Portal заблокирован: production runtime требует field-verified spatial scene.');
      void haptic('field-warning');
      return;
    }
    setPortalVisible(true);
    if (verified) {
      setStage('portal-preview');
      setStatusMessage('Verified portal готов к входу.');
    } else {
      setStatusMessage('DEMO PREVIEW: портал показан без статуса verified.');
    }
    void haptic('spatial-enter');
  };

  const currentEraLabel = era === '1857' ? '1857' : '1859 / 1883';
  const productionVerified = stage === 'verified' || stage === 'portal-preview' || stage === 'portal-entered';

  return (
    <View style={styles.root}>
      <ViroXRSceneNavigator
        initialScene={{ scene: SpatialSceneFactory }}
        viroAppProps={{
          calibration,
          era,
          trustMode,
          requestId,
          portalVisible,
          onCandidate: handleCandidate,
          onAnchored: handleAnchored,
          onAnchorError: handleAnchorError
        }}
        pbrEnabled
        hdrEnabled
        shadowsEnabled
        multisamplingEnabled
        style={StyleSheet.absoluteFill}
      />

      {!isQuest && (
        <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <View style={styles.statusCard}>
            <View style={styles.statusTop}>
              <View style={styles.statusCopy}>
                <Text style={styles.kicker}>AR STATE · {currentEraLabel} · {trustMode === 'documented' ? 'FACT' : 'RESEARCH'}</Text>
                <Text style={styles.statusTitle}>{stage === 'portal-preview' ? 'PORTAL READY' : stage.toUpperCase()}</Text>
              </View>
              {onClose && (
                <PhysicalPressable style={styles.close} contentStyle={styles.center} onPress={onClose}>
                  <Text style={styles.closeText}>×</Text>
                </PhysicalPressable>
              )}
            </View>

            <View style={styles.rail}>
              {stageOrder.map((item, index) => {
                const completed = index < stageIndex || (item === 'verified' && productionVerified);
                const active = item === stage || (item === 'verified' && stage === 'portal-preview');
                return (
                  <View key={item} style={styles.railItem}>
                    <View style={[styles.railDot, completed && styles.railDotDone, active && styles.railDotActive]} />
                    <Text style={[styles.railText, (completed || active) && styles.railTextActive]}>{stageLabels[item]}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.statusBody}>{statusMessage}</Text>
            {releaseBlockers.length > 0 && (
              <Text style={styles.blockers}>Release blockers: {releaseBlockers.join(' · ')}</Text>
            )}
          </View>

          <View style={styles.actionDock}>
            <View style={styles.actionRow}>
              <PhysicalPressable style={styles.secondary} contentStyle={styles.center} strong onPress={requestAnchor}>
                <Text style={styles.secondaryText}>{stage === 'searching' ? 'Найти фасад' : 'Перепривязать'}</Text>
              </PhysicalPressable>
              <PhysicalPressable
                style={[styles.primary, !localAnchor && styles.disabled]}
                contentStyle={styles.center}
                disabled={!localAnchor}
                onPress={() => setCalibrationOpen((current) => !current)}
              >
                <Text style={styles.primaryText}>Калибровка</Text>
              </PhysicalPressable>
            </View>
            <View style={styles.actionRow}>
              <PhysicalPressable style={styles.toolButton} contentStyle={styles.center} onPress={() => setSurveyOpen(true)}><Text style={styles.toolText}>5 точек</Text></PhysicalPressable>
              <PhysicalPressable style={styles.toolButton} contentStyle={styles.center} onPress={() => setFieldOpen(true)}><Text style={styles.toolText}>5/10/15 м</Text></PhysicalPressable>
              <PhysicalPressable style={styles.portalButton} contentStyle={styles.center} strong hapticEvent="spatial-enter" onPress={openPortal}>
                <Text style={styles.portalText}>{productionVerified ? 'Открыть портал' : demoPreview ? 'Portal · DEMO' : 'Portal · locked'}</Text>
              </PhysicalPressable>
            </View>
            {onBackToModel && (
              <PhysicalPressable style={styles.backButton} contentStyle={styles.center} hapticEvent="none" onPress={onBackToModel}>
                <Text style={styles.backText}>← 3D-модель</Text>
              </PhysicalPressable>
            )}
          </View>

          {calibrationOpen && (
            <View style={styles.calibrationPanel}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.kicker}>MANUAL ALIGNMENT · INTERRUPTIBLE</Text>
                <Text style={styles.panelTitle}>Совместите модель с фасадом</Text>
                <CalibrationControl label="X" value={calibration.translation[0]} minimumValue={-10} maximumValue={10} step={0.05} onChange={(value) => setTranslation(0, value)} />
                <CalibrationControl label="Y" value={calibration.translation[1]} minimumValue={-8} maximumValue={8} step={0.05} onChange={(value) => setTranslation(1, value)} />
                <CalibrationControl label="Z" value={calibration.translation[2]} minimumValue={-20} maximumValue={-1} step={0.05} onChange={(value) => setTranslation(2, value)} />
                <CalibrationControl label="Yaw" value={calibration.rotationEulerDeg[1]} minimumValue={-180} maximumValue={180} step={1} onChange={(value) => setCalibration((current) => ({ ...current, rotationEulerDeg: [current.rotationEulerDeg[0], value, current.rotationEulerDeg[2]] }))} />
                <CalibrationControl label="Scale" value={calibration.scale} minimumValue={0.25} maximumValue={3} step={0.01} onChange={(value) => setCalibration((current) => ({ ...current, scale: value }))} />
                <View style={styles.actionRow}>
                  <PhysicalPressable style={styles.primary} contentStyle={styles.center} strong onPress={saveCalibration}><Text style={styles.primaryText}>Сохранить</Text></PhysicalPressable>
                  <PhysicalPressable style={styles.secondary} contentStyle={styles.center} onPress={() => setCalibrationOpen(false)}><Text style={styles.secondaryText}>Закрыть</Text></PhysicalPressable>
                </View>
              </ScrollView>
            </View>
          )}
        </SafeAreaView>
      )}

      {fieldOpen && !isQuest && <RomanovFieldTest calibration={calibration} era={era} onClose={() => { setFieldOpen(false); reloadReleaseGate().catch(() => undefined); }} />}
      {surveyOpen && !isQuest && <RomanovSurveyPacket onClose={() => { setSurveyOpen(false); reloadReleaseGate().catch(() => undefined); }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  statusCard: { position: 'absolute', top: 8, left: 12, right: 12, borderRadius: 20, borderWidth: 1, borderColor: '#434a52', backgroundColor: 'rgba(10,12,15,0.93)', padding: 13 },
  statusTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  statusCopy: { flex: 1 },
  kicker: { color: '#b99b69', fontSize: 8, letterSpacing: 1.2, fontWeight: '900' },
  statusTitle: { color: '#fff8ea', fontSize: 19, fontWeight: '900', marginTop: 3 },
  close: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#444a52', backgroundColor: '#171a1f' },
  closeText: { color: '#eee9df', fontSize: 24 },
  rail: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 11 },
  railItem: { alignItems: 'center', flex: 1 },
  railDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b4148' },
  railDotDone: { backgroundColor: '#7ca889' },
  railDotActive: { backgroundColor: '#d7bb84', width: 11, height: 11, borderRadius: 6 },
  railText: { color: '#666c74', fontSize: 6.5, fontWeight: '900', marginTop: 4 },
  railTextActive: { color: '#d7c39d' },
  statusBody: { color: '#aeb2b8', fontSize: 10, lineHeight: 14, marginTop: 9 },
  blockers: { color: '#b98a82', fontSize: 8, lineHeight: 12, marginTop: 5 },
  actionDock: { position: 'absolute', left: 12, right: 12, bottom: 18, borderRadius: 20, borderWidth: 1, borderColor: '#414750', backgroundColor: 'rgba(11,14,17,0.94)', padding: 11 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 7 },
  primary: { flex: 1, minHeight: 44, borderRadius: 13, backgroundColor: '#d7bb84' },
  primaryText: { color: '#17130d', fontSize: 10, fontWeight: '900', textAlign: 'center' },
  secondary: { flex: 1, minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: '#4b525b', backgroundColor: '#15191e' },
  secondaryText: { color: '#d9c59e', fontSize: 10, fontWeight: '900', textAlign: 'center' },
  disabled: { opacity: 0.35 },
  toolButton: { flex: 0.75, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: '#45505a' },
  toolText: { color: '#9ea6ae', fontSize: 8.5, fontWeight: '900' },
  portalButton: { flex: 1.35, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: '#9a8057', backgroundColor: '#211b13' },
  portalText: { color: '#e8c98c', fontSize: 9, fontWeight: '900' },
  backButton: { minHeight: 40, borderRadius: 12, marginTop: 7 },
  backText: { color: '#858b93', fontSize: 9, fontWeight: '900' },
  calibrationPanel: { position: 'absolute', left: 12, right: 12, top: 208, bottom: 150, borderRadius: 20, borderWidth: 1, borderColor: '#5b5243', backgroundColor: 'rgba(13,16,19,0.98)', padding: 14 },
  panelTitle: { color: '#fff8ea', fontSize: 17, fontWeight: '900', marginTop: 4, marginBottom: 8 },
  calibrationRow: { marginTop: 5 },
  calibrationLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  calibrationLabel: { color: '#c4c7cc', fontSize: 9, fontWeight: '800' },
  calibrationValue: { color: '#e6c98f', fontSize: 9, fontVariant: ['tabular-nums'] }
});
