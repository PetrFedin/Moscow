import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import type { CalibrationProfile } from '../../spatial/calibration';
import {
  parseFieldCampaignPackage,
  parseFieldSessionBundle,
  serializeFieldCampaignPackage,
  serializeFieldSessionBundle
} from '../../spatial/fieldCampaign';
import {
  summarizeFieldMatrix,
  validateFieldSessionIntegrity,
  type RomanovFieldSession
} from '../../spatial/fieldVerification';
import {
  createEmptyRomanovSurveyPacket,
  summarizeRomanovSurvey,
  type RomanovSurveyPacket
} from '../../spatial/romanovSurvey';

const CALIBRATION_KEY = 'moscow:p0:romanov-calibration:v1';
const SURVEY_KEY = 'moscow:p0:romanov-survey-packet:v1';
const FIELD_KEY = 'moscow:p0:romanov-field-sessions:v1';
const DEVICE_LABEL_KEY = 'moscow:p0:romanov-device-label:v1';

type Props = {
  calibration: CalibrationProfile;
  onCalibrationChange: (calibration: CalibrationProfile) => void;
  onClose: () => void;
};

export default function RomanovEvidenceTransferPanel({
  calibration,
  onCalibrationChange,
  onClose
}: Props) {
  const [survey, setSurvey] = useState<RomanovSurveyPacket>(() => createEmptyRomanovSurveyPacket());
  const [sessions, setSessions] = useState<RomanovFieldSession[]>([]);
  const [deviceLabel, setDeviceLabel] = useState('');
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState('Загружаем evidence…');

  const load = async () => {
    const [rawSurvey, rawSessions, rawDeviceLabel] = await Promise.all([
      AsyncStorage.getItem(SURVEY_KEY),
      AsyncStorage.getItem(FIELD_KEY),
      AsyncStorage.getItem(DEVICE_LABEL_KEY)
    ]);
    setSurvey(rawSurvey ? JSON.parse(rawSurvey) as RomanovSurveyPacket : createEmptyRomanovSurveyPacket());
    setSessions(rawSessions ? JSON.parse(rawSessions) as RomanovFieldSession[] : []);
    setDeviceLabel(rawDeviceLabel ?? '');
    setStatus('Evidence transfer готов.');
  };

  useEffect(() => {
    load().catch((error) => setStatus(error instanceof Error ? error.message : 'Не удалось загрузить evidence.'));
  }, []);

  const surveyGate = useMemo(() => summarizeRomanovSurvey(survey), [survey]);
  const matrix = useMemo(() => summarizeFieldMatrix(sessions, calibration.version), [calibration.version, sessions]);
  const localDeviceSessions = useMemo(
    () => sessions.filter((item) =>
      item.calibration.version === calibration.version
      && item.surveyPacketId === survey.id
      && item.deviceLabel?.trim() === deviceLabel.trim()
      && validateFieldSessionIntegrity(item)
    ),
    [calibration.version, deviceLabel, sessions, survey.id]
  );

  const exportCampaign = async () => {
    try {
      const payload = serializeFieldCampaignPackage(calibration, survey);
      await Share.share({ title: 'Romanov field campaign', message: payload });
      setStatus('Campaign JSON готов. Импортируйте его на каждый тестовый телефон до измерений.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Campaign export failed.');
    }
  };

  const exportDeviceSessions = async () => {
    try {
      const payload = serializeFieldSessionBundle(localDeviceSessions);
      await Share.share({ title: 'Romanov field session bundle', message: payload });
      setStatus(`Экспортировано сессий этого устройства: ${localDeviceSessions.length}. Передайте bundle на authority-device.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Field session export failed.');
    }
  };

  const importEvidence = async () => {
    const raw = importText.trim();
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as { kind?: string };
      if (parsed.kind === 'romanov-field-campaign') {
        const campaign = parseFieldCampaignPackage(raw);
        await Promise.all([
          AsyncStorage.setItem(CALIBRATION_KEY, JSON.stringify(campaign.calibration)),
          AsyncStorage.setItem(SURVEY_KEY, JSON.stringify(campaign.survey))
        ]);
        setSurvey(campaign.survey);
        onCalibrationChange(campaign.calibration);
        setImportText('');
        setStatus(`Campaign импортирован · calibration v${campaign.calibration.version} · survey ${campaign.survey.id}. Старые local sessions сохранены, но authority gate отфильтрует их как stale.`);
        return;
      }

      if (parsed.kind === 'romanov-field-session-bundle') {
        const bundle = parseFieldSessionBundle(raw);
        if (bundle.calibrationVersion !== calibration.version) {
          throw new Error(`Bundle calibration v${bundle.calibrationVersion}, текущая v${calibration.version}.`);
        }
        if (bundle.surveyPacketId !== survey.id) {
          throw new Error('Bundle относится к другому survey packet.');
        }
        const next = [
          ...sessions.filter((existing) => !bundle.sessions.some((incoming) => incoming.id === existing.id)),
          ...bundle.sessions
        ];
        await AsyncStorage.setItem(FIELD_KEY, JSON.stringify(next));
        setSessions(next);
        setImportText('');
        setStatus(`Импортировано ${bundle.sessions.length} measured sessions · ${bundle.deviceLabel}.`);
        return;
      }

      throw new Error('Неизвестный evidence package kind.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Evidence import failed.');
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>P0 · CROSS-DEVICE EVIDENCE</Text>
            <Text style={styles.title}>Передача полевых доказательств</Text>
          </View>
          <Pressable style={styles.close} onPress={onClose}><Text style={styles.closeText}>×</Text></Pressable>
        </View>

        <Text style={styles.body}>
          Один authority-device создаёт survey + calibration campaign. Остальные телефоны импортируют тот же campaign, снимают 5/10/15 м и возвращают versioned session bundle. Ручное изменение JSON не считается криптографически защищённым attestation.
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>SURVEY</Text>
            <Text style={styles.summaryValue}>{surveyGate.complete ? 'PASS' : 'BLOCKED'}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>CALIBRATION</Text>
            <Text style={styles.summaryValue}>v{calibration.version}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>MATRIX</Text>
            <Text style={styles.summaryValue}>{matrix.iosCompleteDevices} iOS · {matrix.androidCompleteDevices} A</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.step}>1 · AUTHORITY DEVICE → ВСЕ ТЕЛЕФОНЫ</Text>
          <Pressable style={[styles.primary, !surveyGate.complete && styles.disabled]} disabled={!surveyGate.complete} onPress={exportCampaign}>
            <Text style={styles.primaryText}>Экспортировать survey + calibration campaign</Text>
          </Pressable>

          <Text style={styles.step}>2 · КАЖДЫЙ ТЕЛЕФОН → AUTHORITY DEVICE</Text>
          <Text style={styles.meta}>
            Текущее устройство: {deviceLabel || 'label не задан'} · authoritative sessions: {localDeviceSessions.length}/3
          </Text>
          <Pressable style={[styles.secondary, localDeviceSessions.length === 0 && styles.disabled]} disabled={localDeviceSessions.length === 0} onPress={exportDeviceSessions}>
            <Text style={styles.secondaryText}>Экспортировать measured session bundle</Text>
          </Pressable>

          <Text style={styles.step}>3 · ИМПОРТ PACKAGE</Text>
          <TextInput
            value={importText}
            onChangeText={setImportText}
            multiline
            style={styles.input}
            placeholder="Вставьте полный field-campaign или field-session-bundle JSON"
            placeholderTextColor="#666c74"
          />
          <Pressable style={[styles.secondary, !importText.trim() && styles.disabled]} disabled={!importText.trim()} onPress={importEvidence}>
            <Text style={styles.secondaryText}>Проверить authority и импортировать</Text>
          </Pressable>

          <View style={styles.matrixCard}>
            <Text style={styles.matrixTitle}>{matrix.crossPlatformReady ? 'CROSS-DEVICE MATRIX · PASS' : 'CROSS-DEVICE MATRIX · INCOMPLETE'}</Text>
            <Text style={styles.matrixText}>iOS complete: {matrix.iosCompleteDevices}/2 · Android complete: {matrix.androidCompleteDevices}/2</Text>
            <Text style={styles.matrixText}>Measured sessions: {matrix.currentMetricSessions} · passed: {matrix.passedSessions} · stale calibration: {matrix.staleCalibrationSessions}</Text>
          </View>
        </ScrollView>

        <Text style={styles.status}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 88, backgroundColor: 'rgba(0,0,0,0.74)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '92%', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: '#414750', backgroundColor: '#111419', padding: 18, paddingBottom: 24 },
  header: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  headerCopy: { flex: 1 },
  kicker: { color: '#b99b69', fontSize: 8, fontWeight: '900', letterSpacing: 1.3 },
  title: { color: '#fff8ea', fontSize: 21, fontWeight: '900', marginTop: 4 },
  close: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#454b53', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#eee', fontSize: 23 },
  body: { color: '#a8adb4', fontSize: 10, lineHeight: 15, marginTop: 9 },
  summaryRow: { flexDirection: 'row', gap: 7, marginTop: 12 },
  summaryCard: { flex: 1, borderRadius: 13, backgroundColor: '#181c21', padding: 9 },
  summaryLabel: { color: '#777d85', fontSize: 7, fontWeight: '900' },
  summaryValue: { color: '#e7ca91', fontSize: 10, fontWeight: '900', marginTop: 3 },
  scroll: { maxHeight: 465, marginTop: 8 },
  scrollContent: { paddingBottom: 10 },
  step: { color: '#d7bb84', fontSize: 9, fontWeight: '900', letterSpacing: 0.6, marginTop: 13 },
  meta: { color: '#8b9097', fontSize: 9, lineHeight: 13, marginTop: 6 },
  primary: { minHeight: 44, borderRadius: 13, backgroundColor: '#d7bb84', alignItems: 'center', justifyContent: 'center', marginTop: 7 },
  primaryText: { color: '#17130d', fontSize: 10, fontWeight: '900', textAlign: 'center' },
  secondary: { minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: '#4b525b', alignItems: 'center', justifyContent: 'center', marginTop: 7 },
  secondaryText: { color: '#dfc99c', fontSize: 10, fontWeight: '900', textAlign: 'center' },
  disabled: { opacity: 0.4 },
  input: { minHeight: 110, borderRadius: 13, borderWidth: 1, borderColor: '#414851', backgroundColor: '#181c21', color: '#efe8dc', fontSize: 9, padding: 10, marginTop: 7, textAlignVertical: 'top' },
  matrixCard: { borderRadius: 14, borderWidth: 1, borderColor: '#4a4033', backgroundColor: '#191510', padding: 10, marginTop: 13 },
  matrixTitle: { color: '#e3c78c', fontSize: 9, fontWeight: '900' },
  matrixText: { color: '#8e939a', fontSize: 8.5, lineHeight: 12, marginTop: 3 },
  status: { color: '#a3a8af', fontSize: 9, lineHeight: 13, marginTop: 9 }
});
