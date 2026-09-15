import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MoscowSpatialNavigatorFallback() {
  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>SPATIAL MODE</Text>
      <Text style={styles.title}>AR / VR запускается в нативной сборке</Text>
      <Text style={styles.body}>Браузерный preview показывает интерфейс и сценарий. На iOS/Android этот экран заменяется ViroReact runtime с ARKit/ARCore; на Quest — VR runtime.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070809', alignItems: 'center', justifyContent: 'center', padding: 28 },
  kicker: { color: '#c5a56d', fontSize: 11, letterSpacing: 1.8, fontWeight: '900' },
  title: { color: '#fff8ea', fontSize: 27, lineHeight: 33, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  body: { color: '#a8abb1', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 12, maxWidth: 480 }
});
