import React, { useEffect, useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import { getUnseenDestinationNodes, type PersonalTrip } from '../../travel/personalTrip';
import { moscowVarvarkaDestinationPackage } from '../../travel/moscowDestinationPackage';
import { deriveTouristTodayState, minutesUntilItem, todayProgress } from '../../travel/touristToday';
import PhysicalPressable from '../../ui/PhysicalPressable';
import { useMoscowTheme } from '../../theme/MoscowTheme';

type Props = {
  trip: PersonalTrip;
  language: AppLanguage;
  visitedIds: string[];
  onOpenPlace: (placeId: string) => void;
  showLegacyUnseen?: boolean;
};

function timeLabel(value?: string) {
  if (!value) return null;
  const match = /T(\d{2}:\d{2})/.exec(value);
  return match?.[1] ?? null;
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

export default function TouristTodayCard({ trip, language, visitedIds, onOpenPlace, showLegacyUnseen = true }: Props) {
  const { palette } = useMoscowTheme();
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
    return (
      <View style={[styles.root,{backgroundColor:palette.surface,borderColor:palette.border}]}>
        <View style={styles.heading}>
          <Text style={[styles.kicker,{color:palette.accentStrong}]}>{tr(language, 'СЕГОДНЯ В МОСКВЕ', 'TODAY IN MOSCOW', '今天在莫斯科')}</Text>
          <Text style={[styles.clock,{color:palette.textSoft}]}>{clockLabel(language, nowIso)} MSK</Text>
        </View>
        <Text style={[styles.title,{color:palette.text}]}>
          {nextTripDay
            ? tr(language, 'План ещё впереди', 'Your plan starts later', '计划尚未开始')
            : tr(language, 'Сегодня вне дат плана', 'Today is outside this plan', '今天不在当前计划日期内')}
        </Text>
        <Text style={[styles.body,{color:palette.textMuted}]}>
          {nextTripDay
            ? tr(language, 'Следующий день плана: ', 'Next plan day: ', '下一个计划日：') + nextTripDay
            : tr(language, 'История Москвы сохранена — откройте нужный день плана.', 'Your Moscow history is preserved — open any plan day.', '莫斯科历史记录已保存，可打开任意计划日期。')}
        </Text>
      </View>
    );
  }

  const current = state.currentItems[0];
  const nextMinutes = minutesUntilItem(nowIso, state.nextCommitment);
  const freeWindow = state.currentFreeWindow ?? state.nextFreeWindow;

  return (
    <View style={[styles.root,{backgroundColor:palette.surface,borderColor:palette.border}]}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={[styles.kicker,{color:palette.accentStrong}]}>{tr(language, 'СЕГОДНЯ В МОСКВЕ', 'TODAY IN MOSCOW', '今天在莫斯科')}</Text>
          <Text style={[styles.clock,{color:palette.textSoft}]}>{clockLabel(language, nowIso)} MSK · {state.dayDate}</Text>
        </View>
        <View style={[styles.progressBadge,{backgroundColor:palette.surfaceSoft}]}>
          <Text style={[styles.progressValue,{color:palette.accentStrong}]}>{progress.completed}/{progress.total}</Text>
          <Text style={[styles.progressLabel,{color:palette.textSoft}]}>{tr(language, 'готово', 'done', '已完成')}</Text>
        </View>
      </View>

      {current ? (
        <View style={[styles.hero,{backgroundColor:palette.surfaceRaised,borderColor:palette.borderStrong}]}>
          <Text style={[styles.eyebrow,{color:palette.accentStrong}]}>{tr(language, 'СЕЙЧАС ПО ПЛАНУ', 'NOW ON YOUR PLAN', '当前计划')}</Text>
          <Text style={[styles.heroTitle,{color:palette.text}]}>{current.title}</Text>
          <Text style={[styles.heroMeta,{color:palette.textMuted}]}>
            {(timeLabel(current.plannedStartAt) ?? '') + '–' + (timeLabel(current.plannedEndAt) ?? '')}
          </Text>
          {current.commitment?.externalUrl ? (
            <PhysicalPressable
              style={[styles.heroAction,{backgroundColor:palette.accent}]}
              contentStyle={styles.center}
              onPress={() => { void Linking.openURL(current.commitment!.externalUrl!); }}
            >
              <Text style={[styles.heroActionText,{color:palette.accentText}]}>{tr(language, 'Открыть подтверждение', 'Open confirmation', '打开确认信息')}</Text>
            </PhysicalPressable>
          ) : null}
        </View>
      ) : (
        <View style={[styles.heroMuted,{backgroundColor:palette.surfaceSoft,borderColor:palette.border}]}>
          <Text style={[styles.eyebrow,{color:palette.accentStrong}]}>{tr(language, 'СЕЙЧАС', 'NOW', '现在')}</Text>
          <Text style={[styles.heroMutedTitle,{color:palette.textMuted}]}>
            {state.remainingItems.length > 0
              ? tr(language, 'Между пунктами плана', 'Between planned stops', '当前处于行程空档')
              : tr(language, 'План на сегодня выполнен', 'Today’s plan is complete', '今日计划已完成')}
          </Text>
        </View>
      )}

      {state.nextCommitment ? (
        <View style={[styles.nextBlock,{backgroundColor:palette.surfaceRaised,borderColor:palette.border}]}>
          <View style={styles.nextTop}>
            <Text style={[styles.eyebrow,{color:palette.accentStrong}]}>{tr(language, 'СЛЕДУЮЩИЙ БИЛЕТ / БРОНЬ', 'NEXT TICKET / BOOKING', '下一张门票 / 预订')}</Text>
            {nextMinutes !== null && nextMinutes >= 0 ? (
              <Text style={[styles.countdown,{color:palette.accentStrong}]}>{countdownLabel(language, nextMinutes)}</Text>
            ) : null}
          </View>
          <Text style={[styles.nextTitle,{color:palette.text}]}>{state.nextCommitment.title}</Text>
          <Text style={[styles.nextMeta,{color:palette.textMuted}]}>
            {timeLabel(state.nextCommitment.plannedStartAt)}
            {state.nextCommitment.commitment?.provider ? ' · ' + state.nextCommitment.commitment.provider : ''}
          </Text>
          <Text style={[styles.truth,{color:palette.accentStrong}]}>
            {state.nextCommitment.commitment?.verification === 'provider-confirmed'
              ? tr(language, 'Подтверждено провайдером', 'Provider confirmed', '供应商已确认')
              : tr(language, 'Добавлено вами · статус провайдера не проверен', 'Added by you · provider status not verified', '由你添加 · 供应商状态未核验')}
          </Text>
          {state.nextCommitment.commitment?.externalUrl ? (
            <PhysicalPressable
              style={[styles.linkButton,{borderColor:palette.borderStrong}]}
              contentStyle={styles.center}
              onPress={() => { void Linking.openURL(state.nextCommitment!.commitment!.externalUrl!); }}
            >
              <Text style={[styles.linkButtonText,{color:palette.accentStrong}]}>{tr(language, 'Открыть билет / бронь', 'Open ticket / booking', '打开门票 / 预订')}</Text>
            </PhysicalPressable>
          ) : null}
        </View>
      ) : state.nextItem ? (
        <View style={[styles.nextBlock,{backgroundColor:palette.surfaceRaised,borderColor:palette.border}]}>
          <Text style={[styles.eyebrow,{color:palette.accentStrong}]}>{tr(language, 'ДАЛЬШЕ', 'NEXT', '接下来')}</Text>
          <Text style={[styles.nextTitle,{color:palette.text}]}>{state.nextItem.title}</Text>
          <Text style={[styles.nextMeta,{color:palette.textMuted}]}>
            {timeLabel(state.nextItem.plannedStartAt) ?? tr(language, 'без фиксированного времени', 'no fixed time', '无固定时间')}
          </Text>
        </View>
      ) : null}

      {freeWindow ? (
        <View style={[styles.freeWindow,{backgroundColor:palette.surfaceSoft,borderColor:palette.border}]}>
          <Text style={[styles.freeTime,{color:palette.positive}]}>
            {clockLabel(language, freeWindow.startsAt)}–{clockLabel(language, freeWindow.endsAt)}
          </Text>
          <Text style={[styles.freeTitle,{color:palette.text}]}>
            {state.currentFreeWindow
              ? tr(language, 'Свободное окно сейчас', 'Free window now', '当前空闲时段')
              : tr(language, 'Следующее свободное окно', 'Next free window', '下一个空闲时段')}
          </Text>
          <Text style={[styles.freeWarning,{color:palette.textSoft}]}>
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
        <View style={[styles.warning,{backgroundColor:palette.surfaceSoft,borderColor:palette.danger}]}>
          <Text style={[styles.warningText,{color:palette.danger}]}>
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
        <View style={[styles.visited,{borderTopColor:palette.border}]}>
          <Text style={[styles.eyebrow,{color:palette.accentStrong}]}>{tr(language, 'УЖЕ СЕГОДНЯ', 'SEEN TODAY', '今日已到访')}</Text>
          {state.visitsToday.slice(-3).reverse().map((visit) => (
            <Text key={visit.id} style={[styles.visitedText,{color:palette.positive}]}>✓ {visit.title}</Text>
          ))}
        </View>
      ) : null}

      {showLegacyUnseen && unseen.length > 0 && freeWindow ? (
        <View style={[styles.unseen,{borderTopColor:palette.border}]}>
          <Text style={[styles.eyebrow,{color:palette.accentStrong}]}>{tr(language, 'ЕЩЁ НЕ ВИДЕЛИ', 'STILL UNSEEN', '尚未到访')}</Text>
          <Text style={[styles.unseenHint,{color:palette.textSoft}]}>
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
              style={[styles.unseenRow,{backgroundColor:palette.surfaceSoft}]}
              contentStyle={styles.unseenContent}
              onPress={() => onOpenPlace(node.id)}
            >
              <Text style={[styles.unseenTitle,{color:palette.text}]}>{nodeTitle(language, node)}</Text>
              <Text style={[styles.unseenArrow,{color:palette.accentStrong}]}>→</Text>
            </PhysicalPressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderRadius: 22, borderWidth: 1, borderColor: '#4a4030', backgroundColor: '#15120e', padding: 14, marginBottom: 16 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  headingCopy: { flex: 1, minWidth: 0 },
  kicker: { color: '#d0ad6d', fontSize: 8.5, fontWeight: '900', letterSpacing: 1.25 },
  clock: { color: '#7f796e', fontSize: 8.5, marginTop: 4 },
  title: { color: '#f5ede0', fontSize: 18, fontWeight: '900', marginTop: 12 },
  body: { color: '#9e978c', fontSize: 10, lineHeight: 15, marginTop: 5 },
  progressBadge: { minWidth: 56, borderRadius: 13, backgroundColor: '#211d17', paddingVertical: 7, paddingHorizontal: 9, alignItems: 'center' },
  progressValue: { color: '#e2c488', fontSize: 15, fontWeight: '900' },
  progressLabel: { color: '#777168', fontSize: 7.5, marginTop: 1 },
  hero: { borderRadius: 17, backgroundColor: '#231d14', borderWidth: 1, borderColor: '#685334', padding: 13, marginTop: 13 },
  heroMuted: { borderRadius: 17, backgroundColor: '#1a1815', borderWidth: 1, borderColor: '#32302c', padding: 13, marginTop: 13 },
  eyebrow: { color: '#927f5d', fontSize: 7.5, fontWeight: '900', letterSpacing: 1.05 },
  heroTitle: { color: '#fff3dc', fontSize: 17, fontWeight: '900', marginTop: 5 },
  heroMeta: { color: '#c0a978', fontSize: 9.5, marginTop: 4 },
  heroMutedTitle: { color: '#bbb4a9', fontSize: 13, fontWeight: '800', marginTop: 5 },
  heroAction: { minHeight: 38, borderRadius: 12, backgroundColor: '#d4b77e', marginTop: 10 },
  heroActionText: { color: '#17130d', fontSize: 9, fontWeight: '900' },
  nextBlock: { borderRadius: 16, borderWidth: 1, borderColor: '#34322f', backgroundColor: '#191816', padding: 12, marginTop: 9 },
  nextTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  countdown: { color: '#dfbd7c', fontSize: 8.5, fontWeight: '900' },
  nextTitle: { color: '#eee7dc', fontSize: 14, fontWeight: '900', marginTop: 5 },
  nextMeta: { color: '#9d9589', fontSize: 9, marginTop: 3 },
  truth: { color: '#ad8d58', fontSize: 8.5, lineHeight: 12, marginTop: 5 },
  linkButton: { minHeight: 36, borderRadius: 11, borderWidth: 1, borderColor: '#5c4d35', marginTop: 8 },
  linkButtonText: { color: '#d7bb84', fontSize: 8.5, fontWeight: '900' },
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
