import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import type { ViroHostCloudAnchorResult } from '@reactvision/react-viro';

import type { CalibrationProfile } from '../../spatial/calibration';
import type { RomanovFieldSession } from '../../spatial/fieldVerification';
import {
  createPersistentAnchorRecord,
  getPersistentAnchorReadiness,
  parsePersistentAnchorPackage,
  serializePersistentAnchorPackage,
  type RomanovPersistentAnchor
} from '../../spatial/persistentAnchor';
import {
  modelWorldToAnchorFrame,
  type RomanovAnchorPose
} from '../../spatial/persistentAnchorFrame';
import { getPersistentAnchorRuntimeConfig } from '../../spatial/persistentAnchorRuntime';
import {
  canVerifyCalibration,
  verifyCalibration
} from '../../spatial/romanovReleaseGate';
import {
  createEmptyRomanovSurveyPacket,
  type RomanovSurveyPacket
} from '../../spatial/romanovSurvey';

const CALIBRATION_KEY = 'moscow:p0:romanov-calibration:v1';
const SURVEY_KEY = 'moscow:p0:romanov-survey-packet:v1';
const FIELD_KEY = 'moscow:p0:romanov-field-sessions:v1';
const ANCHOR_KEY = 'moscow:p0:romanov-persistent-anchors:v1';
const DEVICE_LABEL_KEY = 'moscow:p0:romanov-device-label:v1';

type LocalAnchorForPersistent = RomanovAnchorPose & {
  anchorId: string;
};

type Props = {
  calibration: CalibrationProfile;
  localAnchor: LocalAnchorForPersistent | null;
  activeAnchor: RomanovPersistentAnchor | null;
  onCalibrationChange: (calibration: CalibrationProfile) => void;
  onActiveAnchorChange: (anchor: RomanovPersistentAnchor) => Promise<void> | void;
  onHostCloudAnchor: (anchorId: string, ttlDays: number) => Promise<ViroHostCloudAnchorResult>;
  onClose: () => void;
};

export default function RomanovPersistentAnchorPanel({
  calibration,
  localAnchor,
  activeAnchor,
  onCalibrationChange,
  onActiveAnchorChange,
  onHostCloudAnchor,
  onClose
}: Props) {
  const runtime = useMemo(() => getPersistentAnchorRuntimeConfig(), []);
  const [survey, setSurvey] = useState<RomanovSurveyPacket>(() => createEmptyRomanovSurveyPacket());
  const [sessions, setSessions] = useState<RomanovFieldSession[]>([]);
  const [anchors, setAnchors] = useState<RomanovPersistentAnchor[]>([]);
  const [deviceLabel, setDeviceLabel] = useState('');
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState('Загружаем field evidence…');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [rawSurvey, rawSessions, rawAnchors, rawDeviceLabel] = await Promise.all([
      AsyncStorage.getItem(SURVEY_KEY),
      AsyncStorage.getItem(FIELD_KEY),
      AsyncStorage.getItem(ANCHOR_KEY),
      AsyncStorage.getItem(DEVICE_LABEL_KEY)
    ]);
    setSurvey(rawSurvey ? JSON.parse(rawSurvey) as RomanovSurveyPacket : createEmptyRomanovSurveyPacket());
    setSessions(rawSessions ? JSON.parse(rawSessions) as RomanovFieldSession[] : []);
    setAnchors(rawAnchors ? JSON.parse(rawAnchors) as RomanovPersistentAnchor[] : []);
    setDeviceLabel(rawDeviceLabel ?? '');
    setStatus('Evidence загружены. Provider и release prerequisites проверяются локально.');
  };

  useEffect(() => {
    load().catch((error) => setStatus(error instanceof Error ? error.message : 'Не удалось загрузить evidence.'));
  }, []);

  const canPromoteCalibration = canVerifyCalibration({ calibration, survey, sessions });
  const readiness = getPersistentAnchorReadiness({
    sessions,
    calibration,
    provider: runtime.provider,
    providerConfigured: runtime.configured
  });

  const saveAnchors = async (next: RomanovPersistentAnchor[]) => {
    setAnchors(next);
    await AsyncStorage.setItem(ANCHOR_KEY, JSON.stringify(next));
  };

  const saveDeviceLabel = async (value: string) => {
    setDeviceLabel(value);
    await AsyncStorage.setItem(DEVICE_LABEL_KEY, value.trim());
  };

  const promoteCalibration = async () => {
    setBusy(true);
    try {
      const verified = verifyCalibration({ calibration, survey, sessions });
      await AsyncStorage.setItem(CALIBRATION_KEY, JSON.stringify(verified));
      onCalibrationChange(verified);
      setStatus('Calibration verification зафиксирована measured survey + cross-device field matrix.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Calibration verification не выполнена.');
    } finally {
      setBusy(false);
    }
  };

  const host = async () => {
    if (!localAnchor) {
      setStatus('Сначала создайте локальный session anchor на фасаде.');
      return;
    }
    if (!deviceLabel.trim()) {
      setStatus('Укажите физическое устройство. Самопроверка на том же device запрещена.');
      return;
    }
    if (runtime.provider === 'none' || !runtime.configured) {
      setStatus('Native build собран с provider=none. Нужен отдельный field build с ReactVision или ARCore credentials.');
      return;
    }
    const refreshedReadiness = getPersistentAnchorReadiness({
      sessions,
      calibration,
      provider: runtime.provider,
      providerConfigured: runtime.configured
    });
    if (!refreshedReadiness.readyToHost) {
      setStatus(`Host blocked: ${refreshedReadiness.blockers.join(', ')}`);
      return;
    }

    setBusy(true);
    try {
      setStatus(`Hosting ${runtime.provider} cloud anchor…`);
      const result = await onHostCloudAnchor(localAnchor.anchorId, runtime.ttlDays);
      if (!result.success || !result.cloudAnchorId) {
        throw new Error(result.error || 'Cloud provider did not return cloudAnchorId');
      }

      const record = createPersistentAnchorRecord({
        provider: runtime.provider,
        providerAnchorId: result.cloudAnchorId,
        calibration,
        hostAnchorPose: {
          position: localAnchor.position,
          rotationEulerDeg: localAnchor.rotationEulerDeg
        },
        anchorFrameModelTransform: modelWorldToAnchorFrame(calibration, localAnchor),
        hostedByDeviceLabel: deviceLabel.trim(),
        notes: `providerState=${String(result.state)}; ttlDays=${runtime.ttlDays}`
      });
      const next = [...anchors.filter((item) => item.id !== record.id), record];
      await saveAnchors(next);
      await onActiveAnchorChange(record);
      setStatus('Cloud anchor hosted. Ждём localization в anchor frame и host continuity check.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Cloud anchor host failed.');
    } finally {
      setBusy(false);
    }
  };

  const exportProof = async () => {
    if (!activeAnchor) {
      setStatus('Нет активного anchor proof для экспорта.');
      return;
    }
    try {
      const payload = serializePersistentAnchorPackage(activeAnchor);
      await Share.share({
        title: 'Romanov persistent anchor proof',
        message: payload
      });
      setStatus('Proof package подготовлен. На втором устройстве импортируйте весь JSON.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Не удалось экспортировать anchor proof.');
    }
  };

  const importProof = async () => {
    setBusy(true);
    try {
      const anchor = parsePersistentAnchorPackage(importText.trim());
      if (runtime.provider === 'none') {
        throw new Error('Этот build имеет provider=none и не может resolve cloud anchor.');
      }
      if (anchor.provider !== runtime.provider) {
        throw new Error(`Proof provider=${anchor.provider}, а native build provider=${runtime.provider}.`);
      }
      const next = [...anchors.filter((item) => item.id !== anchor.id), anchor];
      await saveAnchors(next);
      await onActiveAnchorChange(anchor);
      setImportText('');
      setStatus('Proof импортирован. AR scene теперь выполняет реальную localization этого cloud anchor.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Некорректный anchor proof package.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>P0 · PERSISTENT ANCHOR AUTHORITY</Text>
            <Text style={styles.title}>Межустройственная привязка</Text>
          </View>
          <Pressable style={styles.close} onPress={onClose}><Text style={styles.closeText}>×</Text></Pressable>
        </View>

        <Text style={styles.body}>
          World XYZ первого телефона не переносятся на другой. Модель сохраняется в cloud-anchor location frame, а verified требует успешного resolve на другом физическом устройстве.
        </Text>

        <View style={styles.providerCard}>
          <Text style={styles.cardLabel}>NATIVE PROVIDER</Text>
          <Text style={styles.cardValue}>{runtime.provider.toUpperCase()} · TTL {runtime.ttlDays} дн.</Text>
          <Text style={styles.cardMeta}>{runtime.configured ? 'provider включён в native build' : 'provider выключен · обычная сборка остаётся fail-closed'}</Text>
        </View>

        <Text style={styles.fieldLabel}>ФИЗИЧЕСКОЕ УСТРОЙСТВО</Text>
        <TextInput
          value={deviceLabel}
          onChangeText={(value) => { void saveDeviceLabel(value); }}
          placeholder="например iPhone 16 Pro #1"
          placeholderTextColor="#6f747d"
          style={styles.input}
        />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.step}>
            <Text style={styles.stepIndex}>01</Text>
            <View style={styles.stepCopy}>
              <Text style={styles.stepTitle}>Measured calibration authority</Text>
              <Text style={styles.stepMeta}>
                survey: {canPromoteCalibration ? 'PASS' : 'BLOCKED'} · calibration: {calibration.verifiedAt ? 'VERIFIED' : 'not verified'}
              </Text>
            </View>
          </View>
          {!calibration.verifiedAt && (
            <Pressable disabled={!canPromoteCalibration || busy} style={[styles.primary, (!canPromoteCalibration || busy) && styles.disabled]} onPress={promoteCalibration}>
              <Text style={styles.primaryText}>Зафиксировать verified calibration</Text>
            </Pressable>
          )}

          <View style={styles.step}>
            <Text style={styles.stepIndex}>02</Text>
            <View style={styles.stepCopy}>
              <Text style={styles.stepTitle}>Cloud host</Text>
              <Text style={styles.stepMeta}>
                local anchor: {localAnchor ? 'готов' : 'нет'} · field devices iOS {readiness.fieldMatrix.iosCompleteDevices}/2 · Android {readiness.fieldMatrix.androidCompleteDevices}/2
              </Text>
            </View>
          </View>
          <Pressable disabled={!readiness.readyToHost || !localAnchor || busy} style={[styles.primary, (!readiness.readyToHost || !localAnchor || busy) && styles.disabled]} onPress={host}>
            <Text style={styles.primaryText}>Host persistent anchor</Text>
          </Pressable>
          {readiness.blockers.length > 0 && <Text style={styles.blocker}>{readiness.blockers.join(' · ')}</Text>}

          <View style={styles.step}>
            <Text style={styles.stepIndex}>03</Text>
            <View style={styles.stepCopy}>
              <Text style={styles.stepTitle}>Host continuity</Text>
              <Text style={styles.stepMeta}>
                {activeAnchor?.hostContinuityPassed
                  ? `PASS · ${activeAnchor.hostContinuityResidualCm?.toFixed(1)} см`
                  : activeAnchor ? 'Ждём localization активного anchor' : 'Сначала host'}
              </Text>
            </View>
          </View>

          <Pressable disabled={!activeAnchor || busy} style={[styles.secondary, (!activeAnchor || busy) && styles.disabled]} onPress={exportProof}>
            <Text style={styles.secondaryText}>Экспортировать proof на устройство №2</Text>
          </Pressable>

          <View style={styles.step}>
            <Text style={styles.stepIndex}>04</Text>
            <View style={styles.stepCopy}>
              <Text style={styles.stepTitle}>Independent resolve</Text>
              <Text style={styles.stepMeta}>
                {activeAnchor?.state === 'verified'
                  ? `VERIFIED · ${activeAnchor.verifiedByDeviceLabel}`
                  : activeAnchor?.resolvedByDeviceLabel
                    ? `resolved: ${activeAnchor.resolvedByDeviceLabel}`
                    : 'Импортируйте proof на другом физическом устройстве'}
              </Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>ИМПОРТ PROOF JSON</Text>
          <TextInput
            value={importText}
            onChangeText={setImportText}
            multiline
            placeholder="Вставьте полный romanov-persistent-anchor-proof JSON"
            placeholderTextColor="#666c74"
            style={[styles.input, styles.importInput]}
          />
          <Pressable disabled={!importText.trim() || busy} style={[styles.secondary, (!importText.trim() || busy) && styles.disabled]} onPress={importProof}>
            <Text style={styles.secondaryText}>Импортировать и resolve</Text>
          </Pressable>
        </ScrollView>

        <Text style={styles.status}>{busy ? 'Операция выполняется… ' : ''}{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 90, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '94%', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: '#454b53', backgroundColor: '#111419', padding: 18, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headerCopy: { flex: 1 },
  kicker: { color: '#b99b69', fontSize: 8, letterSpacing: 1.4, fontWeight: '900' },
  title: { color: '#fff8ea', fontSize: 22, fontWeight: '900', marginTop: 4 },
  close: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#484e56', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#eee', fontSize: 23 },
  body: { color: '#aeb1b8', fontSize: 10.5, lineHeight: 16, marginTop: 9 },
  providerCard: { borderRadius: 15, borderWidth: 1, borderColor: '#4a4033', backgroundColor: '#191510', padding: 11, marginTop: 12 },
  cardLabel: { color: '#a7895b', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  cardValue: { color: '#ead09b', fontSize: 12, fontWeight: '900', marginTop: 3 },
  cardMeta: { color: '#858a91', fontSize: 8.5, lineHeight: 12, marginTop: 3 },
  fieldLabel: { color: '#7f848d', fontSize: 8, letterSpacing: 1.2, fontWeight: '900', marginTop: 12, marginBottom: 5 },
  input: { minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: '#42474f', backgroundColor: '#191d22', color: '#fff4df', fontSize: 11, paddingHorizontal: 11, paddingVertical: 9 },
  importInput: { minHeight: 94, textAlignVertical: 'top' },
  scroll: { maxHeight: 470, marginTop: 8 },
  scrollContent: { paddingBottom: 8 },
  step: { flexDirection: 'row', gap: 10, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#31363d', paddingTop: 11, marginTop: 10 },
  stepIndex: { color: '#d7bb84', fontSize: 10, fontWeight: '900', width: 24 },
  stepCopy: { flex: 1 },
  stepTitle: { color: '#ece8df', fontSize: 12, fontWeight: '900' },
  stepMeta: { color: '#838990', fontSize: 8.5, lineHeight: 12, marginTop: 3 },
  primary: { minHeight: 44, borderRadius: 13, backgroundColor: '#d7bb84', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryText: { color: '#17130d', fontSize: 10, fontWeight: '900' },
  secondary: { minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: '#4c535c', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  secondaryText: { color: '#ddc99f', fontSize: 10, fontWeight: '900' },
  disabled: { opacity: 0.4 },
  blocker: { color: '#c58d81', fontSize: 8.5, lineHeight: 12, marginTop: 5 },
  status: { color: '#9da2a9', fontSize: 9, lineHeight: 13, marginTop: 10 }
});
