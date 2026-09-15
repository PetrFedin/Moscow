import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ViroAmbientLight,
  ViroARScene,
  ViroText,
  ViroXRSceneNavigator,
  isQuest
} from '@reactvision/react-viro';

function SpatialProbeScene() {
  const content = (
    <>
      <ViroAmbientLight color="#ffffff" intensity={650} />
      <ViroText
        text="MOSCOW · SPATIAL RUNTIME"
        position={[0, 0, -2.2]}
        scale={[0.28, 0.28, 0.28]}
        style={{ fontSize: 18, color: '#f0d39b', textAlign: 'center' }}
      />
    </>
  );

  if (isQuest) {
    const { ViroScene } = require('@reactvision/react-viro');
    return <ViroScene>{content}</ViroScene>;
  }

  return <ViroARScene>{content}</ViroARScene>;
}

export default function MoscowSpatialNavigator() {
  return (
    <View style={styles.root}>
      <ViroXRSceneNavigator
        provider="none"
        initialScene={{ scene: SpatialProbeScene }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: '#000000' } });
