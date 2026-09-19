import * as Location from 'expo-location';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

export default function NearbyNow({
  language,
  visitedIds,
  onOpenPlace,
  onStartFreeWalk
}: Props) {
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [state, setState] = useState<'idle' | 'locating' | 'ready' | 'denied' | 'error'>('idle');
  const ru = language === 'ru';

  const locate = useCallback(async (prompt = true) => {
    setState('locating');
    try {
      const permission = prompt
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setState(prompt ? 'denied' : 'idle');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    void locate(false);
  }, [locate]);

  const nearby = useMemo(
    () => location ? rankNearbyPlaces(location, places, visitedIds).slice(0, 3) : [],
    [location, visitedIds]
  );

  const startFreeWalk = () => {
    if (!location) return;
    onStartFreeWalk(buildNearbyWalkPlan(location, places, visitedIds, 45));
  };

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.copy}>
          <Text style={styles.kicker}>{ru ? 'РЯДОМ СЕЙЧАС' : 'NEARBY NOW'}</Text>
          <Text style={styles.title}>{ru ? 'Не выбирайте маршрут — начните отсюда' : 'Skip planning — start from where you are'}</Text>
          <Text style={styles.body}>
            {ru
              ? 'Покажем ближайшие исторические точки и соберём свободную прогулку. Геопозиция не сохраняется.'
              : 'See the nearest historical stops and build a free walk. Your location is not stored.'}
          </Text>
        </View>
        {state === 'locating' && <ActivityIndicator color="#d7bb84" />}
      </View>

      {state === 'ready' && nearby.length > 0 ? (
        <>
          <View style={styles.list}>
            {nearby.map((item, index) => (
              <PhysicalPressable
                key={item.place.id}
                style={styles.row}
                contentStyle={styles.rowContent}
                onPress={() => onOpenPlace(item.place.id)}
                accessibilityLabel={`${ru ? 'Рядом' : 'Nearby'} · ${item.place.title}`}
              >
                <View style={styles.number}><Text style={styles.numberText}>{index + 1}</Text></View>
                <View style={styles.rowCopy}>
                  <Text style={styles.placeTitle}>{item.place.title}</Text>
                  <Text style={styles.meta}>
                    {Math.round(item.distanceMeters)} {ru ? 'м' : 'm'} · {item.visited ? (ru ? 'уже открыто' : 'seen') : (ru ? 'новое' : 'new')}
                  </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </PhysicalPressable>
            ))}
          </View>
          <View style={styles.actions}>
            <PhysicalPressable style={styles.primary} contentStyle={styles.center} strong onPress={startFreeWalk} accessibilityLabel={ru ? 'Начать свободную прогулку' : 'Start free walk'}>
              <Text style={styles.primaryText}>{ru ? 'Свободная прогулка отсюда' : 'Free walk from here'}</Text>
            </PhysicalPressable>
            <PhysicalPressable style={styles.refresh} contentStyle={styles.center} onPress={() => { void locate(true); }} accessibilityLabel={ru ? 'Обновить геопозицию' : 'Refresh location'}>
              <Text style={styles.refreshText}>↻</Text>
            </PhysicalPressable>
          </View>
        </>
      ) : (
        <PhysicalPressable
          style={styles.primary}
          contentStyle={styles.center}
          strong
          disabled={state === 'locating'}
          onPress={() => { void locate(true); }}
          accessibilityLabel={ru ? 'Показать что рядом' : 'Show what is nearby'}
        >
          <Text style={styles.primaryText}>
            {state === 'locating'
              ? (ru ? 'Определяем место…' : 'Finding you…')
              : (ru ? 'Показать, что рядом' : 'Show what is nearby')}
          </Text>
        </PhysicalPressable>
      )}

      {state === 'denied' && <Text style={styles.warning}>{ru ? 'Без геопозиции режим «Рядом» не работает. Обычный планировщик ниже остаётся доступен.' : 'Nearby needs location permission. The regular planner below still works.'}</Text>}
      {state === 'error' && <Text style={styles.warning}>{ru ? 'Не удалось определить место. Можно повторить или выбрать маршрут вручную.' : 'Could not determine your location. Retry or use the manual planner.'}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, borderColor: '#4a4438', backgroundColor: '#15130f', padding: 17, marginBottom: 16 },
  top: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  copy: { flex: 1, minWidth: 0 },
  kicker: { color: '#c5a66e', fontSize: 9, letterSpacing: 1.35, fontWeight: '900' },
  title: { color: '#fff8ea', fontSize: 18, lineHeight: 23, fontWeight: '900', marginTop: 5 },
  body: { color: '#9b958c', fontSize: 10.5, lineHeight: 16, marginTop: 6 },
  list: { marginTop: 10 },
  row: { minHeight: 58, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#403a30' },
  rowContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  number: { width: 31, height: 31, borderRadius: 16, backgroundColor: '#242019', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  numberText: { color: '#d7bb84', fontSize: 9, fontWeight: '900' },
  rowCopy: { flex: 1, minWidth: 0 },
  placeTitle: { color: '#eee8dc', fontSize: 12, fontWeight: '900' },
  meta: { color: '#88837a', fontSize: 8.5, marginTop: 3 },
  arrow: { color: '#d7bb84', fontSize: 21 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 9 },
  primary: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: '#d7bb84', marginTop: 10 },
  primaryText: { color: '#17130d', fontSize: 10.5, fontWeight: '900', textAlign: 'center' },
  refresh: { width: 48, minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: '#5a4d39', marginTop: 10 },
  refreshText: { color: '#e4c688', fontSize: 20, fontWeight: '900' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  warning: { color: '#c58d81', fontSize: 9, lineHeight: 13, marginTop: 8 }
});
