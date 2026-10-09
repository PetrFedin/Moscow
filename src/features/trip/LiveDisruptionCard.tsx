import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import type { DayComposerDisruptionCase } from '../../travel/dayComposerDisruption';
import PhysicalPressable from '../../ui/PhysicalPressable';

function reasonLabel(language: AppLanguage, reason: DayComposerDisruptionCase['disruption']['reason']) {
  switch (reason) {
    case 'closed':
      return tr(language, 'закрыто', 'closed', '已关闭');
    case 'cancelled':
      return tr(language, 'отменено', 'cancelled', '已取消');
    case 'rescheduled':
      return tr(language, 'перенесено', 'rescheduled', '已改期');
    case 'stale':
      return tr(language, 'данные устарели', 'source truth is stale', '实时信息已过期');
  }
}

function time(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Moscow'
  }).format(new Date(value));
}

export default function LiveDisruptionCard({
  disruptions,
  language
}: {
  disruptions: DayComposerDisruptionCase[];
  language: AppLanguage;
}) {
  if (disruptions.length === 0) return null;

  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>LIVE DISRUPTION · REPLAN REQUIRED</Text>
      <Text style={styles.title}>
        {tr(
          language,
          'План дня изменился по актуальным данным',
          'Current city truth changed your day',
          '实时城市信息改变了当天计划'
        )}
      </Text>
      <Text style={styles.body}>
        {tr(
          language,
          'Moscow ничего не переставляет автоматически. Сначала показывает затронутый пункт, источник изменения и какие фиксированные билеты или брони обязаны остаться на месте.',
          'Moscow does not move anything automatically. It first shows the affected item, source evidence and the fixed tickets or reservations that must remain unchanged.',
          'Moscow 不会自动改动行程。系统先显示受影响项目、来源证据，以及必须保持不变的固定门票或预订。'
        )}
      </Text>

      {disruptions.map((item) => (
        <View key={item.id} style={styles.case}>
          <View style={styles.caseHeader}>
            <View style={styles.caseCopy}>
              <Text style={styles.reason}>REPLAN REQUIRED · {reasonLabel(language, item.disruption.reason).toUpperCase()}</Text>
              <Text style={styles.itemTitle}>{item.affectedItem.title}</Text>
              <Text style={styles.meta}>
                {time(item.affectedItem.startsAt)}–{time(item.affectedItem.endsAt)}
                {' · '}
                {item.affectedItem.commitment === 'none'
                  ? tr(language, 'гибкий пункт', 'flexible item', '灵活项目')
                  : tr(language, 'есть обязательство', 'has commitment', '有固定承诺')}
              </Text>
            </View>
            <View style={styles.statePill}>
              <Text style={styles.stateText}>{item.runtime.state.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.evidence}>
            <Text style={styles.evidenceTitle}>{tr(language, 'ИСТОЧНИК ИЗМЕНЕНИЯ', 'CHANGE SOURCE', '变更来源')}</Text>
            <Text style={styles.evidenceText}>
              {item.disruption.providerName} · {item.disruption.observedAt}
            </Text>
            <PhysicalPressable
              style={styles.sourceButton}
              contentStyle={styles.center}
              onPress={() => Linking.openURL(item.disruption.sourceUrl).catch(() => undefined)}
            >
              <Text style={styles.sourceText}>{tr(language, 'Открыть источник', 'Open source', '打开来源')}</Text>
            </PhysicalPressable>
          </View>

          <View style={styles.fixed}>
            <Text style={styles.fixedTitle}>
              {tr(language, 'ФИКСИРОВАННЫЕ ПУНКТЫ СОХРАНЯЕМ', 'FIXED COMMITMENTS STAY EXACT', '固定安排保持不变')}
            </Text>
            {item.preservedFixedCommitments.length === 0 ? (
              <Text style={styles.fixedEmpty}>
                {tr(language, 'Других фиксированных билетов и броней в этом дне нет.', 'No other fixed tickets or reservations in this day.', '当天没有其他固定门票或预订。')}
              </Text>
            ) : item.preservedFixedCommitments.map((fixed) => (
              <Text key={fixed.itemId} style={styles.fixedLine}>
                {time(fixed.startsAt)}–{time(fixed.endsAt)} · {fixed.title}
              </Text>
            ))}
          </View>

          <Text style={styles.next}>
            {tr(
              language,
              'Следующий шаг: подобрать только source-backed замену, проверить её выполнимость вокруг сохранённых обязательств и попросить ваше явное подтверждение.',
              'Next: offer only source-backed replacements, verify feasibility around preserved commitments, and require your explicit acceptance.',
              '下一步：只提供有来源依据的替代方案，验证其与固定安排的可执行性，并要求你明确确认。'
            )}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#754940',
    backgroundColor: '#1a1110',
    padding: 14,
    marginBottom: 14
  },
  kicker: { color: '#df8f7d', fontSize: 7.5, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#f1e8e3', fontSize: 16, lineHeight: 21, fontWeight: '900', marginTop: 5 },
  body: { color: '#aa938d', fontSize: 8.5, lineHeight: 13, marginTop: 5 },
  case: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#4f302b',
    backgroundColor: '#211514',
    padding: 11,
    marginTop: 11
  },
  caseHeader: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  caseCopy: { flex: 1, minWidth: 0 },
  reason: { color: '#ee9d8a', fontSize: 7.5, fontWeight: '900', letterSpacing: 0.6 },
  itemTitle: { color: '#f1e9e5', fontSize: 14, lineHeight: 18, fontWeight: '900', marginTop: 4 },
  meta: { color: '#9c8781', fontSize: 8, marginTop: 3 },
  statePill: { borderRadius: 10, backgroundColor: '#351d1a', paddingHorizontal: 7, paddingVertical: 5 },
  stateText: { color: '#efaa98', fontSize: 6.5, fontWeight: '900' },
  evidence: { borderTopWidth: 1, borderTopColor: '#3b2723', marginTop: 10, paddingTop: 9 },
  evidenceTitle: { color: '#816d67', fontSize: 7, fontWeight: '900', letterSpacing: 0.7 },
  evidenceText: { color: '#c8b8b2', fontSize: 8.5, lineHeight: 13, marginTop: 4 },
  sourceButton: { alignSelf: 'flex-start', minHeight: 32, borderRadius: 10, borderWidth: 1, borderColor: '#6b443c', marginTop: 7 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9 },
  sourceText: { color: '#dca090', fontSize: 7.5, fontWeight: '900' },
  fixed: { borderTopWidth: 1, borderTopColor: '#3b2723', marginTop: 10, paddingTop: 9 },
  fixedTitle: { color: '#bea77c', fontSize: 7, fontWeight: '900', letterSpacing: 0.7 },
  fixedLine: { color: '#d7c9bd', fontSize: 8.5, lineHeight: 13, marginTop: 4 },
  fixedEmpty: { color: '#8f7f79', fontSize: 8.5, lineHeight: 13, marginTop: 4 },
  next: { color: '#a9958e', fontSize: 8, lineHeight: 12, marginTop: 10 }
});
