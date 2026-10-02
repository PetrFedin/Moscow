import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import type { PersonalTrip } from '../../travel/personalTrip';
import {
  applyPersonalTripReplanProposal,
  buildPersonalTripReplanProposal,
  type PersonalTripReplanProposal
} from '../../travel/personalTripReplan';
import PhysicalPressable from '../../ui/PhysicalPressable';

type Props = {
  trip: PersonalTrip;
  dayDate: string;
  language: AppLanguage;
  onUpdate: (trip: PersonalTrip) => void;
};

function timeLabel(language: AppLanguage, value: string) {
  const locale = language === 'ru' ? 'ru-RU' : language === 'zh' ? 'zh-CN' : 'en-GB';
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Moscow'
  }).format(new Date(value));
}

function unplacedLabel(language: AppLanguage, reason: 'missing-duration' | 'no-schedule-window') {
  return reason === 'missing-duration'
    ? tr(language, 'не задана длительность', 'duration is missing', '未设置时长')
    : tr(language, 'не помещается в свободное окно', 'no free schedule window', '没有可用时间窗');
}

export default function DayReplanCard({ trip, dayDate, language, onUpdate }: Props) {
  const [proposal, setProposal] = useState<PersonalTripReplanProposal | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setProposal(null);
    setError('');
  }, [trip.updatedAt, dayDate]);

  const titleById = useMemo(
    () => new Map(trip.items.map((item) => [item.id, item.title] as const)),
    [trip.items]
  );

  const plannedCount = trip.items.filter(
    (item) => item.dayDate === dayDate && item.status === 'planned'
  ).length;

  if (!trip.days.includes(dayDate) || plannedCount === 0) return null;

  const build = () => {
    try {
      const next = buildPersonalTripReplanProposal({
        trip,
        proposalId: `replan:${trip.id}:${dayDate}:${Date.now().toString(36)}`,
        dayDate,
        nowIso: new Date().toISOString(),
        trigger: 'manual'
      });
      setProposal(next);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'replan-error');
    }
  };

  const apply = () => {
    if (!proposal) return;
    try {
      const next = applyPersonalTripReplanProposal({
        trip,
        proposal,
        userAccepted: true,
        updatedAt: new Date().toISOString()
      });
      onUpdate(next);
      setProposal(null);
      setError('');
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message.includes('stale')
          ? tr(language, 'План изменился. Пересчитайте предложение.', 'The plan changed. Rebuild the proposal.', '计划已改变，请重新计算。')
          : tr(language, 'Не удалось применить предложение без изменения фиксированных пунктов.', 'Could not apply without changing fixed items.', '无法在不更改固定项目的情况下应用。')
      );
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.kicker}>{tr(language, 'DAY REPLAN', 'DAY REPLAN', '当日重排')}</Text>
          <Text style={styles.title}>
            {tr(language, 'Пересобрать остаток дня', 'Rebuild the rest of the day', '重新安排当天剩余行程')}
          </Text>
          <Text style={styles.body}>
            {tr(
              language,
              'Фиксированные билеты и брони останутся на месте. Меняются только гибкие пункты.',
              'Fixed tickets and reservations stay exactly where they are. Only flexible items can move.',
              '固定门票和预订保持原时间，只调整灵活项目。'
            )}
          </Text>
        </View>
        {!proposal ? (
          <PhysicalPressable style={styles.action} contentStyle={styles.center} onPress={build}>
            <Text style={styles.actionText}>{tr(language, 'Предложить', 'Propose', '生成方案')}</Text>
          </PhysicalPressable>
        ) : null}
      </View>

      <View style={styles.truthBox}>
        <Text style={styles.truthTitle}>{tr(language, 'Сейчас это schedule-only', 'Schedule-only for now', '当前仅按时间表')}</Text>
        <Text style={styles.truthText}>
          {tr(
            language,
            'Маршрут, часы работы, доступность и погода не подтверждены. Приложение не называет этот вариант выполнимым маршрутом.',
            'Routing, opening hours, accessibility and weather are not verified. The app does not call this a feasible route.',
            '路线、开放时间、无障碍和天气尚未核验，因此不会把该方案称为可执行路线。'
          )}
        </Text>
      </View>

      {proposal ? (
        <View style={styles.proposal}>
          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{proposal.preservedFixedCommitments.length}</Text>
              <Text style={styles.metricLabel}>{tr(language, 'фиксировано', 'fixed', '固定')}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{proposal.placements.length}</Text>
              <Text style={styles.metricLabel}>{tr(language, 'переставим', 'move', '调整')}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{proposal.unplaced.length}</Text>
              <Text style={styles.metricLabel}>{tr(language, 'без времени', 'unscheduled', '未排期')}</Text>
            </View>
          </View>

          {proposal.preservedFixedCommitments.length > 0 ? (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>{tr(language, 'СОХРАНЯЕМ ТОЧНО', 'KEEP EXACTLY', '保持不变')}</Text>
              {proposal.preservedFixedCommitments.map((item) => (
                <Text key={item.itemId} style={styles.line}>
                  {timeLabel(language, item.startAt)}–{timeLabel(language, item.endAt)} · {titleById.get(item.itemId) ?? item.itemId}
                </Text>
              ))}
            </View>
          ) : null}

          {proposal.placements.length > 0 ? (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>{tr(language, 'ПРЕДЛАГАЕМ', 'PROPOSED', '建议')}</Text>
              {proposal.placements.map((item) => (
                <Text key={item.itemId} style={styles.line}>
                  {timeLabel(language, item.proposedStartAt)}–{timeLabel(language, item.proposedEndAt)} · {titleById.get(item.itemId) ?? item.itemId}
                </Text>
              ))}
            </View>
          ) : null}

          {proposal.unplaced.length > 0 ? (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>{tr(language, 'ОСТАВИМ БЕЗ ВРЕМЕНИ', 'LEAVE UNSCHEDULED', '暂不排期')}</Text>
              {proposal.unplaced.map((item) => (
                <Text key={item.itemId} style={styles.unplaced}>
                  {titleById.get(item.itemId) ?? item.itemId} · {unplacedLabel(language, item.reason)}
                </Text>
              ))}
            </View>
          ) : null}

          <View style={styles.buttons}>
            <PhysicalPressable style={styles.secondary} contentStyle={styles.center} onPress={build}>
              <Text style={styles.secondaryText}>{tr(language, 'Пересчитать', 'Rebuild', '重新计算')}</Text>
            </PhysicalPressable>
            <PhysicalPressable style={styles.primary} contentStyle={styles.center} strong onPress={apply}>
              <Text style={styles.primaryText}>{tr(language, 'Применить', 'Apply', '应用')}</Text>
            </PhysicalPressable>
          </View>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderRadius: 20, borderWidth: 1, borderColor: '#3d3b33', backgroundColor: '#161612', padding: 13, marginBottom: 14 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headingCopy: { flex: 1, minWidth: 0 },
  kicker: { color: '#9c8b63', fontSize: 7.5, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#ece8dd', fontSize: 15, lineHeight: 19, fontWeight: '900', marginTop: 4 },
  body: { color: '#8c8980', fontSize: 8.5, lineHeight: 12, marginTop: 4 },
  action: { minHeight: 36, borderRadius: 11, borderWidth: 1, borderColor: '#665a40', paddingHorizontal: 8 },
  actionText: { color: '#d4ba80', fontSize: 8, fontWeight: '900' },
  truthBox: { borderRadius: 13, backgroundColor: '#211e16', padding: 9, marginTop: 10 },
  truthTitle: { color: '#d1b879', fontSize: 8, fontWeight: '900' },
  truthText: { color: '#92866e', fontSize: 8, lineHeight: 12, marginTop: 3 },
  proposal: { marginTop: 11 },
  metrics: { flexDirection: 'row', gap: 6 },
  metric: { flex: 1, borderRadius: 12, backgroundColor: '#201f1a', alignItems: 'center', paddingVertical: 8 },
  metricValue: { color: '#e0ca96', fontSize: 16, fontWeight: '900' },
  metricLabel: { color: '#7f796b', fontSize: 7, marginTop: 1 },
  group: { borderTopWidth: 1, borderTopColor: '#312f29', marginTop: 10, paddingTop: 8 },
  groupTitle: { color: '#77736a', fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  line: { color: '#cbc6b9', fontSize: 8.5, lineHeight: 13, marginTop: 4 },
  unplaced: { color: '#ad978c', fontSize: 8.5, lineHeight: 13, marginTop: 4 },
  buttons: { flexDirection: 'row', gap: 7, marginTop: 11 },
  secondary: { minHeight: 39, flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#4b4a43' },
  secondaryText: { color: '#9c9a92', fontSize: 8.5, fontWeight: '900' },
  primary: { minHeight: 39, flex: 1, borderRadius: 12, backgroundColor: '#d2b679' },
  primaryText: { color: '#17130d', fontSize: 8.5, fontWeight: '900' },
  error: { color: '#d49a91', fontSize: 8.5, lineHeight: 13, marginTop: 9 }
});
