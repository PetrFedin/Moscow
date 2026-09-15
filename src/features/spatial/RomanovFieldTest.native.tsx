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
  onClose: () => void;
};

const makeEmptyValues = () => romanovControlPoints.reduce<Record<string, string>>((acc, point) => {
  acc[point.id] = '';
  return acc;
}, {});

export default function RomanovFieldTest({ calibration, era, onClose }: Props) {
  const [distance, setDistance] = useState<FieldDistanceMeters>(5);
  const [values, setValues] = useState<Record<string, string>>(() => makeEmptyValues());
  const [deviceLabel, setDeviceLabel] = useState('');
  const [sessions, setSessions] = useState<RomanovFieldSession[]>([]);
  const [savedSession, setSavedSession] = useState<RomanovFieldSession | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  const observations = useMemo(() => romanovControlPoints.flatMap((point) => {
    const normalized = values[point.id]?.replace(',', '.').trim();
    if (!normalized) return [];
    const residualCm = Number(normalized);
    if (!Number.isFinite(residualCm) || residualCm < 0) return [];
    return [{ controlPointId: point.id, residualCm }];
  }), [values]);

  const summary = summarizeResiduals(observations);
  const matrix = useMemo(() => summarizeFieldMatrix(sessions), [sessions]);
  const complete = observations.length === romanovControlPoints.length;

  const save = async () => {
    if (!deviceLabel.trim()) {
      setSaveError('Укажите конкретное устройство, например iPhone 16 Pro #1.');
      return;
    }
    if (!complete) {
      setSaveError('Заполните ошибку для всех пяти контрольных точек.');
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

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <View style={styles.top}>
          <View style={styles.titleCopy}>
            <Text style={styles.kicker}>P0 · FIELD VERIFICATION</Text>
            <Text style={styles.title}>Измерение ошибки совмещения</Text>
          </View>
          <Pressable style={styles.close} onPress={onClose}><Text style={styles.closeText}>×</Text></Pressable>
        </View>

        <Text style={styles.body}>Для выбранной дистанции оцените остаточную ошибку между моделью и реальным фасадом в каждой устойчивой контрольной точке. Не подгоняйте значения под целевой порог.</Text>

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
            <Pressable key={item} style={[styles.distance, distance === item && styles.distanceActive]} onPress={() => { setDistance(item); setSavedSession(null); }}>
              <Text style={[styles.distanceText, distance === item && styles.distanceTextActive]}>{item} м</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
          {romanovControlPoints.map((point, index) => (
            <View key={point.id} style={styles.pointRow}>
              <View style={styles.pointNumber}><Text style={styles.pointNumberText}>{index + 1}</Text></View>
              <View style={styles.pointCopy}>
                <Text style={styles.pointTitle}>{point.labelRu}</Text>
                <Text style={styles.pointMeta}>{point.purpose === 'alignment' ? 'основная привязка' : 'контроль качества'} · {point.state}</Text>
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  value={values[point.id]}
                  onChangeText={(value) => { setValues((current) => ({ ...current, [point.id]: value })); setSavedSession(null); setSaveError(null); }}
                  keyboardType="decimal-pad"
                  placeholder="см"
                  placeholderTextColor="#70747c"
                  style={styles.input}
                  accessibilityLabel={`Ошибка в сантиметрах: ${point.labelRu}`}
                />
                <Text style={styles.unit}>см</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.summary}>
          <View><Text style={styles.summaryLabel}>Средняя</Text><Text style={styles.summaryValue}>{observations.length ? summary.meanResidualCm.toFixed(1) : '—'} см</Text></View>
          <View><Text style={styles.summaryLabel}>Максимум</Text><Text style={styles.summaryValue}>{observations.length ? summary.maxResidualCm.toFixed(1) : '—'} см</Text></View>
          <View><Text style={styles.summaryLabel}>Цель</Text><Text style={styles.summaryValue}>≤ {ROMANOV_FIELD_MEAN_TARGET_CM} / {ROMANOV_FIELD_MAX_TARGET_CM} см</Text></View>
        </View>

        <View style={[styles.verdict, complete && (summary.passed ? styles.verdictPass : styles.verdictFail)]}>
          <Text style={styles.verdictText}>{!complete ? `Заполнено ${observations.length} из ${romanovControlPoints.length}` : summary.passed ? 'PASS · внутренний P0-порог выполнен' : 'RECALIBRATE · порог не выполнен'}</Text>
        </View>

        <View style={[styles.matrixCard, matrix.eligibleForPersistentAnchor && styles.matrixCardReady]}>
          <Text style={styles.matrixKicker}>CROSS-DEVICE GATE</Text>
          <Text style={styles.matrixTitle}>{matrix.eligibleForPersistentAnchor ? 'ГОТОВО К PERSISTENT ANCHOR' : 'PERSISTENT ANCHOR ЗАБЛОКИРОВАН'}</Text>
          <Text style={styles.matrixText}>iPhone/iOS: {matrix.iosCompleteDevices}/{ROMANOV_REQUIRED_IOS_DEVICES} · Android: {matrix.androidCompleteDevices}/{ROMANOV_REQUIRED_ANDROID_DEVICES}</Text>
          <Text style={styles.matrixText}>Для каждого устройства нужны PASS на 5 / 10 / 15 м. Всего сохранено сессий: {matrix.sessions}.</Text>
        </View>

        {saveError && <Text style={styles.error}>{saveError}</Text>}
        <Pressable style={styles.primary} onPress={save}><Text style={styles.primaryText}>Сохранить измерение {distance} м</Text></Pressable>
        {savedSession && <Pressable style={styles.secondary} onPress={share}><Text style={styles.secondaryText}>Экспортировать TSV-отчёт</Text></Pressable>}
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
  body: { color: '#aeb1b8', fontSize: 12, lineHeight: 17, marginTop: 10 },
  fieldLabel: { color: '#7f848d', fontSize: 8, letterSpacing: 1.3, fontWeight: '900', marginTop: 14, marginBottom: 6 },
  deviceInput: { minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: '#42474f', backgroundColor: '#191d22', paddingHorizontal: 12, color: '#fff4df', fontSize: 12, fontWeight: '800' },
  distanceRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  distance: { flex: 1, minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: '#454950', alignItems: 'center', justifyContent: 'center' },
  distanceActive: { backgroundColor: '#d7bb84', borderColor: '#d7bb84' },
  distanceText: { color: '#c4c7cc', fontWeight: '900' },
  distanceTextActive: { color: '#17130d' },
  list: { marginTop: 12, maxHeight: 235 },
  listContent: { paddingBottom: 4 },
  pointRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#30343a' },
  pointNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#272b31', alignItems: 'center', justifyContent: 'center' },
  pointNumberText: { color: '#e8c98c', fontWeight: '900' },
  pointCopy: { flex: 1 },
  pointTitle: { color: '#e8e4dc', fontSize: 12, fontWeight: '800' },
  pointMeta: { color: '#797e86', fontSize: 9, marginTop: 3 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', width: 84, borderRadius: 11, borderWidth: 1, borderColor: '#41454d', paddingHorizontal: 9 },
  input: { flex: 1, minHeight: 39, color: '#fff', textAlign: 'right', fontSize: 14, fontWeight: '800' },
  unit: { color: '#777c84', fontSize: 9, marginLeft: 3 },
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
  error: { color: '#e99d95', fontSize: 10, marginTop: 8 },
  primary: { minHeight: 46, borderRadius: 14, backgroundColor: '#d7bb84', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  primaryText: { color: '#17130d', fontSize: 12, fontWeight: '900' },
  secondary: { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: '#4b4f56', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  secondaryText: { color: '#e2d0aa', fontSize: 11, fontWeight: '900' }
});
