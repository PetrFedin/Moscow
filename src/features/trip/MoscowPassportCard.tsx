import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import { moscowVarvarkaDestinationPackage } from '../../travel/moscowDestinationPackage';
import {
  buildMoscowPassport,
  passportNonEmptyCategories,
  type MoscowPassportCategory
} from '../../travel/moscowPassport';
import type { PersonalTrip, PersonalTripVisit } from '../../travel/personalTrip';

type Props = {
  trip: PersonalTrip;
  language: AppLanguage;
};

const categoryLabel: Record<AppLanguage, Record<MoscowPassportCategory, string>> = {
  ru: {
    saw: 'Увидел',
    ate: 'Где ел',
    nightlife: 'Бары',
    culture: 'Культура',
    activity: 'Активности',
    shopping: 'Покупки',
    stay: 'Проживание',
    transport: 'Транспорт',
    other: 'Другое'
  },
  en: {
    saw: 'Seen',
    ate: 'Where I ate',
    nightlife: 'Bars',
    culture: 'Culture',
    activity: 'Activities',
    shopping: 'Shopping',
    stay: 'Stay',
    transport: 'Transport',
    other: 'Other'
  },
  zh: {
    saw: '看过',
    ate: '用餐',
    nightlife: '酒吧',
    culture: '文化',
    activity: '体验',
    shopping: '购物',
    stay: '住宿',
    transport: '交通',
    other: '其他'
  }
};

function evidenceLabel(language: AppLanguage, evidence: PersonalTripVisit['evidence']) {
  switch (evidence) {
    case 'user-confirmed':
      return tr(language, 'отмечено вами', 'marked by you', '由你标记');
    case 'route-completed':
      return tr(language, 'из прогулки', 'from walk', '来自路线');
    case 'provider-receipt':
      return tr(language, 'есть подтверждение провайдера', 'provider receipt recorded', '已记录供应商凭证');
    case 'proximity':
      return tr(language, 'по ограниченному proximity-сигналу', 'bounded proximity signal', '有限的邻近信号');
  }
}

function categorySymbol(category: MoscowPassportCategory) {
  switch (category) {
    case 'saw': return '◉';
    case 'ate': return '⌁';
    case 'nightlife': return '◇';
    case 'culture': return '✦';
    case 'activity': return '↗';
    case 'shopping': return '□';
    case 'stay': return '⌂';
    case 'transport': return '→';
    default: return '·';
  }
}

export default function MoscowPassportCard({ trip, language }: Props) {
  const passport = useMemo(
    () => buildMoscowPassport({ trip, pkg: moscowVarvarkaDestinationPackage }),
    [trip]
  );

  if (passport.visitedCount === 0) return null;

  const nonEmpty = passportNonEmptyCategories(passport);

  return (
    <View style={styles.root}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.kicker}>{tr(language, 'МОЯ ИСТОРИЯ МОСКВЫ', 'MY MOSCOW HISTORY', '我的莫斯科足迹')}</Text>
          <Text style={styles.title}>{tr(language, 'Moscow Passport', 'Moscow Passport', '莫斯科护照')}</Text>
          <Text style={styles.subtitle}>
            {tr(
              language,
              'Личная история того, что вы действительно отметили как посещённое.',
              'Your personal history of what you actually recorded as visited.',
              '你实际记录为到访过的个人莫斯科足迹。'
            )}
          </Text>
        </View>
        <View style={styles.total}>
          <Text style={styles.totalValue}>{passport.visitedCount}</Text>
          <Text style={styles.totalLabel}>{tr(language, 'мест', 'places', '地点')}</Text>
        </View>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryMetric}>
          <Text style={styles.summaryValue}>{passport.daysVisited}</Text>
          <Text style={styles.summaryLabel}>{tr(language, 'дней с визитами', 'visited days', '到访天数')}</Text>
        </View>
        {nonEmpty.slice(0, 5).map((category) => (
          <View key={category} style={styles.summaryMetric}>
            <Text style={styles.summaryValue}>{passport.categoryCounts[category]}</Text>
            <Text style={styles.summaryLabel}>{categoryLabel[language][category]}</Text>
          </View>
        ))}
      </View>

      {nonEmpty.length > 5 ? (
        <View style={styles.categoryWrap}>
          {nonEmpty.slice(5).map((category) => (
            <View key={category} style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>
                {categorySymbol(category)} {categoryLabel[language][category]} · {passport.categoryCounts[category]}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.days}>
        {[...passport.days].reverse().map((day) => (
          <View key={day.dayDate} style={styles.day}>
            <Text style={styles.dayDate}>{day.dayDate}</Text>
            {day.entries.map((entry) => (
              <View key={entry.visit.id} style={styles.entry}>
                <View style={styles.entrySymbol}>
                  <Text style={styles.entrySymbolText}>{categorySymbol(entry.category)}</Text>
                </View>
                <View style={styles.entryCopy}>
                  <Text style={styles.entryTitle}>{entry.visit.title}</Text>
                  <Text style={styles.entryMeta}>
                    {categoryLabel[language][entry.category]} · {evidenceLabel(language, entry.visit.evidence)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>

      <Text style={styles.truth}>
        {tr(
          language,
          'Passport не подтверждает физическое присутствие сам по себе: тип подтверждения каждого визита сохранён отдельно.',
          'Passport does not prove physical presence by itself: each visit keeps its own evidence class.',
          'Passport 本身不证明实际到场：每次到访都单独保留其证据类型。'
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderRadius: 22, borderWidth: 1, borderColor: '#333b38', backgroundColor: '#111614', padding: 15, marginTop: 18 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headingCopy: { flex: 1, minWidth: 0 },
  kicker: { color: '#9bb5a4', fontSize: 8, fontWeight: '900', letterSpacing: 1.15 },
  title: { color: '#eef2ed', fontSize: 19, lineHeight: 24, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#818b84', fontSize: 9, lineHeight: 13, marginTop: 4 },
  total: { minWidth: 58, borderRadius: 15, backgroundColor: '#1c2520', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 9 },
  totalValue: { color: '#b7d1bc', fontSize: 20, fontWeight: '900' },
  totalLabel: { color: '#728078', fontSize: 7.5, marginTop: 1 },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13 },
  summaryMetric: { minWidth: 78, flexGrow: 1, borderRadius: 13, backgroundColor: '#171d1a', padding: 9 },
  summaryValue: { color: '#dce6dd', fontSize: 15, fontWeight: '900' },
  summaryLabel: { color: '#78827c', fontSize: 7.5, lineHeight: 10, marginTop: 2 },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  categoryPill: { borderRadius: 999, borderWidth: 1, borderColor: '#344039', paddingVertical: 5, paddingHorizontal: 8 },
  categoryPillText: { color: '#94a59a', fontSize: 8, fontWeight: '800' },
  days: { gap: 10, marginTop: 15 },
  day: { borderTopWidth: 1, borderTopColor: '#29302c', paddingTop: 10 },
  dayDate: { color: '#6f7d74', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.8, marginBottom: 6 },
  entry: { flexDirection: 'row', gap: 9, alignItems: 'center', paddingVertical: 6 },
  entrySymbol: { width: 29, height: 29, borderRadius: 10, backgroundColor: '#1c2520', alignItems: 'center', justifyContent: 'center' },
  entrySymbolText: { color: '#a9c1ae', fontSize: 12, fontWeight: '900' },
  entryCopy: { flex: 1, minWidth: 0 },
  entryTitle: { color: '#d8dfda', fontSize: 10.5, fontWeight: '800' },
  entryMeta: { color: '#768078', fontSize: 8, marginTop: 2 },
  truth: { color: '#69736d', fontSize: 8, lineHeight: 12, marginTop: 12 }
});
