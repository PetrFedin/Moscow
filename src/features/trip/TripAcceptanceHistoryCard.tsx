import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import type { PersonalTrip, PersonalTripItem } from '../../travel/personalTrip';
import PhysicalPressable from '../../ui/PhysicalPressable';

function time(value: string | undefined) {
  if (!value || !Number.isFinite(Date.parse(value))) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(value));
}

function reasonLabel(language: AppLanguage, reason: string | undefined) {
  if (reason === 'closed') return tr(language, 'место закрыто', 'place closed', '地点关闭');
  if (reason === 'cancelled') return tr(language, 'событие отменено', 'event cancelled', '活动取消');
  if (reason === 'rescheduled') return tr(language, 'время изменилось', 'time changed', '时间已更改');
  if (reason === 'stale') return tr(language, 'данные устарели', 'source data expired', '数据已过期');
  return tr(language, 'вы приняли замену', 'you accepted a replacement', '您已接受替换');
}

function nextScheduled(trip: PersonalTrip, item: PersonalTripItem | undefined, after: string) {
  if (!item) return undefined;
  return trip.items
    .filter((candidate) =>
      candidate.id !== item.id
      && candidate.dayDate === item.dayDate
      && candidate.status === 'planned'
      && candidate.plannedStartAt
      && Date.parse(candidate.plannedStartAt) >= Date.parse(after)
    )
    .sort((a, b) => Date.parse(a.plannedStartAt!) - Date.parse(b.plannedStartAt!))[0];
}

export default function TripAcceptanceHistoryCard({
  trip,
  language
}: {
  trip: PersonalTrip;
  language: AppLanguage;
}) {
  const receipts = trip.replacementReceipts ?? [];
  if (!receipts.length) return null;

  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>{tr(language, 'РЕШЕНИЯ ПО ПОЕЗДКЕ', 'YOUR TRIP DECISIONS', '行程决定')}</Text>
      <Text style={styles.title}>{tr(language, 'История изменений маршрута', 'Itinerary change history', '行程变更记录')}</Text>
      <Text style={styles.intro}>
        {tr(
          language,
          'Здесь сохранены ваши решения: что заменили, когда и на основании какого источника. Билеты не переписываются автоматически.',
          'Your accepted changes, their source and time are recorded here. Fixed tickets are never moved automatically.',
          '这里记录已接受的变更、来源和时间。固定门票不会自动更改。'
        )}
      </Text>
      {[...receipts].reverse().map((receipt) => {
        const affected = trip.items.find((item) => item.id === receipt.affectedItemId);
        const next = nextScheduled(trip, affected, receipt.after.plannedEndAt);
        const nextTicket = trip.items
          .filter((item) =>
            item.id !== receipt.affectedItemId
            && item.status === 'planned'
            && item.commitment?.status === 'confirmed'
            && item.plannedStartAt
            && Date.parse(item.plannedStartAt) >= Date.parse(receipt.after.plannedEndAt)
          )
          .sort((a, b) => Date.parse(a.plannedStartAt!) - Date.parse(b.plannedStartAt!))[0];
        return (
          <View key={receipt.proposalId} style={styles.card}>
            <Text style={styles.time}>{tr(language, 'Принято', 'Accepted', '已接受')}: {new Date(receipt.acceptedAt).toLocaleString(language === 'ru' ? 'ru-RU' : language === 'zh' ? 'zh-CN' : 'en-GB', { timeZone: 'Europe/Moscow', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
            <Text style={styles.from}>{receipt.before.title}</Text>
            <Text style={styles.arrow}>↓ {tr(language, 'заменено на', 'replaced with', '已替换为')}</Text>
            <Text style={styles.to}>{receipt.after.title}</Text>
            <Text style={styles.reason}>{tr(language, 'Причина', 'Reason', '原因')}: {reasonLabel(language, receipt.disruptionReason)}</Text>
            <Text style={styles.source}>{tr(language, 'Источник', 'Source', '来源')}: {receipt.sourceProviderName ?? receipt.sourceEvidenceRef}</Text>
            {receipt.sourceUrl && /^https:\/\//i.test(receipt.sourceUrl) && (
              <PhysicalPressable
                accessibilityRole="button"
                accessibilityLabel={tr(language, 'Открыть источник изменения', 'Open change source', '打开变更来源')}
                style={styles.link}
                contentStyle={styles.linkContent}
                onPress={() => { void Linking.openURL(receipt.sourceUrl!).catch(() => undefined); }}
              >
                <Text style={styles.linkText}>{tr(language, 'Проверить источник', 'View source', '查看来源')} ↗</Text>
              </PhysicalPressable>
            )}
            {next && (
              <Text style={styles.next}>
                {tr(language, 'Следующий пункт маршрута', 'Next itinerary stop', '下一站')}: {time(next.plannedStartAt)} · {next.title}
              </Text>
            )}
            {nextTicket && (
              <Text style={styles.fixed}>
                {tr(language, 'Следующий билет или бронь', 'Next ticket or booking', '下一张门票或预订')}: {time(nextTicket.plannedStartAt)} · {nextTicket.title}
              </Text>
            )}
            <Text style={styles.proof}>
              {tr(
                language,
                'При принятии замены фиксированные обязательства были сохранены. Это локальная история, а не подтверждение от поставщика.',
                'Fixed commitments were preserved when accepted. This local record is not provider confirmation.',
                '接受替换时已保留固定安排。这是本地记录，并非供应商确认。'
              )}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 6, marginBottom: 20 },
  eyebrow: { color: '#d9b783', fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  title: { marginTop: 7, color: '#f6efdf', fontSize: 21, fontWeight: '700' },
  intro: { color: '#a8b6ad', fontSize: 12, lineHeight: 19, marginTop: 8, marginBottom: 13 },
  card: { backgroundColor: '#1b2a24', borderWidth: 1, borderColor: '#456352', borderRadius: 18, padding: 16, marginBottom: 10, gap: 7 },
  time: { color: '#a5bead', fontSize: 11 },
  from: { color: '#aeb8b1', fontSize: 13 },
  arrow: { color: '#d1b98d', fontSize: 11 },
  to: { color: '#f8edd8', fontSize: 19, fontWeight: '700', lineHeight: 25 },
  reason: { color: '#d6ded6', fontSize: 12 },
  source: { color: '#bdcbbf', fontSize: 11, lineHeight: 17 },
  link: { alignSelf: 'flex-start', borderWidth: 1, borderColor: '#577a62', borderRadius: 11, marginTop: 4 },
  linkContent: { paddingHorizontal: 13, paddingVertical: 10 },
  linkText: { color: '#e8ce96', fontSize: 12, fontWeight: '700' },
  next: { color: '#e5e9d9', backgroundColor: '#2a3d32', padding: 11, borderRadius: 11, fontSize: 12, lineHeight: 18, marginTop: 4 },
  fixed: { color: '#f5d59f', backgroundColor: '#34382b', padding: 11, borderRadius: 11, fontSize: 12, lineHeight: 18 },
  proof: { color: '#8ea398', fontSize: 10, lineHeight: 15, marginTop: 4 }
});
