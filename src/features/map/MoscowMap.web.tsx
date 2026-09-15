import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { places } from '../../data/places';

type Props = {
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function MoscowMap({ selectedId, onSelect }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>PREVIEW КАРТЫ</Text>
      <Text style={styles.title}>Варварка — Зарядье</Text>
      <Text style={styles.body}>В мобильной сборке здесь работает нативный Yandex MapKit. В браузерном preview показана та же последовательность остановок без подмены её веб-картой.</Text>
      <View style={styles.track}>
        {places.map((place, index) => (
          <Pressable key={place.id} onPress={() => onSelect(place.id)} style={styles.stopRow}>
            <View style={[styles.dot, selectedId === place.id && styles.dotActive]}><Text style={[styles.dotText, selectedId === place.id && styles.dotTextActive]}>{index + 1}</Text></View>
            <View style={styles.copy}>
              <Text style={styles.placeTitle}>{place.title}</Text>
              <Text style={styles.placeBody}>{place.subtitle}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: 24, padding: 22, backgroundColor: '#15171a', borderWidth: StyleSheet.hairlineWidth, borderColor: '#303238' },
  label: { color: '#b99b69', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: '#f5f3ee', fontSize: 26, fontWeight: '700', marginTop: 8 },
  body: { color: '#a7a9af', fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 18 },
  track: { borderLeftWidth: 1, borderLeftColor: '#4b4438', marginLeft: 18 },
  stopRow: { flexDirection: 'row', alignItems: 'center', marginLeft: -18, marginBottom: 16 },
  dot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#23262b', borderWidth: 1, borderColor: '#75674f' },
  dotActive: { backgroundColor: '#d7bb84', borderColor: '#d7bb84' },
  dotText: { color: '#d7bb84', fontWeight: '800' },
  dotTextActive: { color: '#17130d' },
  copy: { flex: 1, minWidth: 0, paddingLeft: 12 },
  placeTitle: { color: '#f0eee8', fontSize: 16, fontWeight: '700' },
  placeBody: { color: '#91949b', fontSize: 13, marginTop: 3 }
});
