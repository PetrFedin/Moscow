import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MarkerView, Polyline, YandexMapView, initialize } from 'expo-yandex-mapkit';
import { pilotRoute, places } from '../../data/places';

const pilotPlaces = pilotRoute.stopIds.flatMap((id) => {
  const place = places.find((item) => item.id === id);
  return place ? [place] : [];
});

type Props = {
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function MoscowMap({ selectedId, onSelect }: Props) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiKey = process.env.EXPO_PUBLIC_YANDEX_MAPKIT_API_KEY;

  const routePoints = useMemo(
    () => pilotRoute.stopIds
      .map((id) => places.find((place) => place.id === id))
      .filter((place): place is NonNullable<typeof place> => Boolean(place))
      .map((place) => ({ latitude: place.latitude, longitude: place.longitude })),
    []
  );

  useEffect(() => {
    if (!apiKey) {
      setError('Для нативной карты нужен EXPO_PUBLIC_YANDEX_MAPKIT_API_KEY.');
      return;
    }

    initialize(apiKey)
      .then(() => setReady(true))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'MapKit не инициализирован'));
  }, [apiKey]);

  if (error) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Карта подготовлена к подключению</Text>
        <Text style={styles.fallbackBody}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return <View style={styles.loading}><ActivityIndicator /><Text style={styles.loadingText}>Загружаем карту Москвы…</Text></View>;
  }

  return (
    <View style={styles.wrapper}>
      <YandexMapView
        style={StyleSheet.absoluteFill}
        cameraPosition={{ latitude: 55.7524, longitude: 37.6292, zoom: 15.4, tilt: 42 }}
        nightMode
        showUserPosition
      >
        <Polyline points={routePoints} strokeColor="#d7bb84" strokeWidth={4} />
        {pilotPlaces.map((place, index) => (
          <MarkerView
            key={place.id}
            point={{ latitude: place.latitude, longitude: place.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Открыть ${place.title}`}
              onPress={() => onSelect(place.id)}
              style={[styles.marker, selectedId === place.id && styles.markerActive]}
            >
              <Text style={[styles.markerText, selectedId === place.id && styles.markerTextActive]}>{index + 1}</Text>
            </Pressable>
          </MarkerView>
        ))}
      </YandexMapView>
      <View pointerEvents="none" style={styles.routeNote}>
        <Text style={styles.routeNoteText}>СХЕМА ОСТАНОВОК · НЕ ПОШАГОВАЯ НАВИГАЦИЯ</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { height: 480, borderRadius: 24, overflow: 'hidden', backgroundColor: '#15171a' },
  routeNote: { position: 'absolute', left: 12, right: 12, bottom: 12, minHeight: 30, borderRadius: 10, backgroundColor: 'rgba(12,14,17,0.88)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  routeNoteText: { color: '#d3bd91', fontSize: 8, fontWeight: '900', letterSpacing: 0.7, textAlign: 'center' },
  loading: { height: 480, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#15171a' },
  loadingText: { color: '#a8aab0', marginTop: 12 },
  fallback: { borderRadius: 24, padding: 22, backgroundColor: '#17191d', borderWidth: StyleSheet.hairlineWidth, borderColor: '#303238' },
  fallbackTitle: { color: '#f5f3ee', fontSize: 19, fontWeight: '700' },
  fallbackBody: { color: '#a8aab0', fontSize: 14, lineHeight: 20, marginTop: 8 },
  marker: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#17191d', borderWidth: 2, borderColor: '#d7bb84' },
  markerActive: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#d7bb84' },
  markerText: { color: '#e9c98e', fontWeight: '900' },
  markerTextActive: { color: '#17130d' }
});
