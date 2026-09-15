import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Viro3DObject,
  ViroAmbientLight,
  ViroARScene,
  ViroNode,
  ViroScene,
  ViroText,
  ViroXRSceneNavigator,
  isQuest
} from '@reactvision/react-viro';
import { defaultRomanovCalibration } from '../../spatial/calibration';

const modelUrl = process.env.EXPO_PUBLIC_ROMANOV_GLB_URL;

function RomanovSpatialScene() {
  const calibration = defaultRomanovCalibration;
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
    </>
  );

  return isQuest ? <ViroScene>{content}</ViroScene> : <ViroARScene>{content}</ViroARScene>;
}

export default function MoscowSpatialNavigator() {
  return (
    <View style={styles.root}>
      <ViroXRSceneNavigator
        initialScene={{ scene: RomanovSpatialScene }}
        pbrEnabled
        hdrEnabled
        shadowsEnabled
        multisamplingEnabled
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: '#000000' } });
