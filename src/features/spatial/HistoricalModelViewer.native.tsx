import React, { useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import {
  Viro3DObject,
  Viro3DSceneNavigator,
  ViroAmbientLight,
  ViroDirectionalLight,
  ViroNode,
  ViroOrbitCamera,
  ViroPinchStateTypes,
  ViroRotateStateTypes,
  ViroScene,
  ViroText,
  isQuest
} from '@reactvision/react-viro';
import type { RomanovEra } from '../../spatial/romanov-hotspots';
import { getRomanovModelSource, type RomanovTrustMode } from '../../spatial/romanovModelPack.native';
import PhysicalPressable from '../../ui/PhysicalPressable';

type Props = {
  onClose: () => void;
  onBackToArchive: () => void;
  onOpenSpatial: () => void;
  initialEra?: RomanovEra;
  initialTrustMode?: RomanovTrustMode;
  onStateChange?: (state: { era: RomanovEra; trustMode: RomanovTrustMode }) => void;
};

type SceneProps = {
  sceneNavigator?: {
    viroAppProps?: {
      era?: RomanovEra;
      trustMode?: RomanovTrustMode;
    };
  };
};

const eraLabels: Record<RomanovEra, { year: string; title: string }> = {
  '1857': { year: '1857', title: 'До реставрации' },
  '1859': { year: '1859 / 1883', title: 'После реставрации Рихтера' }
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function RomanovInspectionScene({ sceneNavigator }: SceneProps) {
  const era = sceneNavigator?.viroAppProps?.era ?? '1859';
  const trustMode = sceneNavigator?.viroAppProps?.trustMode ?? 'public';
  const [yaw, setYaw] = useState(-12);
  const [scale, setScale] = useState(0.78);
  const rotateBase = useRef(yaw);
  const pinchBase = useRef(scale);

  const onRotate = (state: number, factor: number) => {
    if (state === ViroRotateStateTypes.ROTATE_START) rotateBase.current = yaw;
    setYaw(rotateBase.current + factor);
  };

  const onPinch = (state: number, factor: number) => {
    if (state === ViroPinchStateTypes.PINCH_START) pinchBase.current = scale;
    setScale(clamp(pinchBase.current * factor, 0.42, 1.55));
  };

  return (
    <ViroScene>
      <ViroAmbientLight color="#fff3db" intensity={520} />
      <ViroDirectionalLight color="#fff2d3" direction={[-0.4, -1, -0.2]} intensity={650} castsShadow />
      <ViroDirectionalLight color="#9eb8d4" direction={[0.7, -0.2, 0.8]} intensity={240} />
      <ViroOrbitCamera active position={[0, 8.5, 34]} focalPoint={[0, 6.2, 0]} fieldOfView={48} />

      <ViroNode position={[0, -4.4, 0]} rotation={[0, yaw, 0]} scale={[scale, scale, scale]}>
        <Viro3DObject
          key={`${era}-${trustMode}`}
          source={getRomanovModelSource(era, trustMode)}
          type="GLB"
          onRotate={onRotate}
          onPinch={onPinch}
        />
      </ViroNode>

      <ViroText
        text={`${eraLabels[era].year} · ${trustMode === 'documented' ? 'DOCUMENTED' : 'PUBLIC RESEARCH'}`}
        position={[0, 14.5, -1]}
        scale={[0.28, 0.28, 0.28]}
        style={{ fontSize: 17, color: '#f0d39b', textAlign: 'center' }}
      />
    </ViroScene>
  );
}

const RomanovInspectionSceneFactory = RomanovInspectionScene as unknown as () => React.JSX.Element;

export default function HistoricalModelViewer({
  onClose,
  onBackToArchive,
  onOpenSpatial,
  initialEra = '1859',
  initialTrustMode = 'public',
  onStateChange
}: Props) {
  const [era, setEra] = useState<RomanovEra>(initialEra);
  const [trustMode, setTrustMode] = useState<RomanovTrustMode>(initialTrustMode);

  const selectEra = (next: RomanovEra) => {
    setEra(next);
    onStateChange?.({ era: next, trustMode });
  };

  const selectTrust = (next: RomanovTrustMode) => {
    setTrustMode(next);
    onStateChange?.({ era, trustMode: next });
  };

  return (
    <View style={styles.root}>
      <Viro3DSceneNavigator
        initialScene={{ scene: RomanovInspectionSceneFactory as never }}
        viroAppProps={{ era, trustMode }}
        debug={false}
        onExitViro={onClose}
        hdrEnabled
        pbrEnabled
        bloomEnabled
        shadowsEnabled
        multisamplingEnabled
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>3D MODEL · ONE ASSET PIPELINE</Text>
            <Text style={styles.title}>Палаты бояр Романовых</Text>
            <Text style={styles.subtitle}>Текущая эпоха и режим доверия сохраняются при переходе в AR/VR и обратно.</Text>
          </View>
          <PhysicalPressable style={styles.close} contentStyle={styles.center} onPress={onClose} accessibilityLabel="3D · Закрыть просмотр">
            <Text style={styles.closeText}>×</Text>
          </PhysicalPressable>
        </View>

        <View style={styles.controls}>
          <Text style={styles.controlLabel}>ЭПОХА</Text>
          <View style={styles.row}>
            {(['1857', '1859'] as RomanovEra[]).map((item) => (
              <PhysicalPressable
                key={item}
                style={[styles.choice, era === item && styles.choiceActive]}
                contentStyle={styles.choiceContent}
                hapticEvent="epoch-snap"
                accessibilityLabel={`3D · Эпоха · ${eraLabels[item].year} · ${eraLabels[item].title}`}
                onPress={() => selectEra(item)}
              >
                <Text style={[styles.choiceYear, era === item && styles.choiceYearActive]}>{eraLabels[item].year}</Text>
                <Text style={styles.choiceSub}>{eraLabels[item].title}</Text>
              </PhysicalPressable>
            ))}
          </View>

          <Text style={styles.controlLabel}>ДОСТОВЕРНОСТЬ</Text>
          <View style={styles.row}>
            <PhysicalPressable
              style={[styles.trust, trustMode === 'documented' && styles.trustActive]}
              contentStyle={styles.center}
              accessibilityLabel="3D · Только факты"
              onPress={() => selectTrust('documented')}
            >
              <Text style={[styles.trustText, trustMode === 'documented' && styles.trustTextActive]}>Только факты</Text>
            </PhysicalPressable>
            <PhysicalPressable
              style={[styles.trust, trustMode === 'public' && styles.trustActive]}
              contentStyle={styles.center}
              accessibilityLabel="3D · Реконструкция"
              onPress={() => selectTrust('public')}
            >
              <Text style={[styles.trustText, trustMode === 'public' && styles.trustTextActive]}>+ реконструкция</Text>
            </PhysicalPressable>
          </View>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.gesture}>Прямое управление: rotate · pinch · переходы прерываемы</Text>
          <Text style={styles.modeNote}>{isQuest ? 'Quest обнаружен: следующий режим продолжит эту же эпоху в VR.' : 'Телефон: следующий режим продолжит эту же эпоху в AR.'}</Text>
          <View style={styles.actions}>
            <PhysicalPressable style={styles.secondary} contentStyle={styles.center} accessibilityLabel="3D · Назад в архив" onPress={onBackToArchive}>
              <Text style={styles.secondaryText}>← Архив</Text>
            </PhysicalPressable>
            <PhysicalPressable
              style={styles.primary}
              contentStyle={styles.center}
              strong
              hapticEvent="spatial-enter"
              accessibilityLabel={isQuest ? '3D · Открыть VR на Quest' : '3D · Открыть AR на месте'}
              onPress={onOpenSpatial}
            >
              <Text style={styles.primaryText}>{isQuest ? 'Открыть VR на Quest' : 'Открыть AR на месте'}</Text>
            </PhysicalPressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07090c' },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, padding: 14 },
  headerCopy: { flex: 1, borderRadius: 18, backgroundColor: 'rgba(8,10,13,0.88)', borderWidth: 1, borderColor: '#323740', padding: 13 },
  kicker: { color: '#b99b69', fontSize: 8, letterSpacing: 1.3, fontWeight: '900' },
  title: { color: '#fff8ea', fontSize: 19, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#969ba4', fontSize: 9.5, lineHeight: 14, marginTop: 4 },
  close: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(8,10,13,0.9)', borderWidth: 1, borderColor: '#3d4249' },
  closeText: { color: '#fff8ea', fontSize: 25, lineHeight: 27 },
  controls: { position: 'absolute', top: 126, left: 14, right: 14, borderRadius: 18, backgroundColor: 'rgba(8,10,13,0.86)', borderWidth: 1, borderColor: '#30343a', padding: 11 },
  controlLabel: { color: '#767b84', fontSize: 7.5, letterSpacing: 1.2, fontWeight: '900', marginBottom: 5 },
  row: { flexDirection: 'row', gap: 7, marginBottom: 8 },
  choice: { flex: 1, minHeight: 44, borderRadius: 11, borderWidth: 1, borderColor: '#3b4047' },
  choiceContent: { justifyContent: 'center', paddingHorizontal: 10 },
  choiceActive: { borderColor: '#c5a56d', backgroundColor: '#211b13' },
  choiceYear: { color: '#cacdd2', fontSize: 10.5, fontWeight: '900' },
  choiceYearActive: { color: '#f0d39b' },
  choiceSub: { color: '#777c84', fontSize: 7.5, marginTop: 2 },
  trust: { flex: 1, minHeight: 44, borderRadius: 11, borderWidth: 1, borderColor: '#3b4047' },
  trustActive: { borderColor: '#8f7854', backgroundColor: '#211b13' },
  trustText: { color: '#989da5', fontSize: 9, fontWeight: '900' },
  trustTextActive: { color: '#e8c98c' },
  bottom: { position: 'absolute', left: 14, right: 14, bottom: 18, borderRadius: 20, backgroundColor: 'rgba(8,10,13,0.92)', borderWidth: 1, borderColor: '#363b43', padding: 13 },
  gesture: { color: '#e2d2b4', fontSize: 10, fontWeight: '800' },
  modeNote: { color: '#838891', fontSize: 9, lineHeight: 13, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  secondary: { flex: 1, minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: '#494e55' },
  secondaryText: { color: '#c8b995', fontSize: 9.5, fontWeight: '900' },
  primary: { flex: 1.35, minHeight: 44, borderRadius: 13, backgroundColor: '#d7bb84' },
  primaryText: { color: '#17130d', fontSize: 10, fontWeight: '900' }
});
