import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { places } from '../../data/places';
import type { AppLanguage } from '../../i18n';
import PhysicalPressable from '../../ui/PhysicalPressable';
import type { TouristRoutePlan } from '../planning/touristPlanner';
import {
  buildNearbyWalkPlan,
  rankNearbyPlaces,
  type GeoPoint
} from './nearbyContract';

type Props = {
  language: AppLanguage;
  visitedIds: string[];
  onOpenPlace: (placeId: string) => void;
  onStartFreeWalk: (plan: TouristRoutePlan) => void;
};

export default function NearbyNow({ language, visitedIds, onOpenPlace, onStartFreeWalk }: Props) {
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [state, setState] = useState<'idle' | 'locating' | 'ready' | 'denied' | 'error'>('idle');
  const ru = language === 'ru';

  const locate = () => {
    const geolocation = globalThis.navigator?.geolocation;
    if (!geolocation) {
      setState('error');
      return;
    }
    setState('locating');
    geolocation.getCurrentPosition(
      (position) => {
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setState('ready');
      },
      (error) => setState(error.code === 1 ? 'denied' : 'error'),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 }
    );
  };

  const nearby = useMemo(
    () => location ? rankNearbyPlaces(location, places, visitedIds).slice(0, 3) : [],
    [location, visitedIds]
  );

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>{ru ? 'РЯДОМ СЕЙЧАС' : 'NEARBY NOW'}</Text>
      <Text style={styles.title}>{ru ? 'Начните с того, что действительно рядом' : 'Start with what is actually nearby'}</Text>
      <Text style={styles.body}>{ru ? 'Браузер запросит геопозицию один раз. Координаты используются только для расчёта расстояния и не сохраняются.' : 'Your browser asks for location once. Coordinates are used only to calculate distance and are not stored.'}</Text>

      {state === 'ready' && nearby.length > 0 ? (
        <>
          <View style={styles.list}>
            {nearby.map((item) => (
              <PhysicalPressable key={item.place.id} style={styles.row} contentStyle={styles.rowContent} onPress={() => onOpenPlace(item.place.id)}>
                <View style={styles.rowCopy}>
                  <Text style={styles.placeTitle}>{item.place.title}</Text>
                  <Text style={styles.meta}>{Math.round(item.distanceMeters)} {ru ? 'м' : 'm'} · {item.visited ? (ru ? 'уже открыто' : 'seen') : (ru ? 'новое' : 'new')}</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </PhysicalPressable>
            ))}
          </View>
          <PhysicalPressable
            style={styles.primary}
            contentStyle={styles.center}
            strong
            onPress={() => location && onStartFreeWalk(buildNearbyWalkPlan(location, places, visitedIds, 45))}
            accessibilityLabel={ru ? 'Начать свободную прогулку' : 'Start free walk'}
          >
            <Text style={styles.primaryText}>{ru ? 'Свободная прогулка отсюда' : 'Free walk from here'}</Text>
          </PhysicalPressable>
        </>
      ) : (
        <PhysicalPressable style={styles.primary} contentStyle={styles.center} strong disabled={state === 'locating'} onPress={locate} accessibilityLabel={ru ? 'Показать что рядом' : 'Show what is nearby'}>
          {state === 'locating' ? <ActivityIndicator color="#17130d" /> : <Text style={styles.primaryText}>{ru ? 'Показать, что рядом' : 'Show what is nearby'}</Text>}
        </PhysicalPressable>
      )}
      {state === 'denied' && <Text style={styles.warning}>{ru ? 'Доступ к геопозиции не разрешён. Можно использовать обычный планировщик ниже.' : 'Location permission was not granted. Use the regular planner below.'}</Text>}
      {state === 'error' && <Text style={styles.warning}>{ru ? 'Геопозиция недоступна в этом браузере. Обычный планировщик остаётся доступен.' : 'Location is unavailable in this browser. The regular planner still works.'}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, borderColor: '#4a4438', backgroundColor: '#15130f', padding: 17, marginBottom: 16 },
  kicker: { color: '#c5a66e', fontSize: 9, letterSpacing: 1.35, fontWeight: '900' },
  title: { color: '#fff8ea', fontSize: 18, lineHeight: 23, fontWeight: '900', marginTop: 5 },
  body: { color: '#9b958c', fontSize: 10.5, lineHeight: 16, marginTop: 6 },
  list: { marginTop: 10 },
  row: { minHeight: 52, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#403a30' },
  rowContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  rowCopy: { flex: 1, minWidth: 0 },
  placeTitle: { color: '#eee8dc', fontSize: 12, fontWeight: '900' },
  meta: { color: '#88837a', fontSize: 8.5, marginTop: 3 },
  arrow: { color: '#d7bb84', fontSize: 21 },
  primary: { minHeight: 46, borderRadius: 14, backgroundColor: '#d7bb84', marginTop: 10 },
  primaryText: { color: '#17130d', fontSize: 10.5, fontWeight: '900', textAlign: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  warning: { color: '#c58d81', fontSize: 9, lineHeight: 13, marginTop: 8 }
});
