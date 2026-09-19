import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import {
  isReleaseEligibleMeasuredResidual,
  type RomanovMeasuredControlPointResidual
} from '../../spatial/alignmentResidual';
import type { CalibrationProfile } from '../../spatial/calibration';
import {
  createFieldSession,
  ROMANOV_FIELD_DISTANCES,
  ROMANOV_FIELD_MAX_TARGET_CM,
  ROMANOV_FIELD_MEAN_TARGET_CM,
  ROMANOV_REQUIRED_ANDROID_DEVICES,
  ROMANOV_REQUIRED_IOS_DEVICES,
  sessionToTsv,
  summarizeFieldMatrix,
  summarizeResiduals,
  type FieldDistanceMeters,
  type RomanovFieldSession
} from '../../spatial/fieldVerification';
import type { RomanovEra } from '../../spatial/romanov-hotspots';
import { romanovControlPoints } from '../../spatial/romanovControlPoints';

const FIELD_STORAGE_KEY = 'moscow:p0:romanov-field-sessions:v1';
const DEVICE_LABEL_STORAGE_KEY = 'moscow:p0:romanov-device-label:v1';

type Props = {
  calibration: CalibrationProfile;
  era: RomanovEra;
  onMeasureResidual: (
    controlPointId: string,
    distance: FieldDistanceMeters
  ) => Promise<RomanovMeasuredControlPointResidual>;
  onClose: () => void;
};

type ResidualMap = Record<string, RomanovMeasuredControlPointResidual>;

const emptyDistanceMap = (): Record<FieldDistanceMeters, ResidualMap> => ({
  5: {},
  10: {},
  15: {}
});

export default function RomanovFieldTest({
  calibration,
  era,
  onMeasureResidual,
  onClose
}: Props) {
  const [distance, setDistance] = useState<FieldDistanceMeters>(5);
  const [measurements, setMeasurements] = useState<Record<FieldDistanceMeters, ResidualMap>>(() => emptyDistanceMap());
  const [deviceLabel, setDeviceLabel] = useState('');
  const [sessions, setSessions] = useState<RomanovFieldSession[]>([]);
  const [savedSession, setSavedSession] = useState<RomanovFieldSession | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [armedPointId, setArmedPointId] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(FIELD_STORAGE_KEY),
      AsyncStorage.getItem(DEVICE_LABEL_STORAGE_KEY)
    ])
      .then(([rawSessions, rawDeviceLabel]) => {
        if (rawSessions) {
          const parsed = JSON.parse(rawSessions) as RomanovFieldSession[];
          if (Array.isArray(parsed)) setSessions(parsed);
        }
        if (rawDeviceLabel) setDeviceLabel(rawDeviceLabel);
      })
      .catch(() => undefined);
  }, []);

  const currentMeasurements = measurements[distance];
  const observations = useMemo(
    () => romanovControlPoints.flatMap((point) => {
      const measured = currentMeasurements[point.id];
      return measured ? [measured] : [];
    }),
    [currentMeasurements]
  );
  const summary = summarizeResiduals(observations);
  const matrix = useMemo(() => summarizeFieldMatrix(sessions), [sessions]);
  const surveyIds = [...new Set(observations.map((item) => item.evidence?.surveyPacketId).filter(Boolean))] as string[];
  const surveyPacketId = surveyIds.length === 1 ? surveyIds[0] : undefined;
  const eligibleCount = observations.filter((item) => isReleaseEligibleMeasuredResidual(item, {
    calibrationVersion: calibration.version,
    distanceBucketMeters: distance,
    surveyPacketId
  })).length;
  const complete = observations.length === romanovControlPoints.length;
  const releaseEligible = complete && eligibleCount === romanovControlPoints.length && surveyIds.length === 1;

  const capture = async () => {
    if (!armedPointId || capturing) return;
    setCapturing(true);
    setSaveError(null);
    try {
      const residual = await onMeasureResidual(armedPointId, distance);
      setMeasurements((current) => ({
        ...current,
        [distance]: {
          ...current[distance],
          [armedPointId]: residual
        }
      }));
      setSavedSession(null);
      setArmedPointId(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Не удалось измерить AR residual.');
    } finally {
      setCapturing(false);
    }
  };

  const save = async () => {
    if (!deviceLabel.trim()) {
      setSaveError('Укажите конкретное устройство, например iPhone 16 Pro #1.');
      return;
    }
    if (!releaseEligible) {
      setSaveError('Нужны пять release-grade AR измерений текущей дистанции из одного утверждённого survey packet.');
      return;
    }

    const session = createFieldSession({
      era,
      viewingDistanceMeters: distance,
      calibration,
      devicePlatform: Platform.OS,
      deviceVersion: String(Platform.Version),
      deviceLabel: deviceLabel.trim(),
      appBuild: process.env.EXPO_PUBLIC_BUILD_ID ?? 'local',
      surveyPacketId,
      observations
    });

    try {
      const next = [...sessions, session];
      await Promise.all([
        AsyncStorage.setItem(FIELD_STORAGE_KEY, JSON.stringify(next)),
        AsyncStorage.setItem(DEVICE_LABEL_STORAGE_KEY, deviceLabel.trim())
      ]);
      setSessions(next);
      setSavedSession(session);
      setSaveError(null);
    } catch {
      setSaveError('Не удалось сохранить измерение на устройстве.');
    }
  };

  const share = async () => {
    if (!savedSession) return;
    await Share.share({
      title: `Romanov field test · ${savedSession.viewingDistanceMeters}m`,
      message: sessionToTsv(savedSession)
    });
  };

  if (armedPointId) {
    const point = romanovControlPoints.find((item) => item.id === armedPointId);
    return (
      <View style={styles.measureOverlay}>
        <View style={styles.measureTop}>
          <Text style={styles.measureKicker}>AR RESIDUAL · {distance} М</Text>
          <Text style={styles.measureTitle}>{point?.labelRu}</Text>
          <Text style={styles.measureBody}>
            Встаньте на выбранную дистанцию. Совместите перекрестие с тем же физическим репером фасада и держите устройство неподвижно. Измерение принимается только при TRACKING_NORMAL и depth/plane hit.
          </Text>
        </View>
        <View pointerEvents="none" style={styles.reticle}>
          <View style={styles.reticleHorizontal} />
          <View style={styles.reticleVertical} />
          <View style={styles.reticleDot} />
        </View>
        {saveError && <Text style={styles.measureError}>{saveError}</Text>}
        <View style={styles.measureActions}>
          <Pressable disabled={capturing} style={[styles.captureButton, capturing && styles.disabled]} onPress={capture}>
            <Text style={styles.captureText}>{capturing ? 'ИЗМЕРЯЕМ…' : 'ЗАФИКСИРОВАТЬ ЦЕНТР'}</Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={() => { setArmedPointId(null); setSaveError(null); }}>
            <Text style={styles.cancelText}>Отмена</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <View style={styles.top}>
          <View style={styles.titleCopy}>
            <Text style={styles.kicker}>P0 · MEASURED ALIGNMENT ERROR</Text>
            <Text style={styles.title}>Ошибка совмещения AR</Text>
          </View>
          <Pressable style={styles.close} onPress={onClose}><Text style={styles.closeText}>×</Text></Pressable>
        </View>

        <Text style={styles.body}>
          Residual теперь не вводится вручную. Для каждой фасадной точки приложение сравнивает её ожидаемое положение по калиброванной модели с AR hit реального фасада и сохраняет исходные world-space координаты.
        </Text>

        <Text style={styles.fieldLabel}>ФИЗИЧЕСКОЕ УСТРОЙСТВО</Text>
        <TextInput
          value={deviceLabel}
          onChangeText={(value) => { setDeviceLabel(value); setSaveError(null); }}
          placeholder={Platform.OS === 'ios' ? 'iPhone 16 Pro #1' : 'Android device #1'}
          placeholderTextColor="#6f747d"
          style={styles.deviceInput}
          autoCapitalize="sentences"
        />

        <View style={styles.distanceRow}>
          {ROMANOV_FIELD_DISTANCES.map((item) => (
            <Pressable key={item} style={[styles.distance, distance === item && styles.distanceActive]} onPress={() => { setDistance(item); setSavedSession(null); setSaveError(null); }}>
              <Text style={[styles.distanceText, distance === item && styles.distanceTextActive]}>{item} м</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {romanovControlPoints.map((point, index) => {
            const measured = currentMeasurements[point.id];
            const eligible = measured ? isReleaseEligibleMeasuredResidual(measured, {
              calibrationVersion: calibration.version,
              distanceBucketMeters: distance,
              surveyPacketId: measured.evidence?.surveyPacketId
            }) : false;
            return (
              <View key={point.id} style={styles.pointRow}>
                <View style={styles.pointNumber}><Text style={styles.pointNumberText}>{index + 1}</Text></View>
                <View style={styles.pointCopy}>
                  <Text style={styles.pointTitle}>{point.labelRu}</Text>
                  <Text style={styles.pointMeta}>
                    {measured
                      ? `${measured.residualCm.toFixed(1)} см · ${measured.evidence?.actualViewingDistanceMeters.toFixed(2)} м · ${measured.evidence?.hitType}`
                      : point.purpose === 'alignment' ? 'основная привязка' : 'контроль качества'}
                  </Text>
                  {measured && <Text style={[styles.evidenceState, eligible ? styles.evidencePass : styles.evidenceFail]}>{eligible ? 'MEASURED · RELEASE-ELIGIBLE' : 'MEASURED · НЕ ПРОХОДИТ AUTHORITY'}</Text>}
                </View>
                <Pressable style={[styles.measureButton, measured && styles.measureAgain]} onPress={() => { setArmedPointId(point.id); setSaveError(null); }}>
                  <Text style={styles.measureButtonText}>{measured ? '↻' : 'Измерить'}</Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.summary}>
          <View><Text style={styles.summaryLabel}>Средняя</Text><Text style={styles.summaryValue}>{observations.length ? summary.meanResidualCm.toFixed(1) : '—'} см</Text></View>
          <View><Text style={styles.summaryLabel}>Максимум</Text><Text style={styles.summaryValue}>{observations.length ? summary.maxResidualCm.toFixed(1) : '—'} см</Text></View>
          <View><Text style={styles.summaryLabel}>Authority</Text><Text style={styles.summaryValue}>{eligibleCount}/5</Text></View>
        </View>

        <View style={[styles.verdict, releaseEligible && (summary.passed ? styles.verdictPass : styles.verdictFail)]}>
          <Text style={styles.verdictText}>
            {!releaseEligible
              ? `MEASURE · ${eligibleCount}/5 release-grade точек`
              : summary.passed
                ? `PASS · mean ≤ ${ROMANOV_FIELD_MEAN_TARGET_CM} см · max ≤ ${ROMANOV_FIELD_MAX_TARGET_CM} см`
                : 'RECALIBRATE · измеренная ошибка выше P0-порога'}
          </Text>
        </View>

        <View style={[styles.matrixCard, matrix.eligibleForPersistentAnchor && styles.matrixCardReady]}>
          <Text style={styles.matrixKicker}>CROSS-DEVICE GATE</Text>
          <Text style={styles.matrixTitle}>{matrix.eligibleForPersistentAnchor ? 'ГОТОВО К PERSISTENT ANCHOR' : 'PERSISTENT ANCHOR ЗАБЛОКИРОВАН'}</Text>
          <Text style={styles.matrixText}>iPhone/iOS: {matrix.iosCompleteDevices}/{ROMANOV_REQUIRED_IOS_DEVICES} · Android: {matrix.androidCompleteDevices}/{ROMANOV_REQUIRED_ANDROID_DEVICES}</Text>
          <Text style={styles.matrixText}>Для каждого физического устройства нужны measured PASS на 5 / 10 / 15 м.</Text>
          {matrix.unmeasuredSessions > 0 && (
            <Text style={styles.matrixWarning}>Legacy/ручные сессии: {matrix.unmeasuredSessions}. Они остаются в аудите, но больше не участвуют в release gate.</Text>
          )}
          {matrix.staleMetricSessions > 0 && (
            <Text style={styles.matrixWarning}>Сессии старой модели: {matrix.staleMetricSessions}. Они не участвуют в release gate.</Text>
          )}
        </View>

        {saveError && <Text style={styles.error}>{saveError}</Text>}
        <Pressable style={[styles.primary, !releaseEligible && styles.primaryMuted]} onPress={save}><Text style={styles.primaryText}>Сохранить measured session · {distance} м</Text></Pressable>
        {savedSession && <Pressable style={styles.secondary} onPress={share}><Text style={styles.secondaryText}>Экспортировать evidence TSV</Text></Pressable>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end', zIndex: 50 },
  sheet: { maxHeight: '94%', backgroundColor: '#111419', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: '#373b42', padding: 18, paddingBottom: 24 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleCopy: { flex: 1 },
  kicker: { color: '#b99b69', fontSize: 9, letterSpacing: 1.5, fontWeight: '900' },
  title: { color: '#fff8ea', fontSize: 22, fontWeight: '900', marginTop: 5 },
  close: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#454950', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#ddd', fontSize: 23, lineHeight: 24 },
  body: { color: '#aeb1b8', fontSize: 11, lineHeight: 16, marginTop: 10 },
  fieldLabel: { color: '#7f848d', fontSize: 8, letterSpacing: 1.3, fontWeight: '900', marginTop: 14, marginBottom: 6 },
  deviceInput: { minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: '#42474f', backgroundColor: '#191d22', paddingHorizontal: 12, color: '#fff4df', fontSize: 12, fontWeight: '800' },
  distanceRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  distance: { flex: 1, minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: '#454950', alignItems: 'center', justifyContent: 'center' },
  distanceActive: { backgroundColor: '#d7bb84', borderColor: '#d7bb84' },
  distanceText: { color: '#c4c7cc', fontWeight: '900' },
  distanceTextActive: { color: '#17130d' },
  list: { marginTop: 12, maxHeight: 255 },
  listContent: { paddingBottom: 4 },
  pointRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#30343a' },
  pointNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#272b31', alignItems: 'center', justifyContent: 'center' },
  pointNumberText: { color: '#e8c98c', fontWeight: '900' },
  pointCopy: { flex: 1 },
  pointTitle: { color: '#e8e4dc', fontSize: 12, fontWeight: '800' },
  pointMeta: { color: '#797e86', fontSize: 8.5, marginTop: 3 },
  evidenceState: { fontSize: 7.5, fontWeight: '900', marginTop: 3 },
  evidencePass: { color: '#7fb58a' },
  evidenceFail: { color: '#d28d84' },
  measureButton: { minWidth: 66, minHeight: 38, borderRadius: 11, backgroundColor: '#d7bb84', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  measureAgain: { minWidth: 40, backgroundColor: '#24292f', borderWidth: 1, borderColor: '#4a5058' },
  measureButtonText: { color: '#17130d', fontSize: 9, fontWeight: '900' },
  summary: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 14, borderRadius: 15, backgroundColor: '#191d22', padding: 12 },
  summaryLabel: { color: '#7f848c', fontSize: 9, fontWeight: '800' },
  summaryValue: { color: '#eee9df', fontSize: 12, fontWeight: '900', marginTop: 3 },
  verdict: { marginTop: 10, borderRadius: 13, backgroundColor: '#22262c', padding: 10, alignItems: 'center' },
  verdictPass: { backgroundColor: '#193120' },
  verdictFail: { backgroundColor: '#3a201f' },
  verdictText: { color: '#dedfe2', fontSize: 10, fontWeight: '900' },
  matrixCard: { marginTop: 10, borderRadius: 14, borderWidth: 1, borderColor: '#4a4033', backgroundColor: '#191510', padding: 11 },
  matrixCardReady: { borderColor: '#426d4b', backgroundColor: '#122017' },
  matrixKicker: { color: '#a7895b', fontSize: 8, letterSpacing: 1.2, fontWeight: '900' },
  matrixTitle: { color: '#e5c98f', fontSize: 11, fontWeight: '900', marginTop: 3 },
  matrixText: { color: '#95999f', fontSize: 9, lineHeight: 13, marginTop: 4 },
  matrixWarning: { color: '#c58d81', fontSize: 9, lineHeight: 13, marginTop: 4 },
  error: { color: '#e99d95', fontSize: 10, marginTop: 8 },
  primary: { minHeight: 46, borderRadius: 14, backgroundColor: '#d7bb84', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  primaryMuted: { opacity: 0.55 },
  primaryText: { color: '#17130d', fontSize: 12, fontWeight: '900' },
  secondary: { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: '#4b4f56', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  secondaryText: { color: '#e2d0aa', fontSize: 11, fontWeight: '900' },

  measureOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 80, backgroundColor: 'rgba(0,0,0,0.18)' },
  measureTop: { position: 'absolute', top: 44, left: 16, right: 16, borderRadius: 18, backgroundColor: 'rgba(10,12,15,0.90)', borderWidth: 1, borderColor: '#4f5963', padding: 14 },
  measureKicker: { color: '#d7bb84', fontSize: 8, fontWeight: '900', letterSpacing: 1.3 },
  measureTitle: { color: '#fff8ea', fontSize: 16, fontWeight: '900', marginTop: 4 },
  measureBody: { color: '#b2b6bd', fontSize: 10, lineHeight: 15, marginTop: 6 },
  reticle: { position: 'absolute', left: '50%', top: '50%', width: 74, height: 74, marginLeft: -37, marginTop: -37, alignItems: 'center', justifyContent: 'center' },
  reticleHorizontal: { position: 'absolute', width: 74, height: 1, backgroundColor: '#f1d49b' },
  reticleVertical: { position: 'absolute', height: 74, width: 1, backgroundColor: '#f1d49b' },
  reticleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f1d49b', borderWidth: 2, borderColor: '#111' },
  measureError: { position: 'absolute', left: 16, right: 16, bottom: 132, color: '#ffd0c8', backgroundColor: 'rgba(74,27,24,0.88)', borderRadius: 12, padding: 10, fontSize: 10, textAlign: 'center' },
  measureActions: { position: 'absolute', left: 16, right: 16, bottom: 28, gap: 8 },
  captureButton: { minHeight: 52, borderRadius: 16, backgroundColor: '#d7bb84', alignItems: 'center', justifyContent: 'center' },
  captureText: { color: '#17130d', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  cancelButton: { minHeight: 42, borderRadius: 14, backgroundColor: 'rgba(13,16,19,0.88)', borderWidth: 1, borderColor: '#4c525b', alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#ddd2bc', fontSize: 10, fontWeight: '900' },
  disabled: { opacity: 0.45 }
});
