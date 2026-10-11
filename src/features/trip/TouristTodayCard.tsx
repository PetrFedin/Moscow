import React, { useEffect, useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import { getUnseenDestinationNodes, type PersonalTrip } from '../../travel/personalTrip';
import { moscowVarvarkaDestinationPackage } from '../../travel/moscowDestinationPackage';
import { deriveTouristTodayState, minutesUntilItem, todayProgress } from '../../travel/touristToday';
import PhysicalPressable from '../../ui/PhysicalPressable';

type Props = {
  trip: PersonalTrip;
  language: AppLanguage;
  visitedIds: string[];
  onOpenPlace: (placeId: string) => void;
  onManageTrip: () => void;
};

function timeLabel(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(value));
}

function clockLabel(language: AppLanguage, iso: string) {
  const locale = language === 'ru' ? 'ru-RU' : language === 'zh' ? 'zh-CN' : 'en-GB';
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(iso));
}

function nodeTitle(language: AppLanguage, node: typeof moscowVarvarkaDestinationPackage.nodes[number]) {
  if (language === 'en') return node.titleEn ?? node.titleRu;
  if (language === 'zh') return node.titleZh ?? node.titleRu;
  return node.titleRu;
}

function countdownLabel(language: AppLanguage, minutes: number) {
  if (minutes < 60) {
    return tr(language, 'через ' + minutes + ' мин', 'in ' + minutes + ' min', minutes + '分钟后');
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return tr(
    language,
    'через ' + hours + ' ч ' + rest + ' мин',
    'in ' + hours + 'h ' + rest + 'm',
    hours + '小时' + rest + '分钟后'
  );
}

export default function TouristTodayCard({ trip, language, visitedIds, onOpenPlace, onManageTrip }: Props) {
  const [nowIso, setNowIso] = useState(() => new Date().toISOString());

  useEffect(() => {
    const timer = setInterval(() => setNowIso(new Date().toISOString()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const state = useMemo(() => deriveTouristTodayState({ trip, nowIso }), [nowIso, trip]);
  const progress = useMemo(() => todayProgress(state), [state]);
  const unseen = useMemo(
    () => getUnseenDestinationNodes({
      pkg: moscowVarvarkaDestinationPackage,
      trip,
      visitedDestinationNodeIds: visitedIds
    }).slice(0, 3),
    [trip, visitedIds]
  );

  if (!state.tripActive) {
    const nextTripDay = trip.days.find((day) => day > state.dayDate);
    const nextSavedTicket = trip.items
      .filter((item) => item.status === 'planned'
        && item.commitment?.status === 'confirmed'
        && item.plannedStartAt
        && Date.parse(item.plannedStartAt) > Date.parse(nowIso))
      .sort((a, b) => Date.parse(a.plannedStartAt!) - Date.parse(b.plannedStartAt!))[0];
    return (
      <View style={styles.root}>
        <View style={styles.heading}>
          <Text style={styles.kicker}>{tr(language, 'СЕГОДНЯ В МОСКВЕ', 'TODAY IN MOSCOW', '今天在莫斯科')}</Text>
          <Text style={styles.clock}>{clockLabel(language, nowIso)} MSK</Text>
        </View>
        <Text style={styles.title}>
          {nextTripDay
            ? tr(language, 'Поездка ещё впереди', 'Your trip is coming up', '行程尚未开始')
            : tr(language, 'Сегодня вне дат поездки', 'Today is outside this trip', '今天不在本次行程日期内')}
        </Text>
        <Text style={styles.body}>
          {nextTripDay
            ? tr(language, 'Следующий день поездки: ', 'Next trip day: ', '下一个行程日：') + nextTripDay
            : tr(language, 'История поездки сохранена — откройте нужный день ниже.', 'Your trip history is preserved — choose a day below.', '行程记录已保存，可在下方打开某一天。')}
        </Text>
        {nextSavedTicket && (
          <View style={styles.nextBlock}>
            <Text style={styles.eyebrow}>{tr(language, 'БЛИЖАЙШИЙ БИЛЕТ / БРОНЬ', 'UPCOMING TICKET / BOOKING', '即将到来的门票 / 预订')}</Text>
            <Text style={styles.nextTitle}>{nextSavedTicket.title}</Text>
            <Text style={styles.nextMeta}>{nextSavedTicket.dayDate} · {timeLabel(nextSavedTicket.plannedStartAt)}</Text>
            <Text style={styles.truth}>{nextSavedTicket.commitment?.verification === 'provider-confirmed'
              ? tr(language, 'Подтверждение провайдера записано', 'Provider receipt recorded', '已记录供应商凭证')
              : tr(language, 'Добавлено вами · статус провайдера не проверен', 'Added by you · provider status not verified', '由您添加 · 供应商状态未核验')}</Text>
          </View>
        )}
        <PhysicalPressable
          accessibilityRole="button"
          accessibilityLabel={tr(language, 'Управлять поездкой', 'Manage my trip', '管理我的行程')}
          style={styles.heroAction}
          contentStyle={styles.center}
          onPress={onManageTrip}
        ><Text style={styles.heroActionText}>{tr(language, 'Управлять поездкой', 'Manage my trip', '管理我的行程')} →</Text></PhysicalPressable>
      </View>
    );
  }

  const current = state.currentItems[0];
  const nextMinutes = minutesUntilItem(nowIso, state.nextCommitment);
  const freeWindow = state.currentFreeWindow ?? state.nextFreeWindow;

  return (
    <View style={styles.root}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.kicker}>{tr(language, 'СЕГОДНЯ В МОСКВЕ', 'TODAY IN MOSCOW', '今天在莫斯科')}</Text>
          <Text style={styles.clock}>{clockLabel(language, nowIso)} MSK · {state.dayDate}</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressValue}>{progress.completed}/{progress.total}</Text>
          <Text style={styles.progressLabel}>{tr(language, 'готово', 'done', '已完成')}</Text>
        </View>
      </View>

      {current ? (
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{tr(language, 'СЕЙЧАС ПО ПЛАНУ', 'NOW ON YOUR PLAN', '当前计划')}</Text>
          <Text style={styles.heroTitle}>{current.title}</Text>
          <Text style={styles.heroMeta}>
            {(timeLabel(current.plannedStartAt) ?? '') + '–' + (timeLabel(current.plannedEndAt) ?? '')}
          </Text>
          {current.destinationNodeId ? (
            <PhysicalPressable
              accessibilityRole="button"
              accessibilityLabel={tr(language, 'Открыть текущее место', 'Open current place', '打开当前地点')}
              style={styles.heroAction}
              contentStyle={styles.center}
              onPress={() => onOpenPlace(current.destinationNodeId!)}
            ><Text style={styles.heroActionText}>{tr(language, 'Открыть место', 'Explore this place', '查看地点')} →</Text></PhysicalPressable>
          ) : null}
          {current.commitment?.externalUrl ? (
            <PhysicalPressable
              style={styles.heroAction}
              contentStyle={styles.center}
              onPress={() => { void Linking.openURL(current.commitment!.externalUrl!); }}
            >
              <Text style={styles.heroActionText}>{tr(language, 'Открыть подтверждение', 'Open confirmation', '打开确认信息')}</Text>
            </PhysicalPressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.heroMuted}>
          <Text style={styles.eyebrow}>{tr(language, 'СЕЙЧАС', 'NOW', '现在')}</Text>
          <Text style={styles.heroMutedTitle}>
            {state.remainingItems.length > 0
              ? tr(language, 'Между пунктами плана', 'Between planned stops', '当前处于行程空档')
              : tr(language, 'План на сегодня выполнен', 'Today’s plan is complete', '今日计划已完成')}
          </Text>
        </View>
      )}

      {state.nextCommitment ? (
        <View style={styles.nextBlock}>
          <View style={styles.nextTop}>
            <Text style={styles.eyebrow}>{tr(language, 'СЛЕДУЮЩИЙ БИЛЕТ / БРОНЬ', 'NEXT TICKET / BOOKING', '下一张门票 / 预订')}</Text>
            {nextMinutes !== null && nextMinutes >= 0 ? (
              <Text style={styles.countdown}>{countdownLabel(language, nextMinutes)}</Text>
            ) : null}
          </View>
          <Text style={styles.nextTitle}>{state.nextCommitment.title}</Text>
          <Text style={styles.nextMeta}>
            {timeLabel(state.nextCommitment.plannedStartAt)}
            {state.nextCommitment.commitment?.provider ? ' · ' + state.nextCommitment.commitment.provider : ''}
          </Text>
          <Text style={styles.truth}>
            {state.nextCommitment.commitment?.verification === 'provider-confirmed'
              ? tr(language, 'Подтверждено провайдером', 'Provider confirmed', '供应商已确认')
              : tr(language, 'Добавлено вами · статус провайдера не проверен', 'Added by you · provider status not verified', '由你添加 · 供应商状态未核验')}
          </Text>
          {state.nextCommitment.commitment?.externalUrl ? (
            <PhysicalPressable
              style={styles.linkButton}
              contentStyle={styles.center}
              onPress={() => { void Linking.openURL(state.nextCommitment!.commitment!.externalUrl!); }}
            >
              <Text style={styles.linkButtonText}>{tr(language, 'Открыть билет / бронь', 'Open ticket / booking', '打开门票 / 预订')}</Text>
            </PhysicalPressable>
          ) : null}
        </View>
      ) : state.nextItem ? (
        <View style={styles.nextBlock}>
          <Text style={styles.eyebrow}>{tr(language, 'ДАЛЬШЕ', 'NEXT', '接下来')}</Text>
          <Text style={styles.nextTitle}>{state.nextItem.title}</Text>
          <Text style={styles.nextMeta}>
            {timeLabel(state.nextItem.plannedStartAt) ?? tr(language, 'без фиксированного времени', 'no fixed time', '无固定时间')}
          </Text>
          {state.nextItem.destinationNodeId ? (
            <PhysicalPressable
              accessibilityRole="button"
              accessibilityLabel={tr(language, 'Открыть следующий пункт', 'Open next stop', '打开下一站')}
              style={styles.linkButton}
              contentStyle={styles.center}
              onPress={() => onOpenPlace(state.nextItem!.destinationNodeId!)}
            ><Text style={styles.linkButtonText}>{tr(language, 'Открыть следующий пункт', 'Open next stop', '打开下一站')} →</Text></PhysicalPressable>
          ) : null}
        </View>
      ) : null}

      {freeWindow ? (
        <View style={styles.freeWindow}>
          <Text style={styles.freeTime}>
            {clockLabel(language, freeWindow.startsAt)}–{clockLabel(language, freeWindow.endsAt)}
          </Text>
          <Text style={styles.freeTitle}>
            {state.currentFreeWindow
              ? tr(language, 'Свободное окно сейчас', 'Free window now', '当前空闲时段')
              : tr(language, 'Следующее свободное окно', 'Next free window', '下一个空闲时段')}
          </Text>
          <Text style={styles.freeWarning}>
            {tr(
              language,
              freeWindow.minutes + ' мин по вашему расписанию · дорога и часы работы не проверены',
              freeWindow.minutes + ' min in your schedule · travel and opening hours are not verified',
              '按你的日程有' + freeWindow.minutes + '分钟 · 未核验交通与营业时间'
            )}
          </Text>
        </View>
      ) : null}

      {state.conflictCount > 0 ? (
        <View style={styles.warning}>
          <Text style={styles.warningText}>
            {tr(
              language,
              'В плане ' + state.conflictCount + ' конфликт времени — проверьте билеты и брони.',
              state.conflictCount + ' time conflict in your plan — check tickets and bookings.',
              '行程中有' + state.conflictCount + '处时间冲突，请检查门票和预订。'
            )}
          </Text>
        </View>
      ) : null}

      {state.visitsToday.length > 0 ? (
        <View style={styles.visited}>
          <Text style={styles.eyebrow}>{tr(language, 'УЖЕ СЕГОДНЯ', 'SEEN TODAY', '今日已到访')}</Text>
          {state.visitsToday.slice(-3).reverse().map((visit) => (
            <Text key={visit.id} style={styles.visitedText}>✓ {visit.title}</Text>
          ))}
        </View>
      ) : null}

      {unseen.length > 0 && freeWindow ? (
        <View style={styles.unseen}>
          <Text style={styles.eyebrow}>{tr(language, 'ЕЩЁ НЕ ВИДЕЛИ', 'STILL UNSEEN', '尚未到访')}</Text>
          <Text style={styles.unseenHint}>
            {tr(
              language,
              'Идеи для рассмотрения — без обещания, что вы успеете или что место открыто.',
              'Ideas to consider — without claiming you can reach them in time or that they are open.',
              '可供考虑的地点——不代表一定来得及到达，也不代表当前营业。'
            )}
          </Text>
          {unseen.map((node) => (
            <PhysicalPressable
              key={node.id}
              style={styles.unseenRow}
              contentStyle={styles.unseenContent}
              onPress={() => onOpenPlace(node.id)}
            >
              <Text style={styles.unseenTitle}>{nodeTitle(language, node)}</Text>
              <Text style={styles.unseenArrow}>→</Text>
            </PhysicalPressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderRadius: 25, borderWidth: 1, borderColor: '#576b58', backgroundColor: '#182c24', padding: 19, marginTop: 14, marginBottom: 16 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  headingCopy: { flex: 1, minWidth: 0 },
  kicker: { color: '#e2bd82', fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  clock: { color: '#c0cec5', fontSize: 12, marginTop: 6 },
  title: { color: '#fff4e3', fontSize: 23, fontWeight: '700', marginTop: 12 },
  body: { color: '#c1d0c5', fontSize: 13, lineHeight: 20, marginTop: 7 },
  progressBadge: { minWidth: 56, borderRadius: 13, backgroundColor: '#211d17', paddingVertical: 7, paddingHorizontal: 9, alignItems: 'center' },
  progressValue: { color: '#e2c488', fontSize: 15, fontWeight: '900' },
  progressLabel: { color: '#777168', fontSize: 7.5, marginTop: 1 },
  hero: { borderRadius: 19, backgroundColor: '#f4eee1', borderWidth: 1, borderColor: '#e8d9bd', padding: 17, marginTop: 15 },
  heroMuted: { borderRadius: 17, backgroundColor: '#1a1815', borderWidth: 1, borderColor: '#32302c', padding: 13, marginTop: 13 },
  eyebrow: { color: '#cda974', fontSize: 10, fontWeight: '700', letterSpacing: 0.85 },
  heroTitle: { color: '#25392d', fontSize: 22, fontWeight: '700', marginTop: 7, lineHeight: 28 },
  heroMeta: { color: '#516557', fontSize: 12, marginTop: 6 },
  heroMutedTitle: { color: '#bbb4a9', fontSize: 13, fontWeight: '800', marginTop: 5 },
  heroAction: { minHeight: 48, borderRadius: 12, backgroundColor: '#274437', marginTop: 13 },
  heroActionText: { color: '#fff8ed', fontSize: 14, fontWeight: '700' },
  nextBlock: { borderRadius: 17, borderWidth: 1, borderColor: '#506152', backgroundColor: '#26382e', padding: 15, marginTop: 12 },
  nextTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  countdown: { color: '#dfbd7c', fontSize: 8.5, fontWeight: '900' },
  nextTitle: { color: '#faf1dd', fontSize: 17, fontWeight: '700', marginTop: 7 },
  nextMeta: { color: '#c4d1c5', fontSize: 12, marginTop: 5 },
  truth: { color: '#e8cf9c', fontSize: 11, lineHeight: 17, marginTop: 8 },
  linkButton: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: '#8baa91', marginTop: 10 },
  linkButtonText: { color: '#e9d5aa', fontSize: 13, fontWeight: '700' },
  freeWindow: { borderRadius: 16, backgroundColor: '#161b1c', borderWidth: 1, borderColor: '#314043', padding: 12, marginTop: 9 },
  freeTime: { color: '#a9c7c1', fontSize: 13, fontWeight: '900' },
  freeTitle: { color: '#d8e3df', fontSize: 10, fontWeight: '800', marginTop: 2 },
  freeWarning: { color: '#758783', fontSize: 8.5, lineHeight: 12, marginTop: 4 },
  warning: { borderRadius: 13, borderWidth: 1, borderColor: '#6e4a43', backgroundColor: '#241816', padding: 10, marginTop: 9 },
  warningText: { color: '#d5a199', fontSize: 9, lineHeight: 13, fontWeight: '700' },
  visited: { borderTopWidth: 1, borderTopColor: '#2d2a25', marginTop: 12, paddingTop: 11 },
  visitedText: { color: '#aab8aa', fontSize: 9.5, marginTop: 5 },
  unseen: { borderTopWidth: 1, borderTopColor: '#2d2a25', marginTop: 12, paddingTop: 11 },
  unseenHint: { color: '#78746c', fontSize: 8.5, lineHeight: 12, marginTop: 4, marginBottom: 6 },
  unseenRow: { minHeight: 38, borderRadius: 11, backgroundColor: '#1b1916', marginTop: 5 },
  unseenContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  unseenTitle: { color: '#d5cec2', fontSize: 9.5, fontWeight: '800', flex: 1 },
  unseenArrow: { color: '#b99a62', fontSize: 13, fontWeight: '900' }
});
