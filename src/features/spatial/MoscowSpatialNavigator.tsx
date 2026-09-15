import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { romanovHotspots } from '../../spatial/romanov-hotspots';

export default function MoscowSpatialNavigatorFallback() {
  const previewHotspots = romanovHotspots.filter((item) => item.era === 'both' || item.era === '1859');

  return (
    <ScrollView contentContainerStyle={styles.root}>
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

      <View style={styles.trustSection}>
        <Text style={styles.hotspotHeading}>Режим доверия</Text>
        <Text style={styles.hotspotLead}>В native AR переключается не подпись, а сам GLB-файл: спорная геометрия может быть физически исключена из сцены.</Text>
        <View style={styles.trustRow}>
          <View style={styles.trustCard}>
            <Text style={styles.trustKicker}>DOCUMENTED</Text>
            <Text style={styles.trustTitle}>Только подтверждённое</Text>
            <Text style={styles.trustBody}>В GLB остаются только узлы `documented__`.</Text>
          </View>
          <View style={styles.trustCardActive}>
            <Text style={styles.trustKickerActive}>PUBLIC RESEARCH</Text>
            <Text style={styles.trustTitle}>+ реконструкция</Text>
            <Text style={styles.trustBody}>Documented + reconstructed; hypothesis исключён из публичного GLB.</Text>
          </View>
        </View>
      </View>

      <View style={styles.hotspotSection}>
        <Text style={styles.hotspotHeading}>Интерактивные точки внутри native AR</Text>
        <Text style={styles.hotspotLead}>Нажатие на маркер в пространстве открывает статус доказательности и запускает аудио-историю.</Text>
        {previewHotspots.map((hotspot, index) => (
          <View key={hotspot.id} style={styles.hotspotCard}>
            <View style={styles.hotspotNumber}><Text style={styles.hotspotNumberText}>{index + 1}</Text></View>
            <View style={styles.hotspotCopy}>
              <Text style={styles.hotspotTitle}>{hotspot.titleRu}</Text>
              <Text style={styles.hotspotEvidence}>{hotspot.evidence === 'documented' ? 'Подтверждено источником' : hotspot.evidence === 'reconstructed' ? 'Исследовательская реконструкция' : 'Гипотеза'}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.note}>Браузерный preview не эмулирует ARKit/ARCore. Следующий gate — полевые обмеры, точное совмещение и измерение ошибки на Варварке.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flexGrow: 1, backgroundColor: '#070809', alignItems: 'center', justifyContent: 'center', padding: 28, paddingVertical: 54 },
  kicker: { color: '#c5a56d', fontSize: 11, letterSpacing: 1.8, fontWeight: '900' },
  title: { color: '#fff8ea', fontSize: 27, lineHeight: 33, fontWeight: '800', textAlign: 'center', marginTop: 12, maxWidth: 560 },
  body: { color: '#a8abb1', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 12, maxWidth: 560 },
  eraRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, maxWidth: 560, width: '100%' },
  eraCard: { flex: 1, minWidth: 130, borderRadius: 18, borderWidth: 1, borderColor: '#484c53', padding: 16, backgroundColor: '#111418' },
  eraCardActive: { flex: 1, minWidth: 150, borderRadius: 18, borderWidth: 1, borderColor: '#c5a56d', padding: 16, backgroundColor: '#1b1711' },
  year: { color: '#d7d9dc', fontSize: 18, fontWeight: '900' },
  yearActive: { color: '#f0d39b', fontSize: 18, fontWeight: '900' },
  eraText: { color: '#9ea1a8', fontSize: 12, marginTop: 5 },
  eraTextActive: { color: '#d8c7a6', fontSize: 12, marginTop: 5 },
  arrow: { width: 44, alignItems: 'center' },
  arrowText: { color: '#8b8f96', fontSize: 24 },
  trustSection: { width: '100%', maxWidth: 560, marginTop: 28 },
  trustRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  trustCard: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: '#343940', backgroundColor: '#101318', padding: 14 },
  trustCardActive: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: '#8b7450', backgroundColor: '#1b1711', padding: 14 },
  trustKicker: { color: '#82868d', fontSize: 8, letterSpacing: 1.1, fontWeight: '900' },
  trustKickerActive: { color: '#b99b69', fontSize: 8, letterSpacing: 1.1, fontWeight: '900' },
  trustTitle: { color: '#ede8de', fontSize: 14, fontWeight: '900', marginTop: 5 },
  trustBody: { color: '#878b93', fontSize: 10, lineHeight: 15, marginTop: 5 },
  hotspotSection: { width: '100%', maxWidth: 560, marginTop: 28 },
  hotspotHeading: { color: '#f5efe3', fontSize: 19, fontWeight: '900' },
  hotspotLead: { color: '#8f939b', fontSize: 12, lineHeight: 18, marginTop: 6, marginBottom: 9 },
  hotspotCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, borderColor: '#2f3339', backgroundColor: '#111418', padding: 13, marginTop: 8 },
  hotspotNumber: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#d7bb84', alignItems: 'center', justifyContent: 'center' },
  hotspotNumberText: { color: '#17130d', fontWeight: '900' },
  hotspotCopy: { flex: 1 },
  hotspotTitle: { color: '#ece8df', fontSize: 14, fontWeight: '800' },
  hotspotEvidence: { color: '#b79a68', fontSize: 10, fontWeight: '800', marginTop: 4 },
  note: { color: '#767a82', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 22, maxWidth: 520 }
});
