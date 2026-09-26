import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, PixelRatio, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Viro3DObject,
  ViroAmbientLight,
  ViroARScene,
  ViroNode,
  ViroPortal,
  ViroPortalScene,
  ViroScene,
  ViroText,
  ViroTrackingStateConstants,
  ViroXRSceneNavigator,
  isQuest,
  type ViroARHitTestResult,
  type ViroHostCloudAnchorResult,
  type ViroResolveCloudAnchorResult
} from '@reactvision/react-viro';
import {
  buildRomanovMeasuredResidual,
  type RomanovMeasuredControlPointResidual,
  type RomanovWorldPointMeters
} from '../../spatial/alignmentResidual';
import {
  advanceCalibrationVersionForSave,
  bindCalibrationToCurrentMetricAuthority,
  defaultRomanovCalibration,
  invalidateCalibrationVerification,
  isCalibrationBoundToSession,
  isCalibrationProfile,
  type CalibrationProfile
} from '../../spatial/calibration';
import type { RomanovFieldSession } from '../../spatial/fieldVerification';
import {
  isIndependentAnchorResolve,
  isPersistentAnchorFrameAuthoritative,
  markAnchorHostLocalized,
  markAnchorResolved,
  markAnchorVerified,
  type PersistentAnchorProvider,
  type RomanovPersistentAnchor
} from '../../spatial/persistentAnchor';
import {
  anchorFrameModelToWorld,
  rotationMatrixAngularDistanceDeg
} from '../../spatial/persistentAnchorFrame';
import { getPersistentAnchorRuntimeConfig } from '../../spatial/persistentAnchorRuntime';
import type { RomanovEra } from '../../spatial/romanov-hotspots';
import { getRomanovModelSource, type RomanovTrustMode } from '../../spatial/romanovModelPack.native';
import { summarizeRomanovReleaseGate } from '../../spatial/romanovReleaseGate';
import {
  createEmptyRomanovSurveyPacket,
  summarizeRomanovSurvey,
  type RomanovSurveyPacket as RomanovSurveyPacketData
} from '../../spatial/romanovSurvey';
import type { SpatialStage } from '../../e2e/experienceContract';
import PhysicalPressable from '../../ui/PhysicalPressable';
import PortalTransitionControl from '../../ui/PortalTransitionControl';
import { haptic } from '../../ui/haptics';
import { tr, type AppLanguage } from '../../i18n';
import RomanovEvidenceTransferPanel from './RomanovEvidenceTransferPanel.native';
import RomanovFieldTest from './RomanovFieldTest.native';
import RomanovPersistentAnchorPanel from './RomanovPersistentAnchorPanel.native';
import RomanovSurveyPacketScreen from './RomanovSurveyPacket.native';

const CALIBRATION_KEY = 'moscow:p0:romanov-calibration:v1';
const SURVEY_KEY = 'moscow:p0:romanov-survey-packet:v1';
const FIELD_KEY = 'moscow:p0:romanov-field-sessions:v1';
const ANCHOR_KEY = 'moscow:p0:romanov-persistent-anchors:v1';
const ACTIVE_ANCHOR_KEY = 'moscow:p0:romanov-active-persistent-anchor:v1';
const DEVICE_LABEL_KEY = 'moscow:p0:romanov-device-label:v1';
const ERA_KEY = 'moscow:p0:romanov-era:v1';
const TRUST_KEY = 'moscow:p0:romanov-trust-mode:v1';

const HIT_PRIORITY: ViroARHitTestResult['type'][] = [
  'DepthPoint',
  'ExistingPlaneUsingExtent',
  'ExistingPlane',
  'FeaturePoint'
];

type Props = {
  language?: AppLanguage;
  fieldToolsEnabled?: boolean;
  initialEra?: RomanovEra;
  initialTrustMode?: RomanovTrustMode;
  onBackToModel?: () => void;
  onClose?: () => void;
};

type LocalAnchor = {
  anchorId: string;
  hitType: ViroARHitTestResult['type'];
  position: [number, number, number];
  rotationEulerDeg: [number, number, number];
};

type AlignmentMeasurementRequest = {
  id: number;
  controlPointId: string;
};

type AlignmentMeasurementSample = {
  requestId: number;
  hitType: ViroARHitTestResult['type'];
  observedWorldPointMeters: RomanovWorldPointMeters;
  cameraWorldPointMeters: RomanovWorldPointMeters;
};

type PersistentResolveSample = {
  anchorPose: {
    position: [number, number, number];
    rotationEulerDeg: [number, number, number];
  };
};

type CloudAnchorNavigatorMethods = {
  hostCloudAnchor: (anchorId: string, ttlDays?: number) => Promise<ViroHostCloudAnchorResult>;
  resolveCloudAnchor: (cloudAnchorId: string) => Promise<ViroResolveCloudAnchorResult>;
  cancelCloudAnchorOperations?: () => void;
};

type XRNavigatorRuntimeRef = {
  arSceneNavigator?: CloudAnchorNavigatorMethods;
  sceneNavigator?: CloudAnchorNavigatorMethods;
};

type XRNavigatorProviderProps = React.ComponentProps<typeof ViroXRSceneNavigator> & {
  provider?: PersistentAnchorProvider;
};

const PersistentViroXRSceneNavigator = ViroXRSceneNavigator as React.ComponentType<XRNavigatorProviderProps>;

function isCloudAnchorNavigator(value: unknown): value is CloudAnchorNavigatorMethods {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CloudAnchorNavigatorMethods>;
  return typeof candidate.hostCloudAnchor === 'function'
    && typeof candidate.resolveCloudAnchor === 'function';
}

function cloudAnchorNavigator(value: unknown): CloudAnchorNavigatorMethods | null {
  if (isCloudAnchorNavigator(value)) return value;
  if (!value || typeof value !== 'object') return null;
  const candidate = value as XRNavigatorRuntimeRef;
  if (isCloudAnchorNavigator(candidate.arSceneNavigator)) return candidate.arSceneNavigator;
  if (isCloudAnchorNavigator(candidate.sceneNavigator)) return candidate.sceneNavigator;
  return null;
}

type SceneProps = {
  arSceneNavigator?: unknown;
  sceneNavigator?: {
    viroAppProps?: {
      calibration?: CalibrationProfile;
      era?: RomanovEra;
      trustMode?: RomanovTrustMode;
      requestId?: number;
      portalVisible?: boolean;
      activePersistentAnchor?: RomanovPersistentAnchor | null;
      measurementRequest?: AlignmentMeasurementRequest | null;
      onPersistentLocalized?: (sample: PersistentResolveSample) => void;
      onPersistentLocalizeError?: (message: string) => void;
      onMeasurementSample?: (sample: AlignmentMeasurementSample) => void;
      onMeasurementError?: (requestId: number, message: string) => void;
      onCandidate?: (hitType: ViroARHitTestResult['type']) => void;
      onAnchored?: (anchor: LocalAnchor) => void;
      onAnchorError?: (message: string) => void;
      language?: AppLanguage;
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

function PortalScene({ language = 'ru' }: { language?: AppLanguage }) {
  return (
    <ViroPortalScene passable position={[2.6, 0, 0]}>
      <ViroPortal position={[0, 0, 0]}>
        <Viro3DObject
          source={require('../../../assets/models/romanov-portal-frame.obj')}
          resources={[require('../../../assets/models/romanov-portal-frame.mtl')]}
          type="OBJ"
        />
      </ViroPortal>
      <ViroAmbientLight color="#dac79f" intensity={520} />
      <ViroText
        text={tr(language, 'ИСТОРИЧЕСКИЙ ПОРТАЛ', 'HISTORICAL PORTAL', '历史门户')}
        position={[0, 0.3, -3]}
        scale={[0.23, 0.23, 0.23]}
        style={{ fontSize: 18, color: '#f0d39b', textAlign: 'center' }}
      />
      <ViroText
        text={tr(language, 'Интерьер остаётся demo-layer до отдельной исторической проверки', 'The interior remains a demo layer until separate historical review', '室内场景在完成独立历史审核前仍为演示层')}
        position={[0, -0.2, -3]}
        scale={[0.12, 0.12, 0.12]}
        style={{ fontSize: 14, color: '#d2cdc3', textAlign: 'center' }}
      />
    </ViroPortalScene>
  );
}

function SpatialScene({ sceneNavigator, arSceneNavigator }: SceneProps) {
  const arRef = useRef<ViroARScene | null>(null);
  const lastRequest = useRef(0);
  const lastMeasurementRequest = useRef(0);
  const lastPersistentResolve = useRef<string | null>(null);
  const trackingState = useRef<number>(0);
  const [resolvedPersistentModelTransform, setResolvedPersistentModelTransform] = useState<ReturnType<typeof anchorFrameModelToWorld> | null>(null);
  const calibration = sceneNavigator?.viroAppProps?.calibration ?? defaultRomanovCalibration;
  const era = sceneNavigator?.viroAppProps?.era ?? '1859';
  const trustMode = sceneNavigator?.viroAppProps?.trustMode ?? 'public';
  const requestId = sceneNavigator?.viroAppProps?.requestId ?? 0;
  const portalVisible = sceneNavigator?.viroAppProps?.portalVisible ?? false;
  const activePersistentAnchor = sceneNavigator?.viroAppProps?.activePersistentAnchor ?? null;
  const onPersistentLocalized = sceneNavigator?.viroAppProps?.onPersistentLocalized;
  const onPersistentLocalizeError = sceneNavigator?.viroAppProps?.onPersistentLocalizeError;
  const onPersistentLocalizedRef = useRef(onPersistentLocalized);
  const onPersistentLocalizeErrorRef = useRef(onPersistentLocalizeError);
  onPersistentLocalizedRef.current = onPersistentLocalized;
  onPersistentLocalizeErrorRef.current = onPersistentLocalizeError;
  const measurementRequest = sceneNavigator?.viroAppProps?.measurementRequest ?? null;
  const onMeasurementSample = sceneNavigator?.viroAppProps?.onMeasurementSample;
  const onMeasurementError = sceneNavigator?.viroAppProps?.onMeasurementError;
  const onCandidate = sceneNavigator?.viroAppProps?.onCandidate;
  const onAnchored = sceneNavigator?.viroAppProps?.onAnchored;
  const onAnchorError = sceneNavigator?.viroAppProps?.onAnchorError;
  const language = sceneNavigator?.viroAppProps?.language ?? 'ru';

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
      const rotation = node.transform?.rotation ?? hit.transform.rotation ?? [0, 0, 0];
      onAnchored?.({
        anchorId: node.anchorId,
        hitType: hit.type,
        position: [position[0], position[1], position[2]],
        rotationEulerDeg: [rotation[0] ?? 0, rotation[1] ?? 0, rotation[2] ?? 0]
      });
    };

    run().catch((error) => {
      if (!cancelled) onAnchorError?.(error instanceof Error ? error.message : 'Не удалось создать AR anchor.');
    });
    return () => { cancelled = true; };
  }, [onAnchorError, onAnchored, onCandidate, requestId]);

  useEffect(() => {
    if (isQuest || !measurementRequest || measurementRequest.id === lastMeasurementRequest.current) return;
    lastMeasurementRequest.current = measurementRequest.id;
    let cancelled = false;

    const run = async () => {
      const scene = arRef.current;
      if (!scene) {
        onMeasurementError?.(measurementRequest.id, 'AR scene ещё не готова.');
        return;
      }
      if (trackingState.current !== ViroTrackingStateConstants.TRACKING_NORMAL) {
        onMeasurementError?.(measurementRequest.id, 'Tracking не NORMAL. Остановитесь, наведитесь на фактурный фасад и дождитесь стабилизации.');
        return;
      }

      const orientation = await scene.getCameraOrientationAsync();
      if (cancelled || !isUsablePoint(orientation?.position)) return;
      const { width, height } = Dimensions.get('window');
      const ratio = PixelRatio.get();
      const results = await scene.performARHitTestWithPoint(
        (width * ratio) / 2,
        (height * ratio) / 2
      ) as ViroARHitTestResult[];
      if (cancelled) return;

      const releaseHit = HIT_PRIORITY
        .filter((type) => type !== 'FeaturePoint')
        .map((type) => (Array.isArray(results) ? results : []).find((item) => item.type === type && isUsablePoint(item.transform?.position)))
        .find(Boolean);

      if (!releaseHit || !isUsablePoint(releaseHit.transform?.position)) {
        onMeasurementError?.(measurementRequest.id, 'Нет release-grade depth/plane hit в центре. Наведите перекрестие на устойчивую плоскость фасада.');
        return;
      }

      onMeasurementSample?.({
        requestId: measurementRequest.id,
        hitType: releaseHit.type,
        observedWorldPointMeters: [
          releaseHit.transform.position[0],
          releaseHit.transform.position[1],
          releaseHit.transform.position[2]
        ],
        cameraWorldPointMeters: [
          orientation.position[0],
          orientation.position[1],
          orientation.position[2]
        ]
      });
    };

    run().catch((error) => {
      if (!cancelled) {
        onMeasurementError?.(
          measurementRequest.id,
          error instanceof Error ? error.message : 'Не удалось снять AR residual.'
        );
      }
    });
    return () => { cancelled = true; };
  }, [measurementRequest, onMeasurementError, onMeasurementSample]);

  useEffect(() => {
    if (isQuest || !activePersistentAnchor) {
      lastPersistentResolve.current = null;
      setResolvedPersistentModelTransform(null);
      return;
    }
    if (lastPersistentResolve.current === activePersistentAnchor.id) return;

    const navigator = cloudAnchorNavigator(arSceneNavigator);
    if (!navigator?.resolveCloudAnchor) {
      onPersistentLocalizeErrorRef.current?.('Cloud-anchor resolve API недоступен в текущем AR navigator.');
      return;
    }

    let cancelled = false;
    lastPersistentResolve.current = activePersistentAnchor.id;
    setResolvedPersistentModelTransform(null);

    navigator.resolveCloudAnchor(activePersistentAnchor.providerAnchorId)
      .then((result) => {
        if (cancelled) return;
        if (!result.success || !result.anchor) {
          lastPersistentResolve.current = null;
          onPersistentLocalizeErrorRef.current?.(result.error ?? `Cloud anchor resolve failed: ${result.state}`);
          return;
        }

        const anchorPose = {
          position: result.anchor.position,
          rotationEulerDeg: result.anchor.rotation
        };
        setResolvedPersistentModelTransform(
          anchorFrameModelToWorld(anchorPose, activePersistentAnchor.anchorFrameModelTransform)
        );
        onPersistentLocalizedRef.current?.({ anchorPose });
      })
      .catch((error) => {
        if (cancelled) return;
        lastPersistentResolve.current = null;
        onPersistentLocalizeErrorRef.current?.(
          error instanceof Error ? error.message : 'Cloud anchor resolve failed.'
        );
      });

    return () => {
      cancelled = true;
    };
  }, [
    activePersistentAnchor,
    arSceneNavigator
  ]);

  const modelContents = (
    <>
      <Viro3DObject source={getRomanovModelSource(era, trustMode)} type="GLB" />
      <ViroText
        text={`${era === '1857' ? '1857' : '1859 / 1883'} · ${trustMode === 'documented' ? tr(language, 'ФАКТ', 'FACT', '事实') : tr(language, 'РЕКОНСТРУКЦИЯ', 'RESEARCH', '重建')}`}
        position={[0, 14.2, 0]}
        scale={[0.22, 0.22, 0.22]}
        style={{ fontSize: 18, color: '#f0d39b', textAlign: 'center' }}
      />
      {portalVisible && <PortalScene language={language} />}
    </>
  );

  const unanchoredModel = (
    <ViroNode
      position={calibration.translation}
      rotation={calibration.rotationEulerDeg}
      scale={[calibration.scale, calibration.scale, calibration.scale]}
    >
      {modelContents}
    </ViroNode>
  );

  const anchoredModel = activePersistentAnchor && !isQuest ? (
    resolvedPersistentModelTransform ? (
      <ViroNode
        position={resolvedPersistentModelTransform.position}
        rotation={resolvedPersistentModelTransform.rotationEulerDeg}
        scale={[
          resolvedPersistentModelTransform.scale,
          resolvedPersistentModelTransform.scale,
          resolvedPersistentModelTransform.scale
        ]}
      >
        {modelContents}
      </ViroNode>
    ) : (
      <ViroText
        text="LOCALIZING PERSISTENT ANCHOR…"
        position={[0, 0, -2]}
        scale={[0.12, 0.12, 0.12]}
        style={{ fontSize: 14, color: '#f0d39b', textAlign: 'center' }}
      />
    )
  ) : unanchoredModel;

  const content = (
    <>
      <ViroAmbientLight color="#ffffff" intensity={650} />
      {anchoredModel}
    </>
  );

  return isQuest
    ? <ViroScene>{content}</ViroScene>
    : <ViroARScene
        ref={arRef}
        onTrackingUpdated={(state) => { trackingState.current = state; }}
      >
        {content}
      </ViroARScene>;
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
  language = 'ru',
  fieldToolsEnabled = __DEV__ || process.env.EXPO_PUBLIC_FIELD_TOOLS === '1',
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
  const [anchorOpen, setAnchorOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [activePersistentAnchor, setActivePersistentAnchor] = useState<RomanovPersistentAnchor | null>(null);
  const xrNavigatorRef = useRef<unknown>(null);
  const anchorRuntime = getPersistentAnchorRuntimeConfig();
  const [measurementRequest, setMeasurementRequest] = useState<AlignmentMeasurementRequest | null>(null);
  const measurementResolver = useRef<{
    requestId: number;
    controlPointId: string;
    distance: 5 | 10 | 15;
    survey: RomanovSurveyPacketData;
    calibration: CalibrationProfile;
    resolve: (value: RomanovMeasuredControlPointResidual) => void;
    reject: (reason: Error) => void;
  } | null>(null);
  const measurementSequence = useRef(0);
  const demoPreview = __DEV__ || process.env.EXPO_PUBLIC_DEMO_MODE === '1';

  const stageIndex = Math.max(0, stageOrder.indexOf(stage === 'portal-preview' || stage === 'portal-entered' ? 'verified' : stage));

  const reloadReleaseGate = async (nextCalibration = calibration) => {
    const [rawSurvey, rawSessions, rawAnchors] = await Promise.all([
      AsyncStorage.getItem(SURVEY_KEY),
      AsyncStorage.getItem(FIELD_KEY),
      AsyncStorage.getItem(ANCHOR_KEY)
    ]);
    const survey: RomanovSurveyPacketData = rawSurvey ? JSON.parse(rawSurvey) : createEmptyRomanovSurveyPacket();
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
      AsyncStorage.getItem(TRUST_KEY),
      AsyncStorage.getItem(ACTIVE_ANCHOR_KEY),
      AsyncStorage.getItem(ANCHOR_KEY)
    ]).then(([rawCalibration, rawEra, rawTrust, rawActiveAnchorId, rawAnchors]) => {
      let loadedCalibration = defaultRomanovCalibration;
      if (rawCalibration) {
        const parsed: unknown = JSON.parse(rawCalibration);
        if (isCalibrationProfile(parsed)) loadedCalibration = parsed;
      }
      if (rawEra === '1857' || rawEra === '1859') setEra(rawEra);
      if (rawTrust === 'documented' || rawTrust === 'public') setTrustMode(rawTrust);

      let storedActive: RomanovPersistentAnchor | undefined;
      if (rawActiveAnchorId && rawAnchors) {
        const storedAnchors = JSON.parse(rawAnchors) as RomanovPersistentAnchor[];
        storedActive = storedAnchors.find((item) => item.id === rawActiveAnchorId);
      }

      if (storedActive && isPersistentAnchorFrameAuthoritative(storedActive)) {
        loadedCalibration = storedActive.calibration;
        setCalibration(loadedCalibration);
        setActivePersistentAnchor(storedActive);
        setStage('calibrated');
        setStatusMessage('Persistent anchor proof загружен. Локализуем общий location frame…');
      } else {
        const draftCalibration = {
          ...loadedCalibration,
          sessionAnchorId: undefined,
          verifiedAt: undefined
        };
        setCalibration(draftCalibration);
        setStage('searching');
        setStatusMessage(
          rawCalibration
            ? 'Предыдущие X/Y/Z загружены только как черновик. AR world origin новый: создайте local anchor и сохраните calibration заново.'
            : 'Наведите центр экрана на устойчивую часть фасада.'
        );
        loadedCalibration = draftCalibration;
      }
      reloadReleaseGate(loadedCalibration).catch(() => undefined);
    }).catch(() => undefined);
  }, []);

  const requestAnchor = () => {
    setPortalVisible(false);
    setActivePersistentAnchor(null);
    AsyncStorage.removeItem(ACTIVE_ANCHOR_KEY).catch(() => undefined);
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
      return invalidateCalibrationVerification({ ...current, translation });
    });
  };

  const saveCalibration = async () => {
    if (!localAnchor) {
      setStatusMessage('Сначала создайте local anchor текущей AR-сессии.');
      void haptic('field-warning');
      return;
    }
    const nextCalibration = advanceCalibrationVersionForSave(
      bindCalibrationToCurrentMetricAuthority(calibration),
      localAnchor.anchorId
    );
    setCalibration(nextCalibration);
    await AsyncStorage.setItem(CALIBRATION_KEY, JSON.stringify(nextCalibration));
    setStage('calibrated');
    setStatusMessage('Калибровка сохранена и привязана к текущей версии модели. Verified остаётся заблокирован до полного field release gate.');
    setCalibrationOpen(false);
    await reloadReleaseGate(nextCalibration).catch(() => undefined);
  };

  const requestMeasuredResidual = async (
    controlPointId: string,
    distance: 5 | 10 | 15
  ): Promise<RomanovMeasuredControlPointResidual> => {
    if (!localAnchor || !isCalibrationBoundToSession(calibration, localAnchor.anchorId)) {
      throw new Error('Calibration не привязана к local anchor текущей AR-сессии. Создайте anchor и сохраните calibration заново.');
    }
    const rawSurvey = await AsyncStorage.getItem(SURVEY_KEY);
    if (!rawSurvey) throw new Error('Сначала создайте и утвердите survey packet.');
    const survey = JSON.parse(rawSurvey) as RomanovSurveyPacketData;
    const surveyGate = summarizeRomanovSurvey(survey);
    if (!surveyGate.complete) {
      throw new Error(`Survey packet не прошёл gate: ${surveyGate.blockers.join(', ')}`);
    }
    const point = survey.points.find((item) => item.controlPointId === controlPointId);
    if (!point?.modelPointMeters || point.status !== 'verified') {
      throw new Error('Эта контрольная точка ещё не verified в survey packet.');
    }
    if (measurementResolver.current) {
      measurementResolver.current.reject(new Error('Предыдущее измерение отменено новым запросом.'));
      measurementResolver.current = null;
    }

    const requestId = ++measurementSequence.current;
    return new Promise<RomanovMeasuredControlPointResidual>((resolve, reject) => {
      measurementResolver.current = {
        requestId,
        controlPointId,
        distance,
        survey,
        calibration: { ...calibration, translation: [...calibration.translation] as [number, number, number], rotationEulerDeg: [...calibration.rotationEulerDeg] as [number, number, number] },
        resolve,
        reject
      };
      setMeasurementRequest({ id: requestId, controlPointId });
    });
  };

  const handleMeasurementSample = (sample: AlignmentMeasurementSample) => {
    const pending = measurementResolver.current;
    if (!pending || pending.requestId !== sample.requestId) return;
    const point = pending.survey.points.find((item) => item.controlPointId === pending.controlPointId);
    if (!point?.modelPointMeters) {
      pending.reject(new Error('Survey model point отсутствует.'));
    } else {
      pending.resolve(buildRomanovMeasuredResidual({
        controlPointId: pending.controlPointId,
        surveyPacketId: pending.survey.id,
        calibration: pending.calibration,
        modelPointMeters: point.modelPointMeters,
        observedWorldPointMeters: sample.observedWorldPointMeters,
        cameraWorldPointMeters: sample.cameraWorldPointMeters,
        distanceBucketMeters: pending.distance,
        hitType: sample.hitType
      }));
    }
    measurementResolver.current = null;
    setMeasurementRequest(null);
  };

  const handleMeasurementError = (requestId: number, message: string) => {
    const pending = measurementResolver.current;
    if (!pending || pending.requestId !== requestId) return;
    pending.reject(new Error(message));
    measurementResolver.current = null;
    setMeasurementRequest(null);
  };

  const persistActiveAnchor = async (anchor: RomanovPersistentAnchor) => {
    const raw = await AsyncStorage.getItem(ANCHOR_KEY);
    const anchors: RomanovPersistentAnchor[] = raw ? JSON.parse(raw) : [];
    const next = [...anchors.filter((item) => item.id !== anchor.id), anchor];
    await Promise.all([
      AsyncStorage.setItem(ANCHOR_KEY, JSON.stringify(next)),
      AsyncStorage.setItem(ACTIVE_ANCHOR_KEY, anchor.id)
    ]);
    setActivePersistentAnchor(anchor);
  };

  const hostPersistentAnchor = async (anchorId: string, ttlDays: number) => {
    if (isQuest) throw new Error('Phone cloud anchors are not hosted from the Quest runtime.');
    const navigator = cloudAnchorNavigator(xrNavigatorRef.current);
    if (!navigator?.hostCloudAnchor) throw new Error('AR cloud-anchor navigator is not mounted yet.');
    return navigator.hostCloudAnchor(anchorId, ttlDays);
  };

  const handlePersistentLocalized = async (sample: PersistentResolveSample) => {
    const anchor = activePersistentAnchor;
    if (!anchor) return;

    try {
      const deviceLabel = (await AsyncStorage.getItem(DEVICE_LABEL_KEY))?.trim();
      if (!deviceLabel) {
        setStatusMessage('Cloud anchor localized, но device label не задан. Откройте Persistent anchor и укажите физическое устройство.');
        return;
      }

      let next = anchor;
      if (deviceLabel.toLowerCase() === anchor.hostedByDeviceLabel.trim().toLowerCase()) {
        const reconstructed = anchorFrameModelToWorld(
          sample.anchorPose,
          anchor.anchorFrameModelTransform
        );
        const continuityResidualCm = Math.hypot(
          reconstructed.position[0] - anchor.calibration.translation[0],
          reconstructed.position[1] - anchor.calibration.translation[1],
          reconstructed.position[2] - anchor.calibration.translation[2]
        ) * 100;
        const continuityRotationDeg = rotationMatrixAngularDistanceDeg(
          reconstructed.rotationEulerDeg,
          anchor.calibration.rotationEulerDeg
        );
        next = markAnchorHostLocalized(anchor, { continuityResidualCm, continuityRotationDeg });
        setStatusMessage(
          next.hostContinuityPassed
            ? `Host anchor-frame continuity PASS · ${continuityResidualCm.toFixed(1)} см · ${continuityRotationDeg.toFixed(2)}°. Экспортируйте proof на другое устройство.`
            : `Host anchor-frame continuity FAIL · ${continuityResidualCm.toFixed(1)} см · ${continuityRotationDeg.toFixed(2)}°. Persistent placement требует исправления.`
        );
      } else {
        next = markAnchorResolved(anchor, {
          resolvedByDeviceLabel: deviceLabel,
          resolveSessionId: `resolve-${new Date().toISOString()}`
        });
        if (next.hostContinuityPassed && isIndependentAnchorResolve(next)) {
          next = markAnchorVerified(next, { verifiedByDeviceLabel: deviceLabel });
          setStatusMessage(`Independent persistent-anchor resolve VERIFIED · ${deviceLabel}. Экспортируйте proof обратно на field-authority устройство.`);
          void haptic('anchor-verified');
        } else {
          setStatusMessage(`Persistent anchor resolved on ${deviceLabel}, но verification prerequisites ещё не выполнены.`);
        }
      }

      await persistActiveAnchor(next);
      await reloadReleaseGate().catch(() => undefined);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Persistent anchor localization evidence failed.');
      void haptic('field-warning');
    }
  };

  const handlePersistentLocalizeError = (message: string) => {
    setStatusMessage(`Persistent anchor resolve failed: ${message}`);
    void haptic('field-warning');
  };

  const openPortal = async () => {
    const gate = await reloadReleaseGate().catch(() => null);
    const verified = gate?.state === 'field-verified-spatial-scene';
    if (!verified && !demoPreview) {
      setStatusMessage(tr(language, 'Portal заблокирован: production runtime требует field-verified spatial scene.', 'Portal is locked: production runtime requires a field-verified spatial scene.', '门户已锁定：production runtime 需要经过现场验证的空间场景。'));
      void haptic('field-warning');
      return;
    }
    setPortalVisible(true);
    if (verified) {
      setStage('portal-preview');
      setStatusMessage(tr(language, 'Verified portal готов к физическому проходу.', 'Verified portal is ready to enter.', '已验证门户可以进入。'));
    } else {
      setStatusMessage(tr(language, 'DEMO PREVIEW: портал показан без статуса verified.', 'DEMO PREVIEW: portal is shown without verified status.', '演示预览：门户尚未获得verified状态。'));
    }
  };

  const currentEraLabel = era === '1857' ? '1857' : '1859 / 1883';
  const productionVerified = stage === 'verified' || stage === 'portal-preview' || stage === 'portal-entered';
  const portalLocked = !productionVerified && !demoPreview;
  const portalLabel = productionVerified
    ? tr(language, 'Потяните → открыть VERIFIED portal', 'Pull → open VERIFIED portal', '拖动 → 打开已验证门户')
    : demoPreview
      ? tr(language, 'Потяните → DEMO portal preview', 'Pull → DEMO portal preview', '拖动 → 演示门户预览')
      : tr(language, 'Portal locked · нужен field verification', 'Portal locked · field verification required', '门户已锁定 · 需要现场验证');

  return (
    <View style={styles.root}>
      <PersistentViroXRSceneNavigator
        ref={xrNavigatorRef}
        provider={anchorRuntime.provider}
        initialScene={{ scene: SpatialSceneFactory }}
        viroAppProps={{
          calibration,
          era,
          trustMode,
          requestId,
          portalVisible,
          activePersistentAnchor,
          measurementRequest,
          onPersistentLocalized: handlePersistentLocalized,
          onPersistentLocalizeError: handlePersistentLocalizeError,
          onMeasurementSample: handleMeasurementSample,
          onMeasurementError: handleMeasurementError,
          onCandidate: handleCandidate,
          onAnchored: handleAnchored,
          onAnchorError: handleAnchorError,
          language
        }}
        pbrEnabled
        hdrEnabled
        shadowsEnabled
        multisamplingEnabled
        style={StyleSheet.absoluteFill}
      />

      {!isQuest && (
        <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {fieldToolsEnabled ? (
            <>
              <View style={styles.statusCard}>
                <View style={styles.statusTop}>
                  <View style={styles.statusCopy}>
                    <Text style={styles.kicker}>FIELD TOOLS · {currentEraLabel} · {trustMode === 'documented' ? 'FACT' : 'RESEARCH'}</Text>
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
                    style={[styles.primary, (!localAnchor || Boolean(activePersistentAnchor)) && styles.disabled]}
                    contentStyle={styles.center}
                    disabled={!localAnchor || Boolean(activePersistentAnchor)}
                    onPress={() => setCalibrationOpen((current) => !current)}
                  >
                    <Text style={styles.primaryText}>Калибровка</Text>
                  </PhysicalPressable>
                </View>
                <View style={styles.actionRow}>
                  <PhysicalPressable style={styles.toolButton} contentStyle={styles.center} onPress={() => setSurveyOpen(true)}><Text style={styles.toolText}>5 точек</Text></PhysicalPressable>
                  <PhysicalPressable
                    style={[styles.toolButton, (!localAnchor || !isCalibrationBoundToSession(calibration, localAnchor.anchorId)) && styles.disabled]}
                    contentStyle={styles.center}
                    disabled={!localAnchor || !isCalibrationBoundToSession(calibration, localAnchor.anchorId)}
                    onPress={() => setFieldOpen(true)}
                  ><Text style={styles.toolText}>5/10/15 м</Text></PhysicalPressable>
                </View>
                <View style={styles.actionRow}>
                  <PhysicalPressable style={styles.toolButton} contentStyle={styles.center} onPress={() => setEvidenceOpen(true)}><Text style={styles.toolText}>Evidence</Text></PhysicalPressable>
                  <PhysicalPressable style={[styles.toolButton, activePersistentAnchor && styles.toolButtonActive]} contentStyle={styles.center} onPress={() => setAnchorOpen(true)}><Text style={styles.toolText}>Anchor</Text></PhysicalPressable>
                </View>
                <View style={styles.portalTransition}>
                  <PortalTransitionControl
                    label={portalLabel}
                    committedLabel={productionVerified ? 'VERIFIED PORTAL READY' : 'DEMO PORTAL READY'}
                    disabled={portalLocked}
                    committed={portalVisible}
                    onCommit={() => { void openPortal(); }}
                  />
                </View>
                {onBackToModel && (
                  <PhysicalPressable style={styles.backButton} contentStyle={styles.center} hapticEvent="none" onPress={onBackToModel}>
                    <Text style={styles.backText}>← 3D-модель</Text>
                  </PhysicalPressable>
                )}
              </View>
            </>
          ) : (
            <>
              <View style={styles.statusCard}>
                <View style={styles.statusTop}>
                  <View style={styles.statusCopy}>
                    <Text style={styles.kicker}>{tr(language, 'ПРОСТРАНСТВЕННАЯ ИСТОРИЯ', 'SPATIAL HISTORY', '空间历史')} · {currentEraLabel}</Text>
                    <Text style={styles.statusTitle}>
                      {productionVerified
                        ? tr(language, 'ПРОВЕРЕНО НА МЕСТЕ', 'FIELD VERIFIED', '现场验证完成')
                        : tr(language, 'ПОДГОТОВКА СЦЕНЫ', 'SCENE PREPARATION', '场景准备中')}
                    </Text>
                  </View>
                  {onClose && (
                    <PhysicalPressable style={styles.close} contentStyle={styles.center} onPress={onClose}>
                      <Text style={styles.closeText}>×</Text>
                    </PhysicalPressable>
                  )}
                </View>
                <Text style={styles.statusBody}>
                  {productionVerified
                    ? tr(
                        language,
                        'Пространственная сцена прошла полевую проверку и использует подтверждённый persistent anchor.',
                        'The spatial scene passed field verification and uses a verified persistent anchor.',
                        '空间场景已通过现场验证，并使用经过验证的持久锚点。'
                      )
                    : tr(
                        language,
                        'Эта пространственная сцена ещё не имеет статуса field-verified. Демонстрация не подменяет физическую проверку.',
                        'This spatial scene is not field-verified yet. A demo does not replace physical verification.',
                        '该空间场景尚未获得field-verified状态。演示不能替代真实现场验证。'
                      )}
                </Text>
              </View>
              <View style={styles.actionDock}>
                <View style={styles.portalTransition}>
                  <PortalTransitionControl
                    label={portalLabel}
                    committedLabel={productionVerified
                      ? tr(language, 'VERIFIED PORTAL READY', 'VERIFIED PORTAL READY', '已验证门户就绪')
                      : tr(language, 'DEMO PORTAL READY', 'DEMO PORTAL READY', '演示门户就绪')}
                    disabled={portalLocked}
                    committed={portalVisible}
                    onCommit={() => { void openPortal(); }}
                  />
                </View>
                {onBackToModel && (
                  <PhysicalPressable style={styles.backButton} contentStyle={styles.center} hapticEvent="none" onPress={onBackToModel}>
                    <Text style={styles.backText}>{tr(language, '← 3D-модель', '← 3D model', '← 3D模型')}</Text>
                  </PhysicalPressable>
                )}
              </View>
            </>
          )}

          {fieldToolsEnabled && calibrationOpen && (
            <View style={styles.calibrationPanel}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.kicker}>MANUAL ALIGNMENT · INTERRUPTIBLE</Text>
                <Text style={styles.panelTitle}>Совместите модель с фасадом</Text>
                <CalibrationControl label="X" value={calibration.translation[0]} minimumValue={-10} maximumValue={10} step={0.05} onChange={(value) => setTranslation(0, value)} />
                <CalibrationControl label="Y" value={calibration.translation[1]} minimumValue={-8} maximumValue={8} step={0.05} onChange={(value) => setTranslation(1, value)} />
                <CalibrationControl label="Z" value={calibration.translation[2]} minimumValue={-20} maximumValue={-1} step={0.05} onChange={(value) => setTranslation(2, value)} />
                <CalibrationControl label="Yaw" value={calibration.rotationEulerDeg[1]} minimumValue={-180} maximumValue={180} step={1} onChange={(value) => setCalibration((current) => invalidateCalibrationVerification({ ...current, rotationEulerDeg: [current.rotationEulerDeg[0], value, current.rotationEulerDeg[2]] }))} />
                <CalibrationControl label="Scale" value={calibration.scale} minimumValue={0.25} maximumValue={3} step={0.01} onChange={(value) => setCalibration((current) => invalidateCalibrationVerification({ ...current, scale: value }))} />
                <View style={styles.actionRow}>
                  <PhysicalPressable style={styles.primary} contentStyle={styles.center} strong onPress={saveCalibration}><Text style={styles.primaryText}>Сохранить</Text></PhysicalPressable>
                  <PhysicalPressable style={styles.secondary} contentStyle={styles.center} onPress={() => setCalibrationOpen(false)}><Text style={styles.secondaryText}>Закрыть</Text></PhysicalPressable>
                </View>
              </ScrollView>
            </View>
          )}
        </SafeAreaView>
      )}

      {fieldToolsEnabled && fieldOpen && !isQuest && (
        <RomanovFieldTest
          calibration={calibration}
          era={era}
          onMeasureResidual={requestMeasuredResidual}
          onClose={() => { setFieldOpen(false); reloadReleaseGate().catch(() => undefined); }}
        />
      )}
      {fieldToolsEnabled && surveyOpen && !isQuest && <RomanovSurveyPacketScreen onClose={() => { setSurveyOpen(false); reloadReleaseGate().catch(() => undefined); }} />}
      {fieldToolsEnabled && evidenceOpen && !isQuest && (
        <RomanovEvidenceTransferPanel
          calibration={calibration}
          onCampaignImported={() => {
            const draft = {
              ...invalidateCalibrationVerification(calibration),
              sessionAnchorId: undefined
            };
            setCalibration(draft);
            setLocalAnchor(null);
            setStage('searching');
            setActivePersistentAnchor(null);
            Promise.all([
              AsyncStorage.setItem(CALIBRATION_KEY, JSON.stringify(draft)),
              AsyncStorage.removeItem(ACTIVE_ANCHOR_KEY)
            ]).catch(() => undefined);
            setStatusMessage('Survey campaign импортирован. Создайте local anchor и session-local calibration на этом телефоне.');
            reloadReleaseGate(draft).catch(() => undefined);
          }}
          onClose={() => { setEvidenceOpen(false); reloadReleaseGate().catch(() => undefined); }}
        />
      )}
      {fieldToolsEnabled && anchorOpen && !isQuest && (
        <RomanovPersistentAnchorPanel
          calibration={calibration}
          localAnchor={localAnchor}
          activeAnchor={activePersistentAnchor}
          onCalibrationChange={(next) => {
            setCalibration(next);
            setStage('calibrated');
            reloadReleaseGate(next).catch(() => undefined);
          }}
          onActiveAnchorChange={persistActiveAnchor}
          onHostCloudAnchor={hostPersistentAnchor}
          onClose={() => { setAnchorOpen(false); reloadReleaseGate().catch(() => undefined); }}
        />
      )}
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
  toolButton: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: '#45505a' },
  toolButtonActive: { borderColor: '#9f855a', backgroundColor: '#211b13' },
  toolText: { color: '#9ea6ae', fontSize: 8.5, fontWeight: '900' },
  portalTransition: { marginTop: 9 },
  backButton: { minHeight: 40, borderRadius: 12, marginTop: 7 },
  backText: { color: '#858b93', fontSize: 9, fontWeight: '900' },
  calibrationPanel: { position: 'absolute', left: 12, right: 12, top: 208, bottom: 150, borderRadius: 20, borderWidth: 1, borderColor: '#5b5243', backgroundColor: 'rgba(13,16,19,0.98)', padding: 14 },
  panelTitle: { color: '#fff8ea', fontSize: 17, fontWeight: '900', marginTop: 4, marginBottom: 8 },
  calibrationRow: { marginTop: 5 },
  calibrationLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  calibrationLabel: { color: '#c4c7cc', fontSize: 9, fontWeight: '800' },
  calibrationValue: { color: '#e6c98f', fontSize: 9, fontVariant: ['tabular-nums'] }
});
