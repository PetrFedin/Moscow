import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useMemo, useState } from 'react';
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
  sessionToTsv,
  summarizeResiduals,
  type FieldDistanceMeters,
  type RomanovFieldSession
} from '../../spatial/fieldVerification';
import type { RomanovEra } from '../../spatial/romanov-hotspots';
import { romanovControlPoints } from '../../spatial/romanovControlPoints';

const FIELD_STORAGE_KEY = 'moscow:p0:romanov-field-sessions:v1';

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
  const [savedSession, setSavedSession] = useState<RomanovFieldSession | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const observations = useMemo(() => romanovControlPoints.flatMap((point) => {
    const normalized = values[point.id]?.replace(',', '.').trim();
    if (!normalized) return [];
    const residualCm = Number(normalized);
    if (!Number.isFinite(residualCm) || residualCm < 0) return [];
    return [{ controlPointId: point.id, residualCm }];
  }), [values]);

  const summary = summarizeResiduals(observations);
  const complete = observations.length === romanovControlPoints.length;

  const save = async () => {
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
      observations
    });

    try {
      const raw = await AsyncStorage.getItem(FIELD_STORAGE_KEY);
      const existing = raw ? JSON.parse(raw) as RomanovFieldSession[] : [];
      await AsyncStorage.setItem(FIELD_STORAGE_KEY, JSON.stringify([...existing, session]));
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

        {saveError && <Text style={styles.error}>{saveError}</Text>}
        <Pressable style={styles.primary} onPress={save}><Text style={styles.primaryText}>Сохранить измерение {distance} м</Text></Pressable>
        {savedSession && <Pressable style={styles.secondary} onPress={share}><Text style={styles.secondaryText}>Экспортировать TSV-отчёт</Text></Pressable>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end', zIndex: 50 },
  sheet: { maxHeight: '90%', backgroundColor: '#111419', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: '#373b42', padding: 18, paddingBottom: 24 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleCopy: { flex: 1 },
  kicker: { color: '#b99b69', fontSize: 9, letterSpacing: 1.5, fontWeight: '900' },
  title: { color: '#fff8ea', fontSize: 22, fontWeight: '900', marginTop: 5 },
  close: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#454950', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#ddd', fontSize: 23, lineHeight: 24 },
  body: { color: '#aeb1b8', fontSize: 12, lineHeight: 17, marginTop: 10 },
  distanceRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  distance: { flex: 1, minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: '#454950', alignItems: 'center', justifyContent: 'center' },
  distanceActive: { backgroundColor: '#d7bb84', borderColor: '#d7bb84' },
  distanceText: { color: '#c4c7cc', fontWeight: '900' },
  distanceTextActive: { color: '#17130d' },
  list: { marginTop: 12, maxHeight: 280 },
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
  error: { color: '#e99d95', fontSize: 10, marginTop: 8 },
  primary: { minHeight: 46, borderRadius: 14, backgroundColor: '#d7bb84', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  primaryText: { color: '#17130d', fontSize: 12, fontWeight: '900' },
  secondary: { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: '#4b4f56', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  secondaryText: { color: '#e2d0aa', fontSize: 11, fontWeight: '900' }
});
