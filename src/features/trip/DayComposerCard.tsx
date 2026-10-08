import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import type { DayComposerProjection } from '../../travel/dayComposer';
import PhysicalPressable from '../../ui/PhysicalPressable';

type AddPreset = 'place' | 'restaurant' | 'ticket' | 'reservation' | 'event';

function time(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Moscow'
  }).format(new Date(value));
}

function itemBadge(
  language: AppLanguage,
  value: 'fixed' | 'flexible' | 'ticketed' | 'reserved' | 'user-declared' | 'provider-confirmed'
) {
  const labels = {
    fixed: tr(language, 'FIXED', 'FIXED', '固定'),
    flexible: tr(language, 'FLEXIBLE', 'FLEXIBLE', '灵活'),
    ticketed: tr(language, 'БИЛЕТ', 'TICKETED', '门票'),
    reserved: tr(language, 'БРОНЬ', 'RESERVED', '预订'),
    'user-declared': tr(language, 'ДОБАВЛЕНО ВАМИ', 'USER DECLARED', '用户填写'),
    'provider-confirmed': tr(language, 'PROVIDER ✓', 'PROVIDER ✓', '供应商 ✓')
  } as const;
  return labels[value];
}

export default function DayComposerCard({
  projection,
  language,
  onAddPreset
}: {
  projection: DayComposerProjection;
  language: AppLanguage;
  onAddPreset: (preset: AddPreset) => void;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>DAY COMPOSER · V2</Text>
          <Text style={styles.title}>{tr(language, 'Ваш день как единая временная линия', 'Your day as one timeline', '统一时间轴')}</Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countValue}>{projection.items.length}</Text>
          <Text style={styles.countLabel}>{tr(language, 'пунктов', 'items', '项')}</Text>
        </View>
      </View>

      <View style={styles.statusGrid}>
        <Status label="FIXED" value={projection.counts.fixed} />
        <Status label="FLEX" value={projection.counts.flexible} />
        <Status label="TICKET" value={projection.counts.ticketed} />
        <Status label="RESERVE" value={projection.counts.reserved} />
        <Status label="FREE" value={projection.counts.free} />
        <Status label="TRAVEL" value={projection.counts.travel} />
        <Status label="CONFLICT" value={projection.counts.conflict} alert={projection.counts.conflict > 0} />
      </View>

      <View style={styles.timeline}>
        {projection.timeline.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{tr(language, 'День полностью свободен', 'The day is completely open', '全天空闲')}</Text>
            <Text style={styles.emptyBody}>{tr(language, 'Добавьте первую точку, билет, бронь или событие.', 'Add a first place, ticket, reservation or event.', '添加地点、门票、预订或活动。')}</Text>
          </View>
        ) : projection.timeline.map((entry) => {
          if (entry.type === 'conflict') {
            const left = projection.items.find((item) => item.itemId === entry.itemIds[0]);
            const right = projection.items.find((item) => item.itemId === entry.itemIds[1]);
            return (
              <View key={entry.id} style={[styles.row, styles.conflict]}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeText}>{time(entry.startsAt)}</Text>
                  <Text style={styles.timeDash}>↓</Text>
                  <Text style={styles.timeText}>{time(entry.endsAt)}</Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.conflictTitle}>{tr(language, 'КОНФЛИКТ ВРЕМЕНИ', 'TIME CONFLICT', '时间冲突')}</Text>
                  <Text style={styles.conflictNames}>
                    {left?.title ?? entry.itemIds[0]} ↔ {right?.title ?? entry.itemIds[1]}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {entry.minutes} {tr(language, 'мин пересечения', 'min overlap', '分钟重叠')}
                  </Text>
                </View>
              </View>
            );
          }

          if (entry.type === 'free') {
            return (
              <View key={entry.id} style={[styles.row, styles.free]}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeText}>{time(entry.startsAt)}</Text>
                  <Text style={styles.timeDash}>↓</Text>
                  <Text style={styles.timeText}>{time(entry.endsAt)}</Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.freeTitle}>{tr(language, 'Свободное окно', 'Free window', '空闲时段')} · {entry.minutes} {tr(language, 'мин', 'min', '分钟')}</Text>
                  <Text style={styles.rowMeta}>
                    {tr(language, 'Можно подобрать альтернативу · дорога и часы работы пока не подтверждены', 'Alternative slot · travel and opening hours not verified', '可寻找替代方案 · 交通与营业时间尚未核验')}
                  </Text>
                </View>
              </View>
            );
          }

          if (entry.type === 'travel') {
            const statusLabel = entry.status === 'safe'
              ? 'SAFE'
              : entry.status === 'tight'
                ? 'TIGHT'
                : entry.status === 'impossible'
                  ? 'IMPOSSIBLE'
                  : 'UNKNOWN';
            return (
              <View
                key={entry.id}
                style={[
                  styles.row,
                  styles.travel,
                  entry.status === 'tight' && styles.travelTight,
                  entry.status === 'impossible' && styles.travelImpossible
                ]}
              >
                <View style={styles.timeCol}>
                  <Text style={styles.timeText}>{time(entry.startsAt)}</Text>
                  <Text style={styles.timeDash}>↓</Text>
                  <Text style={styles.timeText}>{time(entry.mustArriveBy)}</Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.travelTitle}>
                    {entry.routingVerified && entry.requiredTravelMinutes !== undefined && entry.mode
                      ? `TRAVEL · ${entry.requiredTravelMinutes} ${tr(language, 'мин', 'min', '分钟')} · ${entry.mode.toUpperCase()}`
                      : `TRAVEL · ${statusLabel}`}
                  </Text>
                  <Text style={styles.travelStatus}>{statusLabel}</Text>
                  <Text style={styles.rowMeta}>
                    {entry.routingVerified && entry.requiredTravelMinutes !== undefined
                      ? tr(
                          language,
                          `Подтверждено источником · buffer ${entry.bufferMinutes ?? 0} мин`,
                          `Source-backed · ${entry.bufferMinutes ?? 0} min buffer`,
                          `来源已验证 · 余量 ${entry.bufferMinutes ?? 0} 分钟`
                        )
                      : tr(
                          language,
                          'Время в пути не подтверждено',
                          'Travel time is not verified',
                          '行程时间尚未核验'
                        )}
                  </Text>
                  {entry.evidenceMode === 'historical-evidence-replay' ? (
                    <>
                      <Text style={styles.replayBadge}>EVIDENCE REPLAY · SOURCE-BACKED · NOT LIVE</Text>
                      <Text style={styles.rowMeta}>
                        {entry.providerName ?? entry.providerId ?? 'routing provider'}
                        {entry.observedAt ? ` · ${entry.observedAt}` : ''}
                      </Text>
                    </>
                  ) : null}
                </View>
              </View>
            );
          }

          return (
            <View key={entry.id} style={styles.row}>
              <View style={styles.timeCol}>
                <Text style={styles.timeText}>{entry.startsAt ? time(entry.startsAt) : '—'}</Text>
                {entry.endsAt ? <Text style={styles.timeEnd}>{time(entry.endsAt)}</Text> : null}
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.itemTitle}>{entry.title}</Text>
                <View style={styles.badges}>
                  <Badge text={itemBadge(language, entry.flexibility)} />
                  {entry.commitment !== 'none' && <Badge text={itemBadge(language, entry.commitment)} strong />}
                  {entry.verification !== 'none' && <Badge text={itemBadge(language, entry.verification)} />}
                </View>
                <Text style={styles.rowMeta}>
                  {entry.state.toUpperCase()} · {entry.kind}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>{tr(language, 'БЫСТРО ДОБАВИТЬ', 'QUICK ADD', '快速添加')}</Text>
      <View style={styles.quickAdd}>
        {([
          ['place', tr(language, 'Место', 'Place', '地点')],
          ['restaurant', tr(language, 'Ресторан', 'Restaurant', '餐厅')],
          ['ticket', tr(language, 'Билет', 'Ticket', '门票')],
          ['reservation', tr(language, 'Бронь', 'Reservation', '预订')],
          ['event', tr(language, 'Событие', 'Event', '活动')]
        ] as const).map(([preset, label]) => (
          <PhysicalPressable
            key={preset}
            style={styles.quickButton}
            contentStyle={styles.center}
            onPress={() => onAddPreset(preset)}
            accessibilityLabel={label}
          >
            <Text style={styles.quickText}>+ {label}</Text>
          </PhysicalPressable>
        ))}
      </View>

      {projection.alternativeSlots.length > 0 && (
        <View style={styles.alternativeBox}>
          <Text style={styles.alternativeTitle}>{tr(language, 'ALTERNATIVE SLOTS', 'ALTERNATIVE SLOTS', '替代时段')}</Text>
          <Text style={styles.alternativeBody}>
            {tr(
              language,
              `${projection.alternativeSlots.length} свободных окон можно использовать для альтернатив. Пока это только временные окна — без выдуманных travel time, opening hours или availability.`,
              `${projection.alternativeSlots.length} free windows can accept alternatives. They are time slots only: no fabricated travel time, opening hours or availability.`,
              `${projection.alternativeSlots.length} 个空闲时段可用于替代方案；目前仅代表时间窗口，不推测交通、营业时间或可用性。`
            )}
          </Text>
        </View>
      )}
    </View>
  );
}

function Status({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <View style={[styles.status, alert && styles.statusAlert]}>
      <Text style={[styles.statusValue, alert && styles.statusValueAlert]}>{value}</Text>
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  );
}

function Badge({ text, strong }: { text: string; strong?: boolean }) {
  return (
    <View style={[styles.badge, strong && styles.badgeStrong]}>
      <Text style={[styles.badgeText, strong && styles.badgeTextStrong]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: 16,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#393f47',
    backgroundColor: '#0c1014'
  },
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  headerCopy: { flex: 1 },
  kicker: { color: '#bd9c66', fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#f6f0e7', fontSize: 18, lineHeight: 23, fontWeight: '900', marginTop: 5 },
  countPill: { minWidth: 54, borderRadius: 15, padding: 8, backgroundColor: '#181d22', alignItems: 'center' },
  countValue: { color: '#e7c98f', fontSize: 18, fontWeight: '900' },
  countLabel: { color: '#7f8790', fontSize: 7, marginTop: 1 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 13 },
  status: { minWidth: 70, flexGrow: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 9, backgroundColor: '#15191e', borderWidth: 1, borderColor: '#292f36' },
  statusAlert: { borderColor: '#744d46', backgroundColor: '#201514' },
  statusValue: { color: '#d9dce0', fontSize: 15, fontWeight: '900' },
  statusValueAlert: { color: '#e8a79c' },
  statusLabel: { color: '#69717a', fontSize: 7, fontWeight: '900', marginTop: 2 },
  timeline: { marginTop: 15, gap: 7 },
  row: { flexDirection: 'row', borderRadius: 15, borderWidth: 1, borderColor: '#252c33', backgroundColor: '#12171c', padding: 11 },
  free: { borderStyle: 'dashed', backgroundColor: '#10161a' },
  conflict: { borderColor: '#714940', backgroundColor: '#1e1312' },
  travel: { borderColor: '#30404a', backgroundColor: '#10171b' },
  travelTight: { borderColor: '#6f6544', backgroundColor: '#1c1a12' },
  travelImpossible: { borderColor: '#74443f', backgroundColor: '#211312' },
  timeCol: { width: 52, paddingRight: 8, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: '#343b42' },
  timeText: { color: '#e6c98f', fontSize: 10, fontWeight: '900' },
  timeEnd: { color: '#737b84', fontSize: 9, marginTop: 4 },
  timeDash: { color: '#575f68', fontSize: 9, lineHeight: 10 },
  rowBody: { flex: 1, paddingLeft: 10 },
  itemTitle: { color: '#f0ece5', fontSize: 13, lineHeight: 17, fontWeight: '900' },
  freeTitle: { color: '#c8d0d5', fontSize: 11, fontWeight: '900' },
  conflictTitle: { color: '#e4a197', fontSize: 10, fontWeight: '900' },
  conflictNames: { color: '#d6c1bc', fontSize: 9, lineHeight: 13, marginTop: 3, fontWeight: '800' },
  travelTitle: { color: '#a9bac3', fontSize: 10, fontWeight: '900' },
  travelStatus: { color: '#d6c08f', fontSize: 7, fontWeight: '900', marginTop: 4, letterSpacing: 0.8 },
  replayBadge: { color: '#d0aa73', fontSize: 7, fontWeight: '900', marginTop: 5, letterSpacing: 0.7 },
  rowMeta: { color: '#777f88', fontSize: 8, lineHeight: 12, marginTop: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  badge: { borderRadius: 7, borderWidth: 1, borderColor: '#3b424a', paddingHorizontal: 6, paddingVertical: 3 },
  badgeStrong: { backgroundColor: '#d7bb84', borderColor: '#d7bb84' },
  badgeText: { color: '#9098a0', fontSize: 6, fontWeight: '900' },
  badgeTextStrong: { color: '#17130d' },
  empty: { borderRadius: 15, padding: 14, backgroundColor: '#12171c' },
  emptyTitle: { color: '#e8e2d8', fontSize: 12, fontWeight: '900' },
  emptyBody: { color: '#7f8790', fontSize: 9, lineHeight: 14, marginTop: 4 },
  sectionLabel: { color: '#737b84', fontSize: 7, fontWeight: '900', letterSpacing: 1, marginTop: 15, marginBottom: 7 },
  quickAdd: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  quickButton: { minHeight: 36, borderRadius: 11, borderWidth: 1, borderColor: '#3a4149', flexGrow: 1 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  quickText: { color: '#d6c08f', fontSize: 8, fontWeight: '900' },
  alternativeBox: { marginTop: 13, borderRadius: 13, padding: 11, backgroundColor: '#131820', borderWidth: 1, borderColor: '#29313b' },
  alternativeTitle: { color: '#9aa5af', fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  alternativeBody: { color: '#737d87', fontSize: 8, lineHeight: 13, marginTop: 4 }
});
