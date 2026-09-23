import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { places } from '../../data/places';
import { localizePlaces } from '../../data/places.en';
import type { AppLanguage } from '../../i18n';
import PhysicalPressable from '../../ui/PhysicalPressable';
import {
  buildTouristRoutePlan,
  type TouristInterest,
  type TouristRoutePlan,
  type TouristTimeBudget
} from './touristPlanner';

type Props = {
  language: AppLanguage;
  mustSeeIds: string[];
  onStart: (plan: TouristRoutePlan) => void;
};

const budgets: TouristTimeBudget[] = [15, 30, 45];
const interests: TouristInterest[] = ['highlights', 'architecture', 'trade', 'lost-city'];

const labels = {
  ru: {
    kicker: 'ПРОГУЛКА ПОД МЕНЯ',
    title: 'Сколько у вас времени и что интересно?',
    body: 'Соберём короткий маршрут вместо обязательной прогулки по всем точкам.',
    time: 'ВРЕМЯ',
    interest: 'ИНТЕРЕС',
    minutes: 'мин',
    stops: 'мест',
    start: 'Начать маршрут',
    savedHint: 'Сохранённые места считаем обязательными, если они помещаются во время.',
    estimate: 'Оценка времени до появления точной пешеходной геометрии',
    route: 'МАРШРУТ',
    interestLabels: {
      highlights: 'Главное',
      architecture: 'Архитектура',
      trade: 'Купеческая и торговая Москва',
      'lost-city': 'Утраченная Москва',
      nearby: 'Рядом сейчас'
    }
  },
  en: {
    kicker: 'A WALK FOR ME',
    title: 'How much time do you have?',
    body: 'Build a compact route around your interests instead of following every stop.',
    time: 'TIME',
    interest: 'INTEREST',
    minutes: 'min',
    stops: 'stops',
    start: 'Start my route',
    savedHint: 'Saved places are treated as must-sees when they fit the time budget.',
    estimate: 'Time estimate until authoritative pedestrian routing is connected',
    route: 'ROUTE',
    interestLabels: {
      highlights: 'Highlights',
      architecture: 'Architecture',
      trade: 'Merchants & trade',
      'lost-city': 'Lost Moscow',
      nearby: 'Nearby now'
    }
  }
} as const;

export default function TouristRoutePlanner({ language, mustSeeIds, onStart }: Props) {
  const [budget, setBudget] = useState<TouristTimeBudget>(30);
  const [interest, setInterest] = useState<TouristInterest>('highlights');
  const copy = labels[language];
  const localizedPlaces = useMemo(() => localizePlaces(places, language), [language]);
  const placeById = useMemo(
    () => new Map(localizedPlaces.map((place) => [place.id, place])),
    [localizedPlaces]
  );
  const plan = useMemo(
    () => buildTouristRoutePlan(budget, interest, undefined, mustSeeIds),
    [budget, interest, mustSeeIds]
  );

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>{copy.kicker}</Text>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.body}>{copy.body}</Text>
      {mustSeeIds.length > 0 && (
        <Text style={styles.savedHint}>★ {copy.savedHint}</Text>
      )}

      <Text style={styles.label}>{copy.time}</Text>
      <View style={styles.chips}>
        {budgets.map((item) => (
          <PhysicalPressable
            key={item}
            style={[styles.chip, budget === item && styles.chipActive]}
            contentStyle={styles.center}
            onPress={() => setBudget(item)}
            accessibilityLabel={`${item} ${copy.minutes}`}
          >
            <Text style={[styles.chipText, budget === item && styles.chipTextActive]}>{item} {copy.minutes}</Text>
          </PhysicalPressable>
        ))}
      </View>

      <Text style={styles.label}>{copy.interest}</Text>
      <View style={styles.interests}>
        {interests.map((item) => (
          <PhysicalPressable
            key={item}
            style={[styles.interest, interest === item && styles.interestActive]}
            contentStyle={styles.center}
            onPress={() => setInterest(item)}
            accessibilityLabel={copy.interestLabels[item]}
          >
            <Text style={[styles.interestText, interest === item && styles.interestTextActive]}>{copy.interestLabels[item]}</Text>
          </PhysicalPressable>
        ))}
      </View>

      <Text style={styles.label}>{copy.route}</Text>
      <View style={styles.routePreview}>
        {plan.stopIds.map((id, index) => (
          <View key={id} style={styles.routeStop}>
            <View style={styles.routeNumber}><Text style={styles.routeNumberText}>{index + 1}</Text></View>
            <Text style={styles.routeStopText}>{placeById.get(id)?.title ?? id}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.estimateNote}>≈ {plan.estimatedMinutes} {copy.minutes} · {copy.estimate}</Text>

      <PhysicalPressable
        style={styles.primary}
        contentStyle={styles.center}
        strong
        onPress={() => onStart(plan)}
        accessibilityLabel={copy.start}
      >
        <Text style={styles.primaryText}>
          {copy.start} · {plan.stopIds.length} {copy.stops} · ≈{plan.estimatedMinutes} {copy.minutes}
        </Text>
      </PhysicalPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, borderColor: '#3a3f46', backgroundColor: '#111418', padding: 18, marginBottom: 22 },
  kicker: { color: '#b99b69', fontSize: 9, letterSpacing: 1.4, fontWeight: '900' },
  title: { color: '#fff8ea', fontSize: 20, lineHeight: 25, fontWeight: '900', marginTop: 5 },
  body: { color: '#969ba3', fontSize: 11, lineHeight: 17, marginTop: 6 },
  savedHint: { color: '#c7ae7c', fontSize: 9, lineHeight: 14, marginTop: 8 },
  label: { color: '#777d85', fontSize: 8, letterSpacing: 1.2, fontWeight: '900', marginTop: 14, marginBottom: 7 },
  chips: { flexDirection: 'row', gap: 7 },
  chip: { flex: 1, minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: '#3c4249' },
  chipActive: { backgroundColor: '#d7bb84', borderColor: '#d7bb84' },
  chipText: { color: '#aeb2b8', fontSize: 10, fontWeight: '900' },
  chipTextActive: { color: '#17130d' },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  interest: { minHeight: 40, borderRadius: 13, borderWidth: 1, borderColor: '#3c4249', paddingHorizontal: 10 },
  interestActive: { borderColor: '#9f855a', backgroundColor: '#211b13' },
  interestText: { color: '#9ca1a8', fontSize: 9, fontWeight: '900' },
  interestTextActive: { color: '#ebcc91' },
  routePreview: { gap: 6 },
  routeStop: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 11, backgroundColor: '#171a1f', paddingHorizontal: 9 },
  routeNumber: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#282d33' },
  routeNumberText: { color: '#d7bb84', fontSize: 8, fontWeight: '900' },
  routeStopText: { flex: 1, color: '#c7cbd0', fontSize: 9.5, fontWeight: '800' },
  estimateNote: { color: '#70767e', fontSize: 8.5, lineHeight: 12, marginTop: 7 },
  primary: { minHeight: 50, borderRadius: 15, backgroundColor: '#d7bb84', marginTop: 14 },
  primaryText: { color: '#17130d', fontSize: 11, fontWeight: '900', textAlign: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }
});
