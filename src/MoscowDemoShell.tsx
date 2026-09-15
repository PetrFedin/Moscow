import { useCameraPermissions } from 'expo-camera';
import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import MoscowApp from './MoscowApp';
import { places } from './data/places';
import ArchiveTimeLens from './features/spatial/ArchiveTimeLens';
import MoscowSpatialNavigator from './features/spatial/MoscowSpatialNavigator';
import { detectLanguage } from './i18n';

type DemoStage = null | 'lens' | 'spatial';

export default function MoscowDemoShell() {
  const [stage, setStage] = useState<DemoStage>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const language = detectLanguage();
  const romanov = useMemo(() => places.find((place) => place.id === 'romanov-chambers'), []);
  const demoEnabled = __DEV__ || Platform.OS === 'web' || process.env.EXPO_PUBLIC_DEMO_MODE === '1';

  const openDemo = async () => {
    if (!romanov) return;
    if (Platform.OS !== 'web' && !cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) return;
    }
    setStage('lens');
  };

  return (
    <View style={styles.root}>
      <MoscowApp />

      {demoEnabled && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Открыть демонстрационный сценарий Палат Романовых"
          style={styles.demoButton}
          onPress={openDemo}
        >
          <Text style={styles.demoStar}>✦</Text>
          <View>
            <Text style={styles.demoKicker}>WOW</Text>
            <Text style={styles.demoText}>DEMO</Text>
          </View>
        </Pressable>
      )}

      <Modal visible={stage === 'lens'} animationType="slide" onRequestClose={() => setStage(null)}>
        <View style={styles.modalRoot}>
          {romanov && (
            <ArchiveTimeLens
              place={romanov}
              language={language}
              onClose={() => setStage(null)}
              onOpenSpatial={() => setStage('spatial')}
            />
          )}
        </View>
      </Modal>

      <Modal visible={stage === 'spatial'} animationType="fade" onRequestClose={() => setStage(null)}>
        <View style={styles.modalRoot}>
          <MoscowSpatialNavigator />
          <SafeAreaView pointerEvents="box-none" style={styles.closeLayer}>
            <Pressable style={styles.close} onPress={() => setStage(null)} accessibilityLabel="Закрыть demo">
              <Text style={styles.closeText}>×</Text>
            </Pressable>
            <Pressable style={styles.backToArchive} onPress={() => setStage('lens')}>
              <Text style={styles.backText}>← архив 1857</Text>
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8
  },
  demoStar: { color: '#17130d', fontSize: 20, fontWeight: '900' },
  demoKicker: { color: '#69552f', fontSize: 7, letterSpacing: 1.1, fontWeight: '900' },
  demoText: { color: '#17130d', fontSize: 11, fontWeight: '900', marginTop: 1 },
  modalRoot: { flex: 1, backgroundColor: '#050607' },
  closeLayer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, padding: 16 },
  close: { position: 'absolute', top: 16, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(8,10,12,0.86)', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#fff8ea', fontSize: 27, lineHeight: 29 },
  backToArchive: { position: 'absolute', left: 16, bottom: 24, minHeight: 42, borderRadius: 14, backgroundColor: 'rgba(8,10,12,0.88)', borderWidth: 1, borderColor: '#5b5140', paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#e5c78d', fontSize: 10, fontWeight: '900' }
});
