import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { romanovControlPoints } from '../../spatial/romanovControlPoints';
import {
  createEmptyRomanovSurveyPacket,
  isSurveyPointMeasured,
  summarizeRomanovSurvey,
  surveyPacketToTsv,
  type RomanovSurveyPacket,
  type SurveyMethod
} from '../../spatial/romanovSurvey';

const STORAGE_KEY = 'moscow:p0:romanov-survey-packet:v1';
const methods: SurveyMethod[] = ['total-station', 'gnss-rtk', 'laser-distance', 'photogrammetry', 'verified-drawing', 'other'];

type Props = { onClose: () => void };

type Draft = {
  modelX: string;
  modelY: string;
  modelZ: string;
  latitude: string;
  longitude: string;
  altitude: string;
  horizontalAccuracyCm: string;
  verticalAccuracyCm: string;
  measuredBy: string;
  evidenceRef: string;
  notes: string;
  method: SurveyMethod;
};

const emptyDraft = (): Draft => ({
  modelX: '', modelY: '', modelZ: '', latitude: '', longitude: '', altitude: '',
  horizontalAccuracyCm: '', verticalAccuracyCm: '', measuredBy: '', evidenceRef: '', notes: '', method: 'total-station'
});

const numberOrUndefined = (value: string) => {
  const normalized = value.replace(',', '.').trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export default function RomanovSurveyPacket({ onClose }: Props) {
  const [packet, setPacket] = useState<RomanovSurveyPacket>(() => createEmptyRomanovSurveyPacket());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft());
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as RomanovSurveyPacket;
        if (parsed?.placeId === 'romanov-chambers' && Array.isArray(parsed.points)) setPacket(parsed);
      })
      .catch(() => undefined);
  }, []);

  const selectedControl = romanovControlPoints[selectedIndex];
  const selectedPoint = packet.points.find((point) => point.controlPointId === selectedControl.id);
  const gate = useMemo(() => summarizeRomanovSurvey(packet), [packet]);

  useEffect(() => {
    const point = packet.points.find((item) => item.controlPointId === selectedControl.id);
    if (!point) return;
    setDraft({
      modelX: point.modelPointMeters?.[0]?.toString() ?? '',
      modelY: point.modelPointMeters?.[1]?.toString() ?? '',
      modelZ: point.modelPointMeters?.[2]?.toString() ?? '',
      latitude: point.geodetic?.latitude?.toString() ?? '',
      longitude: point.geodetic?.longitude?.toString() ?? '',
      altitude: point.geodetic?.altitudeMeters?.toString() ?? '',
      horizontalAccuracyCm: point.horizontalAccuracyCm?.toString() ?? '',
      verticalAccuracyCm: point.verticalAccuracyCm?.toString() ?? '',
      measuredBy: point.measuredBy ?? '',
      evidenceRef: point.evidenceRef ?? '',
      notes: point.notes ?? '',
      method: point.method ?? 'total-station'
    });
    setMessage(null);
  }, [packet.points, selectedControl.id]);

  const persist = async (next: RomanovSurveyPacket) => {
    setPacket(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const savePoint = async (verify = false) => {
    const x = numberOrUndefined(draft.modelX);
    const y = numberOrUndefined(draft.modelY);
    const z = numberOrUndefined(draft.modelZ);
    const latitude = numberOrUndefined(draft.latitude);
    const longitude = numberOrUndefined(draft.longitude);
    const horizontalAccuracyCm = numberOrUndefined(draft.horizontalAccuracyCm);
    const verticalAccuracyCm = numberOrUndefined(draft.verticalAccuracyCm);

    if ([x, y, z, latitude, longitude, horizontalAccuracyCm, verticalAccuracyCm].some((value) => value === undefined) || !draft.measuredBy.trim()) {
      setMessage('Заполните XYZ, WGS84, точности и ответственного. Не используйте приблизительные значения.');
      return;
    }

    const nextPoint = {
      controlPointId: selectedControl.id,
      modelPointMeters: [x!, y!, z!] as [number, number, number],
      geodetic: {
        latitude: latitude!,
        longitude: longitude!,
        altitudeMeters: numberOrUndefined(draft.altitude)
      },
      method: draft.method,
      horizontalAccuracyCm: horizontalAccuracyCm!,
      verticalAccuracyCm: verticalAccuracyCm!,
      measuredAt: selectedPoint?.measuredAt ?? new Date().toISOString(),
      measuredBy: draft.measuredBy.trim(),
      evidenceRef: draft.evidenceRef.trim() || undefined,
      notes: draft.notes.trim() || undefined,
      status: verify ? 'verified' as const : 'measured' as const
    };

    if (!isSurveyPointMeasured(nextPoint)) {
      setMessage('Поля не прошли проверку. Проверьте координаты и заявленную точность.');
      return;
    }

    const next = {
      ...packet,
      points: packet.points.map((point) => point.controlPointId === selectedControl.id ? nextPoint : point)
    };
    await persist(next);
    setMessage(verify ? 'Точка сохранена как verified.' : 'Точка сохранена как measured.');
  };

  const approve = async () => {
    const preGate = summarizeRomanovSurvey({ ...packet, approvedAt: new Date().toISOString(), approvedBy: draft.measuredBy.trim() });
    if (preGate.verifiedPoints !== romanovControlPoints.length || preGate.alignmentPointsVerified < 3 || !draft.measuredBy.trim()) {
      setMessage('Сначала все пять точек должны быть verified, а ответственный — указан.');
      return;
    }
    await persist({ ...packet, approvedAt: new Date().toISOString(), approvedBy: draft.measuredBy.trim() });
    setMessage('Survey packet утверждён.');
  };

  const exportPacket = async () => {
    await Share.share({ title: 'Romanov survey packet', message: surveyPacketToTsv(packet) });
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <View style={styles.top}>
          <View style={styles.titleCopy}>
            <Text style={styles.kicker}>P0 · MEASURED CONTROL POINTS</Text>
            <Text style={styles.title}>Обмерный пакет Палат</Text>
          </View>
          <Pressable style={styles.close} onPress={onClose}><Text style={styles.closeText}>×</Text></Pressable>
        </View>

        <View style={styles.pointTabs}>
          {romanovControlPoints.map((point, index) => {
            const stored = packet.points.find((item) => item.controlPointId === point.id);
            return (
              <Pressable key={point.id} onPress={() => setSelectedIndex(index)} style={[styles.pointTab, selectedIndex === index && styles.pointTabActive]}>
                <Text style={[styles.pointTabText, selectedIndex === index && styles.pointTabTextActive]}>{index + 1}</Text>
                <Text style={styles.pointState}>{stored?.status === 'verified' ? '✓' : stored?.status === 'measured' ? 'M' : '·'}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.pointTitle}>{selectedControl.labelRu}</Text>
        <Text style={styles.pointMeta}>{selectedControl.purpose === 'alignment' ? 'Основная привязка' : 'Контроль качества'} · {selectedControl.notes}</Text>

        <ScrollView style={styles.form} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>КООРДИНАТЫ МОДЕЛИ · М</Text>
          <View style={styles.tripleRow}>
            {(['modelX', 'modelY', 'modelZ'] as const).map((field) => <TextInput key={field} value={draft[field]} onChangeText={(value) => setDraft((current) => ({ ...current, [field]: value }))} placeholder={field.slice(-1).toUpperCase()} placeholderTextColor="#676c75" keyboardType="decimal-pad" style={styles.smallInput} />)}
          </View>

          <Text style={styles.sectionLabel}>WGS84</Text>
          <View style={styles.doubleRow}>
            <TextInput value={draft.latitude} onChangeText={(value) => setDraft((current) => ({ ...current, latitude: value }))} placeholder="latitude" placeholderTextColor="#676c75" keyboardType="decimal-pad" style={styles.input} />
            <TextInput value={draft.longitude} onChangeText={(value) => setDraft((current) => ({ ...current, longitude: value }))} placeholder="longitude" placeholderTextColor="#676c75" keyboardType="decimal-pad" style={styles.input} />
          </View>
          <TextInput value={draft.altitude} onChangeText={(value) => setDraft((current) => ({ ...current, altitude: value }))} placeholder="altitude, м — если измерена" placeholderTextColor="#676c75" keyboardType="decimal-pad" style={styles.fullInput} />

          <Text style={styles.sectionLabel}>МЕТОД</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.methodRow}>
            {methods.map((method) => <Pressable key={method} onPress={() => setDraft((current) => ({ ...current, method }))} style={[styles.method, draft.method === method && styles.methodActive]}><Text style={[styles.methodText, draft.method === method && styles.methodTextActive]}>{method}</Text></Pressable>)}
          </ScrollView>

          <Text style={styles.sectionLabel}>ЗАЯВЛЕННАЯ ТОЧНОСТЬ · СМ</Text>
          <View style={styles.doubleRow}>
            <TextInput value={draft.horizontalAccuracyCm} onChangeText={(value) => setDraft((current) => ({ ...current, horizontalAccuracyCm: value }))} placeholder="горизонтальная" placeholderTextColor="#676c75" keyboardType="decimal-pad" style={styles.input} />
            <TextInput value={draft.verticalAccuracyCm} onChangeText={(value) => setDraft((current) => ({ ...current, verticalAccuracyCm: value }))} placeholder="вертикальная" placeholderTextColor="#676c75" keyboardType="decimal-pad" style={styles.input} />
          </View>

          <TextInput value={draft.measuredBy} onChangeText={(value) => setDraft((current) => ({ ...current, measuredBy: value }))} placeholder="Ответственный / измеритель" placeholderTextColor="#676c75" style={styles.fullInput} />
          <TextInput value={draft.evidenceRef} onChangeText={(value) => setDraft((current) => ({ ...current, evidenceRef: value }))} placeholder="Ссылка/номер фото, чертежа или файла" placeholderTextColor="#676c75" style={styles.fullInput} />
          <TextInput value={draft.notes} onChangeText={(value) => setDraft((current) => ({ ...current, notes: value }))} placeholder="Примечание" placeholderTextColor="#676c75" style={[styles.fullInput, styles.notes]} multiline />
        </ScrollView>

        <View style={styles.gateCard}>
          <Text style={styles.gateTitle}>{gate.complete ? 'SURVEY GATE · PASS' : 'SURVEY GATE · BLOCKED'}</Text>
          <Text style={styles.gateText}>Measured {gate.measuredPoints}/{gate.totalPoints} · Verified {gate.verifiedPoints}/{gate.totalPoints} · Alignment verified {gate.alignmentPointsVerified}/3</Text>
        </View>

        {message && <Text style={styles.message}>{message}</Text>}
        <View style={styles.actions}>
          <Pressable style={styles.secondary} onPress={() => savePoint(false)}><Text style={styles.secondaryText}>Сохранить measured</Text></Pressable>
          <Pressable style={styles.primary} onPress={() => savePoint(true)}><Text style={styles.primaryText}>Подтвердить verified</Text></Pressable>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.secondary} onPress={exportPacket}><Text style={styles.secondaryText}>Экспорт TSV</Text></Pressable>
          <Pressable style={[styles.primary, !gate.complete && styles.primaryMuted]} onPress={approve}><Text style={styles.primaryText}>Утвердить пакет</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', inset: 0 as never, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'flex-end', zIndex: 60 },
  sheet: { maxHeight: '96%', backgroundColor: '#111419', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: '#3a3f47', padding: 18, paddingBottom: 22 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleCopy: { flex: 1 },
  kicker: { color: '#b99b69', fontSize: 8, letterSpacing: 1.4, fontWeight: '900' },
  title: { color: '#fff8ea', fontSize: 21, fontWeight: '900', marginTop: 4 },
  close: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#454950', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#ddd', fontSize: 23 },
  pointTabs: { flexDirection: 'row', gap: 7, marginTop: 14 },
  pointTab: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: '#40454c', alignItems: 'center', justifyContent: 'center' },
  pointTabActive: { borderColor: '#d7bb84', backgroundColor: '#211c14' },
  pointTabText: { color: '#a5a9b0', fontWeight: '900' },
  pointTabTextActive: { color: '#e8c98c' },
  pointState: { position: 'absolute', right: 5, top: 3, color: '#7fb58a', fontSize: 8, fontWeight: '900' },
  pointTitle: { color: '#f1ece3', fontSize: 15, fontWeight: '900', marginTop: 12 },
  pointMeta: { color: '#858a92', fontSize: 9, lineHeight: 13, marginTop: 4 },
  form: { maxHeight: 360, marginTop: 4 },
  formContent: { paddingBottom: 8 },
  sectionLabel: { color: '#7f848d', fontSize: 8, letterSpacing: 1.2, fontWeight: '900', marginTop: 12, marginBottom: 5 },
  tripleRow: { flexDirection: 'row', gap: 7 },
  doubleRow: { flexDirection: 'row', gap: 7 },
  smallInput: { flex: 1, minHeight: 42, borderRadius: 11, borderWidth: 1, borderColor: '#41464e', backgroundColor: '#191d22', color: '#fff4df', paddingHorizontal: 10 },
  input: { flex: 1, minHeight: 42, borderRadius: 11, borderWidth: 1, borderColor: '#41464e', backgroundColor: '#191d22', color: '#fff4df', paddingHorizontal: 10 },
  fullInput: { minHeight: 42, borderRadius: 11, borderWidth: 1, borderColor: '#41464e', backgroundColor: '#191d22', color: '#fff4df', paddingHorizontal: 10, marginTop: 7 },
  notes: { minHeight: 62, textAlignVertical: 'top', paddingTop: 10 },
  methodRow: { gap: 6, paddingRight: 8 },
  method: { borderRadius: 10, borderWidth: 1, borderColor: '#41464e', paddingHorizontal: 10, paddingVertical: 8 },
  methodActive: { borderColor: '#a88d60', backgroundColor: '#211c14' },
  methodText: { color: '#8f949c', fontSize: 9, fontWeight: '800' },
  methodTextActive: { color: '#e7c98f' },
  gateCard: { marginTop: 10, borderRadius: 13, borderWidth: 1, borderColor: '#4b4032', backgroundColor: '#18140f', padding: 10 },
  gateTitle: { color: '#e2c487', fontSize: 9, fontWeight: '900' },
  gateText: { color: '#90949b', fontSize: 9, lineHeight: 13, marginTop: 3 },
  message: { color: '#d5b87e', fontSize: 9, marginTop: 7 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  primary: { flex: 1, minHeight: 43, borderRadius: 13, backgroundColor: '#d7bb84', alignItems: 'center', justifyContent: 'center' },
  primaryMuted: { opacity: 0.7 },
  primaryText: { color: '#17130d', fontSize: 10, fontWeight: '900', textAlign: 'center' },
  secondary: { flex: 1, minHeight: 43, borderRadius: 13, borderWidth: 1, borderColor: '#4a4f57', alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#e0cfad', fontSize: 10, fontWeight: '900', textAlign: 'center' }
});
