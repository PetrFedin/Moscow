import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  isQuest
} from '@reactvision/react-viro';
import {
  defaultRomanovCalibration,
  isCalibrationProfile,
  type CalibrationProfile
} from '../../spatial/calibration';

const CALIBRATION_STORAGE_KEY = 'moscow:p0:romanov-calibration:v1';
const modelUrl = process.env.EXPO_PUBLIC_ROMANOV_GLB_URL;
const calibrationEnabled = __DEV__ || process.env.EXPO_PUBLIC_ENABLE_CALIBRATION === '1';

type SceneProps = {
  sceneNavigator?: {
    viroAppProps?: {
      calibration?: CalibrationProfile;
    };
  };
};

function RomanovPortal() {
  return (
    <ViroPortalScene passable position={[2.5, 0, -4]}>
      <ViroPortal position={[0, 0, 0]}>
        <Viro3DObject
          source={require('../../../assets/models/romanov-portal-frame.obj')}
          resources={[require('../../../assets/models/romanov-portal-frame.mtl')]}
          type="OBJ"
        />
      </ViroPortal>
      <ViroAmbientLight color="#d7c6a2" intensity={520} />
      <ViroText
        text="ПОРТАЛ · ИСТОРИЧЕСКАЯ СЦЕНА"
        position={[0, 0.3, -3]}
        scale={[0.24, 0.24, 0.24]}
        style={{ fontSize: 18, color: '#f0d39b', textAlign: 'center' }}
      />
      <ViroText
        text="Production-интерьер появится после исторической реконструкции"
        position={[0, -0.15, -3]}
        scale={[0.13, 0.13, 0.13]}
        style={{ fontSize: 15, color: '#d5d0c6', textAlign: 'center' }}
      />
    </ViroPortalScene>
  );
}

function RomanovSpatialScene({ sceneNavigator }: SceneProps) {
  const calibration = sceneNavigator?.viroAppProps?.calibration ?? defaultRomanovCalibration;
  const content = (
    <>
      <ViroAmbientLight color="#ffffff" intensity={650} />
      {modelUrl ? (
        <ViroNode
          position={calibration.translation}
          rotation={calibration.rotationEulerDeg}
          scale={[calibration.scale, calibration.scale, calibration.scale]}
        >
          <Viro3DObject source={{ uri: modelUrl }} type="GLB" />
          <ViroText
            text={isQuest ? 'Палаты Романовых · VR' : 'Палаты Романовых · AR'}
            position={[0, 2.8, 0]}
            scale={[0.22, 0.22, 0.22]}
            style={{ fontSize: 18, color: '#f0d39b', textAlign: 'center' }}
          />
        </ViroNode>
      ) : (
        <ViroText
          text="ROMANOV GLB · ОЖИДАЕТ МОДЕЛЬ"
          position={[0, 0, -2.2]}
          scale={[0.25, 0.25, 0.25]}
          style={{ fontSize: 18, color: '#f0d39b', textAlign: 'center' }}
        />
      )}
      <RomanovPortal />
    </>
  );

  return isQuest ? <ViroScene>{content}</ViroScene> : <ViroARScene>{content}</ViroARScene>;
}

type CalibrationSliderProps = {
  label: string;
  value: number;
  minimumValue: number;
  maximumValue: number;
  step: number;
  onValueChange: (value: number) => void;
};

function CalibrationSlider({ label, value, minimumValue, maximumValue, step, onValueChange }: CalibrationSliderProps) {
  return (
    <View style={styles.controlRow}>
      <View style={styles.controlLabelRow}>
        <Text style={styles.controlLabel}>{label}</Text>
        <Text style={styles.controlValue}>{value.toFixed(step < 1 ? 2 : 0)}</Text>
      </View>
      <Slider
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor="#d7bb84"
        maximumTrackTintColor="#4b4f55"
        thumbTintColor="#f0d39b"
      />
    </View>
  );
}

export default function MoscowSpatialNavigator() {
  const [calibration, setCalibration] = useState<CalibrationProfile>(defaultRomanovCalibration);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    AsyncStorage.getItem(CALIBRATION_STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (isCalibrationProfile(parsed)) setCalibration(parsed);
      })
      .catch(() => undefined);
  }, []);

  const setTranslation = (axis: 0 | 1 | 2, value: number) => {
    setCalibration((current) => {
      const translation: [number, number, number] = [...current.translation];
      translation[axis] = value;
      return { ...current, translation };
    });
    setSaveState('idle');
  };

  const setYaw = (value: number) => {
    setCalibration((current) => ({
      ...current,
      rotationEulerDeg: [current.rotationEulerDeg[0], value, current.rotationEulerDeg[2]]
    }));
    setSaveState('idle');
  };

  const saveCalibration = async () => {
    try {
      await AsyncStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(calibration));
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  const resetCalibration = async () => {
    setCalibration(defaultRomanovCalibration);
    setSaveState('idle');
    await AsyncStorage.removeItem(CALIBRATION_STORAGE_KEY).catch(() => undefined);
  };

  return (
    <View style={styles.root}>
      <ViroXRSceneNavigator
        initialScene={{ scene: RomanovSpatialScene }}
        viroAppProps={{ calibration }}
        pbrEnabled
        hdrEnabled
        shadowsEnabled
        multisamplingEnabled
        style={StyleSheet.absoluteFill}
      />

      {calibrationEnabled && !isQuest && (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <Pressable style={styles.calibrationToggle} onPress={() => setPanelOpen((current) => !current)}>
            <Text style={styles.calibrationToggleText}>{panelOpen ? 'Закрыть калибровку' : 'Калибровка AR'}</Text>
          </Pressable>

          {panelOpen && (
            <View style={styles.panel}>
              <Text style={styles.panelKicker}>P0 · MANUAL ALIGNMENT</Text>
              <Text style={styles.panelTitle}>Совместите модель с фасадом</Text>
              <Text style={styles.panelBody}>Настройте позицию, поворот и масштаб по устойчивым архитектурным ориентирам. Профиль сохраняется только на этом устройстве.</Text>

              <CalibrationSlider label="X · вправо / влево" value={calibration.translation[0]} minimumValue={-10} maximumValue={10} step={0.05} onValueChange={(value) => setTranslation(0, value)} />
              <CalibrationSlider label="Y · выше / ниже" value={calibration.translation[1]} minimumValue={-8} maximumValue={8} step={0.05} onValueChange={(value) => setTranslation(1, value)} />
              <CalibrationSlider label="Z · ближе / дальше" value={calibration.translation[2]} minimumValue={-20} maximumValue={-1} step={0.05} onValueChange={(value) => setTranslation(2, value)} />
              <CalibrationSlider label="Yaw · поворот" value={calibration.rotationEulerDeg[1]} minimumValue={-180} maximumValue={180} step={1} onValueChange={setYaw} />
              <CalibrationSlider label="Scale · масштаб" value={calibration.scale} minimumValue={0.25} maximumValue={3} step={0.01} onValueChange={(value) => { setCalibration((current) => ({ ...current, scale: value })); setSaveState('idle'); }} />

              <View style={styles.actionRow}>
                <Pressable style={styles.primaryButton} onPress={saveCalibration}><Text style={styles.primaryButtonText}>Сохранить</Text></Pressable>
                <Pressable style={styles.secondaryButton} onPress={resetCalibration}><Text style={styles.secondaryButtonText}>Сбросить</Text></Pressable>
              </View>
              {saveState === 'saved' && <Text style={styles.savedText}>Профиль сохранён на устройстве</Text>}
              {saveState === 'error' && <Text style={styles.errorText}>Не удалось сохранить профиль</Text>}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  calibrationToggle: {
    position: 'absolute',
    top: 72,
    left: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(12,14,17,0.88)',
    borderWidth: 1,
    borderColor: '#806f52',
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  calibrationToggleText: { color: '#f0d39b', fontSize: 12, fontWeight: '900' },
  panel: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 24,
    borderRadius: 22,
    backgroundColor: 'rgba(15,18,22,0.96)',
    borderWidth: 1,
    borderColor: '#555048',
    padding: 17
  },
  panelKicker: { color: '#b99b69', fontSize: 9, letterSpacing: 1.4, fontWeight: '900' },
  panelTitle: { color: '#fff8ea', fontSize: 20, fontWeight: '900', marginTop: 5 },
  panelBody: { color: '#adb0b6', fontSize: 12, lineHeight: 17, marginTop: 7, marginBottom: 8 },
  controlRow: { marginTop: 8 },
  controlLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  controlLabel: { color: '#d0d1d4', fontSize: 11, fontWeight: '700' },
  controlValue: { color: '#e8c98c', fontSize: 11, fontVariant: ['tabular-nums'] },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  primaryButton: { flex: 1, borderRadius: 14, backgroundColor: '#d7bb84', paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { color: '#17130d', fontSize: 12, fontWeight: '900' },
  secondaryButton: { flex: 1, borderRadius: 14, borderWidth: 1, borderColor: '#4d5158', paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#d7d7d9', fontSize: 12, fontWeight: '800' },
  savedText: { color: '#9ed0a7', fontSize: 10, marginTop: 8 },
  errorText: { color: '#e89b94', fontSize: 10, marginTop: 8 }
});
