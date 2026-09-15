import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MoscowSpatialNavigatorFallback() {
  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>SPATIAL MODE · NATIVE</Text>
      <Text style={styles.title}>3D-машина времени уже собрана для двух эпох</Text>
      <Text style={styles.body}>
        В нативной сборке iOS/Android ViroReact загружает локальные GLB-модели Палат Романовых для 1857 и 1859/1883 годов, переключает их внутри AR и использует один профиль калибровки фасада.
      </Text>
      <View style={styles.eraRow}>
        <View style={styles.eraCard}>
          <Text style={styles.year}>1857</Text>
          <Text style={styles.eraText}>До реставрации</Text>
        </View>
        <View style={styles.arrow}><Text style={styles.arrowText}>→</Text></View>
        <View style={styles.eraCardActive}>
          <Text style={styles.yearActive}>1859 / 1883</Text>
          <Text style={styles.eraTextActive}>Реставрация Рихтера</Text>
        </View>
      </View>
      <Text style={styles.note}>Браузерный preview не эмулирует ARKit/ARCore. Следующий gate — полевые обмеры и совмещение на Варварке.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070809', alignItems: 'center', justifyContent: 'center', padding: 28 },
  kicker: { color: '#c5a56d', fontSize: 11, letterSpacing: 1.8, fontWeight: '900' },
  title: { color: '#fff8ea', fontSize: 27, lineHeight: 33, fontWeight: '800', textAlign: 'center', marginTop: 12, maxWidth: 560 },
  body: { color: '#a8abb1', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 12, maxWidth: 560 },
  eraRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, maxWidth: 560 },
  eraCard: { flex: 1, minWidth: 130, borderRadius: 18, borderWidth: 1, borderColor: '#484c53', padding: 16, backgroundColor: '#111418' },
  eraCardActive: { flex: 1, minWidth: 150, borderRadius: 18, borderWidth: 1, borderColor: '#c5a56d', padding: 16, backgroundColor: '#1b1711' },
  year: { color: '#d7d9dc', fontSize: 18, fontWeight: '900' },
  yearActive: { color: '#f0d39b', fontSize: 18, fontWeight: '900' },
  eraText: { color: '#9ea1a8', fontSize: 12, marginTop: 5 },
  eraTextActive: { color: '#d8c7a6', fontSize: 12, marginTop: 5 },
  arrow: { width: 44, alignItems: 'center' },
  arrowText: { color: '#8b8f96', fontSize: 24 },
  note: { color: '#767a82', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 22, maxWidth: 520 }
});
