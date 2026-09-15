import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { places } from '../../data/places';

type Props = { selectedId: string; onSelect: (id: string) => void };

export default function MoscowMapFallback({ selectedId, onSelect }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>МАРШРУТ НА КАРТЕ</Text>
      {places.map((place, index) => (
        <Pressable key={place.id} onPress={() => onSelect(place.id)} style={styles.row}>
          <View style={[styles.number, selectedId === place.id && styles.numberActive]}>
            <Text style={styles.numberText}>{index + 1}</Text>
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{place.title}</Text>
            <Text style={styles.body}>{place.subtitle}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: 24, padding: 20, backgroundColor: '#15171a' },
  label: { color: '#b99b69', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  number: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#24272c' },
  numberActive: { backgroundColor: '#d7bb84' },
  numberText: { color: '#17130d', fontWeight: '900' },
  copy: { flex: 1, minWidth: 0, marginLeft: 12 },
  title: { color: '#f0eee8', fontSize: 16, fontWeight: '700' },
  body: { color: '#92959b', fontSize: 13, marginTop: 3 }
});
