import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCameraPermissions } from 'expo-camera';
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Modal, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import MoscowExperienceApp from './MoscowExperienceApp';
import GovernmentPartnershipDemo from './government/GovernmentPartnershipDemo';
import InvestorMvpDemo from './government/InvestorMvpDemo';
import {
  parseGovernmentMeetingEntryUrl,
  type GovernmentMeetingEntryMode
} from './government/governmentMeetingEntry';
import { places } from './data/places';
import ArchiveTimeLens from './features/spatial/ArchiveTimeLens';
import HistoricalModelViewer from './features/spatial/HistoricalModelViewer';
import MoscowSpatialNavigator from './features/spatial/MoscowSpatialNavigator';
import { detectLanguage } from './i18n';
import PhysicalPressable from './ui/PhysicalPressable';

type DemoStage = null | 'lens' | 'model' | 'spatial';
type DemoEra = '1857' | '1859';
type DemoTrust = 'documented' | 'public';
type LocalPreviewMode = 'auto' | 'phone' | 'tablet' | 'desktop';

const LOCAL_PREVIEW_WIDTHS: Record<Exclude<LocalPreviewMode, 'auto'>, number> = {
  phone: 390,
  tablet: 834,
  desktop: 1440
};

const ERA_STORAGE_KEY = 'moscow:p0:romanov-era:v1';
const TRUST_STORAGE_KEY = 'moscow:p0:romanov-trust-mode:v1';

export default function MoscowDemoShell() {
  const [stage, setStage] = useState<DemoStage>(null);
  const [governmentOpen, setGovernmentOpen] = useState(false);
  const [investorOpen, setInvestorOpen] = useState(false);
  const [governmentEntryMode, setGovernmentEntryMode] =
    useState<GovernmentMeetingEntryMode>('overview');
  const [demoEra, setDemoEra] = useState<DemoEra>('1857');
  const [demoTrust, setDemoTrust] = useState<DemoTrust>('public');
  const [localPreviewMode, setLocalPreviewMode] = useState<LocalPreviewMode>('auto');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const language = detectLanguage();
  const romanov = useMemo(() => places.find((place) => place.id === 'romanov-chambers'), []);
  const demoEnabled = __DEV__ || Platform.OS === 'web' || process.env.EXPO_PUBLIC_DEMO_MODE === '1';
  const localDeviceLabEnabled =
    Platform.OS === 'web' &&
    typeof globalThis.location !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(globalThis.location.hostname);
  const forcedViewportWidth =
    localPreviewMode === 'auto' ? undefined : LOCAL_PREVIEW_WIDTHS[localPreviewMode];

  useEffect(() => {
    if (!demoEnabled) return;
    Linking.getInitialURL()
      .then((url) => {
        const mode = parseGovernmentMeetingEntryUrl(url);
        if (!mode) return;
        setGovernmentEntryMode(mode);
        setGovernmentOpen(true);
      })
      .catch(() => undefined);
  }, [demoEnabled]);

  const openDemo = async () => {
    if (!romanov) return;
    if (Platform.OS !== 'web' && !cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) return;
    }
    setStage('lens');
  };

  const openSpatial = async () => {
    await Promise.all([
      AsyncStorage.setItem(ERA_STORAGE_KEY, demoEra),
      AsyncStorage.setItem(TRUST_STORAGE_KEY, demoTrust)
    ]).catch(() => undefined);
    setStage('spatial');
  };

  return (
    <View style={styles.root}>
      <View
        testID="local-preview-frame"
        style={[
          styles.previewHost,
          forcedViewportWidth !== undefined && {
            width: forcedViewportWidth,
            maxWidth: '100%',
            alignSelf: 'center'
          }
        ]}
      >
        <MoscowExperienceApp forcedViewportWidth={forcedViewportWidth} />
      </View>

      {localDeviceLabEnabled && (
        <View testID="local-device-lab" style={styles.deviceLab}>
          <Text style={styles.deviceLabTitle}>LOCAL DEVICE LAB</Text>
          <View style={styles.deviceLabRow}>
            {([
              ['auto', 'AUTO'],
              ['phone', 'PHONE · 390'],
              ['tablet', 'TABLET · 834'],
              ['desktop', 'DESKTOP · 1440']
            ] as const).map(([mode, label]) => (
              <PhysicalPressable
                key={mode}
                style={[styles.deviceLabButton, localPreviewMode === mode && styles.deviceLabButtonActive]}
                contentStyle={styles.centerContent}
                hapticEvent="none"
                onPress={() => setLocalPreviewMode(mode)}
              >
                <Text style={[styles.deviceLabText, localPreviewMode === mode && styles.deviceLabTextActive]}>{label}</Text>
              </PhysicalPressable>
            ))}
          </View>
        </View>
      )}

      {demoEnabled && (
        <>
          <PhysicalPressable
            accessibilityRole="button"
            accessibilityLabel="Открыть investor MVP для Москвы"
            style={styles.cityButton}
            contentStyle={styles.demoButtonContent}
            strong
            onPress={() => setInvestorOpen(true)}
          >
            <Text style={styles.cityMark}>M</Text>
            <View>
              <Text style={styles.cityKicker}>MOSCOW</Text>
              <Text style={styles.cityText}>INVESTOR MVP</Text>
            </View>
          </PhysicalPressable>

          <PhysicalPressable
          accessibilityRole="button"
          accessibilityLabel="Открыть демонстрационный сценарий Палат Романовых"
          style={styles.demoButton}
          contentStyle={styles.demoButtonContent}
          strong
          onPress={openDemo}
        >
          <Text style={styles.demoStar}>✦</Text>
          <View>
            <Text style={styles.demoKicker}>WOW</Text>
            <Text style={styles.demoText}>3D</Text>
          </View>
          </PhysicalPressable>
        </>
      )}

      <Modal visible={investorOpen} animationType="slide" onRequestClose={() => setInvestorOpen(false)}>
        <InvestorMvpDemo onClose={() => setInvestorOpen(false)} />
      </Modal>

      <Modal visible={governmentOpen} animationType="slide" onRequestClose={() => setGovernmentOpen(false)}>
        <GovernmentPartnershipDemo
          key={`government-${governmentEntryMode}-${governmentOpen ? 'open' : 'closed'}`}
          initialMode={governmentEntryMode}
          onClose={() => setGovernmentOpen(false)}
        />
      </Modal>

      <Modal visible={stage === 'lens'} animationType="fade" onRequestClose={() => setStage(null)}>
        <View style={styles.modalRoot}>
          {romanov && (
            <ArchiveTimeLens
              place={romanov}
              language={language}
              onClose={() => setStage(null)}
              onOpenSpatial={() => setStage('model')}
            />
          )}
        </View>
      </Modal>

      <Modal visible={stage === 'model'} animationType="fade" onRequestClose={() => setStage(null)}>
        <View style={styles.modalRoot}>
          <HistoricalModelViewer
            initialEra={demoEra}
            initialTrustMode={demoTrust}
            onStateChange={(state) => { setDemoEra(state.era); setDemoTrust(state.trustMode); }}
            onClose={() => setStage(null)}
            onBackToArchive={() => setStage('lens')}
            onOpenSpatial={openSpatial}
          />
        </View>
      </Modal>

      <Modal visible={stage === 'spatial'} animationType="fade" onRequestClose={() => setStage('model')}>
        <View style={styles.modalRoot}>
          <MoscowSpatialNavigator key={`${demoEra}-${demoTrust}`} language={language} />
          <SafeAreaView pointerEvents="box-none" style={styles.closeLayer}>
            <PhysicalPressable
              style={styles.close}
              contentStyle={styles.centerContent}
              onPress={() => setStage(null)}
              accessibilityLabel="Закрыть demo"
            >
              <Text style={styles.closeText}>×</Text>
            </PhysicalPressable>
            <PhysicalPressable
              style={styles.backToModel}
              contentStyle={styles.centerContent}
              onPress={() => setStage('model')}
            >
              <Text style={styles.backText}>← 3D-модель</Text>
            </PhysicalPressable>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050607' },
  previewHost: { flex: 1, minWidth: 0, overflow: 'hidden', backgroundColor: '#090b0d' },
  deviceLab: {
    position: 'absolute',
    left: 10,
    top: 10,
    zIndex: 100,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3d434a',
    backgroundColor: 'rgba(10,12,15,0.94)',
    padding: 8,
    maxWidth: '94%'
  },
  deviceLabTitle: { color: '#767d84', fontSize: 7, letterSpacing: 1.1, fontWeight: '900', marginBottom: 6 },
  deviceLabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  deviceLabButton: { minHeight: 30, borderRadius: 9, borderWidth: 1, borderColor: '#343a41', paddingHorizontal: 8 },
  deviceLabButtonActive: { borderColor: '#a38758', backgroundColor: '#272016' },
  deviceLabText: { color: '#858d95', fontSize: 7, fontWeight: '900' },
  deviceLabTextActive: { color: '#e3c58b' },
  cityButton: {
    position: 'absolute',
    right: 14,
    bottom: 146,
    minWidth: 104,
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: '#171b20',
    borderWidth: 1,
    borderColor: '#6f5d3d',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7
  },
  cityMark: {
    width: 25,
    height: 25,
    borderRadius: 13,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 25,
    backgroundColor: '#d7bb84',
    color: '#17130d',
    fontSize: 11,
    fontWeight: '900'
  },
  cityKicker: { color: '#8e7a58', fontSize: 7, letterSpacing: 1.1, fontWeight: '900' },
  cityText: { color: '#eee5d6', fontSize: 11, fontWeight: '900', marginTop: 1 },
  demoButton: {
    position: 'absolute',
    right: 14,
    bottom: 88,
    minWidth: 86,
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: '#d7bb84',
    borderWidth: 1,
    borderColor: '#f0d39b',
    shadowColor: '#000',
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8
  },
  demoButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12
  },
  demoStar: { color: '#17130d', fontSize: 20, fontWeight: '900' },
  demoKicker: { color: '#69552f', fontSize: 7, letterSpacing: 1.1, fontWeight: '900' },
  demoText: { color: '#17130d', fontSize: 11, fontWeight: '900', marginTop: 1 },
  modalRoot: { flex: 1, backgroundColor: '#050607' },
  closeLayer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, padding: 16 },
  close: { position: 'absolute', top: 16, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(8,10,12,0.86)' },
  centerContent: { alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#fff8ea', fontSize: 27, lineHeight: 29 },
  backToModel: { position: 'absolute', left: 16, bottom: 24, minHeight: 44, borderRadius: 14, backgroundColor: 'rgba(8,10,12,0.88)', borderWidth: 1, borderColor: '#5b5140', paddingHorizontal: 14 },
  backText: { color: '#e5c78d', fontSize: 10, fontWeight: '900' }
});
