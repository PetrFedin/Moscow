import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import { personalTripDayItems, type PersonalTrip, type PersonalTripItem } from '../../travel/personalTrip';
import PhysicalPressable from '../../ui/PhysicalPressable';
import { formatDestinationTime, requireAdmittedDestination } from '../../product/travelProductIdentity';
import { dayStopPresentation, displayedUpcomingCommitments, countsAsScheduledOccupancy, isActivePlannedTripStop, type DayStopPresentation } from '../../travel/tripDayPresentation';

function symbol(item: PersonalTripItem) {
  if (item.commitment?.kind === 'ticket') return '♫';
  if (item.commitment?.kind === 'reservation') return '◈';
  if (['food', 'restaurant', 'cafe', 'bar'].includes(item.kind)) return '☕';
  if (['museum', 'gallery', 'exhibition'].includes(item.kind)) return '◇';
  return '⌖';
}
function stopStatusLabel(language: AppLanguage, state: DayStopPresentation): string {
  switch (state) {
    case 'cancelled': return tr(language, 'Отменено — запись сохранена', 'Cancelled — record retained', '已取消，保留记录');
    case 'skipped': return tr(language, 'Пропущено в плане', 'Skipped in itinerary', '已跳过');
    case 'visit-recorded': return tr(language, 'Вы отметили посещение', 'Marked as visited by you', '由您标记到访');
    case 'completed-in-plan': return tr(language, 'Отмечено выполненным в плане — не проверено по месту',
      'Marked complete in plan — attendance not verified', '计划标为完成，未验证到场');
    case 'provider-confirmation-recorded': return tr(language,
      'В записи указано подтверждение поставщика — здесь не перепроверено',
      'Provider confirmation recorded — not reverified here', '记录标注供应商确认，本页未复核');
    case 'user-declared-confirmation': return tr(language,
      'Билет или бронь добавлены вами — поставщик не проверен',
      'Ticket or booking added by you — provider not verified', '由您添加门票或预订，供应商未验证');
    case 'reservation-held': return tr(language,
      'Предварительное удержание — окончательное подтверждение не проверено',
      'Held provisionally — final confirmation not verified', '暂时保留，未验证最终确认');
    case 'planned': return tr(language, 'В вашем плане, не бронь', 'Planned stop, not a booking', '计划地点，并非预订');
  }
}

export default function TripJourneyOverview({ trip, dayDate, language, onVisit, onOpenDetails }: {
  trip: PersonalTrip; dayDate: string; language: AppLanguage; onVisit: (id: string) => void; onOpenDetails: () => void;
}) {
  // The pilot is still Moscow; other cities must pass admission rather than
  // inherit Europe/Moscow timezone or Moscow-only content accidentally.
  const destination = requireAdmittedDestination(trip.destinationId);
  const localTime = (iso?: string) => formatDestinationTime(iso, trip.destinationId);
  const items = personalTripDayItems(trip, dayDate);
  const visited = new Set(trip.visits.filter(v => v.dayDate === dayDate).map(v => v.itemId));
  const next = items.find(item => isActivePlannedTripStop(item) && !visited.has(item.id));
  const bookings = displayedUpcomingCommitments(items);
  const activeStopCount = items.filter(countsAsScheduledOccupancy).length;
  const recordedVisitCount = items.filter(item => visited.has(item.id)).length;
  return <View testID="travel-day-overview" style={styles.root}>
    <View style={styles.hero}>
      <Text style={styles.kicker}>{tr(language,
        'ВАШ ДЕНЬ В ' + destination.display.ruPrepositionalUpper,
        'YOUR DAY IN ' + destination.display.en.toUpperCase(),
        '你的' + destination.display.zh + '之旅')}</Text>
      <Text style={styles.headline}>{next
        ? tr(language, 'Впереди ещё много интересного', 'More to discover today', '更多精彩在等你')
        : tr(language, 'Ваш день в ' + destination.display.ruPrepositional,
            'Your day in ' + destination.display.en, destination.display.zh + '的一天')}</Text>
      <Text style={styles.summary}>{dayDate} · {activeStopCount} {tr(language, 'не отменённых остановок', 'non-cancelled stops', '个未取消地点')} · {recordedVisitCount} {tr(language, 'отмечено как посещённые', 'marked as visited', '已标记到访')}</Text>
      {next && <View style={styles.nextCard}>
        <Text style={styles.nextLabel}>{tr(language, 'СЛЕДУЮЩАЯ ОСТАНОВКА', 'NEXT STOP', '下一站')} · {localTime(next.plannedStartAt)}</Text>
        <Text style={styles.nextTitle}>{next.title}</Text>
        <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language,'Я был здесь','I visited this place','我到过这里')} style={styles.action} contentStyle={styles.actionInner} onPress={() => onVisit(next.id)}>
          <Text style={styles.actionText}>{tr(language, 'Отметить посещение', 'Mark as visited', '标记为已到访')}</Text>
          <Text style={styles.actionText}>↗</Text>
        </PhysicalPressable>
      </View>}
    </View>
    <View style={styles.heading}>
      <Text style={styles.sectionTitle}>{tr(language, 'Маршрут дня', 'Your itinerary', '当天路线')}</Text>
      <Text style={styles.sectionHint}>{tr(language, 'Порядок из вашего плана', 'Order from your itinerary', '按您规划的顺序')}</Text>
    </View>
    {items.length === 0 ? <View style={styles.empty}><Text style={styles.emptyText}>{tr(language, 'Начните с одного интересного места или добавьте билет.', 'Start with a place or add your ticket.', '添加地点或门票开始旅程。')}</Text></View> : items.map((item,index)=>
      <View key={item.id} testID={"trip-stop-" + item.id} style={styles.stop}>
        <View style={styles.track}><View style={[styles.dot, visited.has(item.id) && styles.doneDot]}><Text style={styles.dotText}>{symbol(item)}</Text></View>{index < items.length - 1 && <View style={styles.line}/>}</View>
        <View style={styles.stopCard}>
          <View style={styles.stopHeader}><Text style={styles.stopTime}>{localTime(item.plannedStartAt)}</Text>{item.commitment && <Text style={styles.bookingFlag}>{item.status === 'cancelled' || item.commitment.status === 'cancelled'
            ? tr(language, 'Отменено', 'Cancelled', '已取消')
            : item.commitment.kind === 'ticket'
              ? tr(language, 'Билет', 'Ticket', '门票')
              : tr(language, 'Бронь', 'Reservation', '预订')}</Text>}</View>
          <Text style={styles.stopTitle}>{item.title}</Text>
          <Text style={styles.stopSub}>{stopStatusLabel(language, dayStopPresentation(item, visited.has(item.id)))}</Text>
        </View>
      </View>)}
    {bookings.length > 0 && <View style={styles.ticketPanel}>
      <Text style={styles.ticketTitle}>{tr(language,'Ваши билеты и брони','Tickets & reservations','门票与预订')}</Text>
      <Text style={styles.ticketText}>{bookings.length} {tr(language,'не отменены в записях этого дня. Проверяйте оригинальные подтверждения.','not marked cancelled on this day. Check original confirmations.','条未标记取消，请核对原始确认。')}</Text>
    </View>}
    <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language,'Настроить подробности поездки','Manage trip details','管理行程详情')} style={styles.detailsButton} contentStyle={styles.detailsContent} onPress={onOpenDetails}>
      <Text style={styles.detailsText}>{tr(language,'Управлять маршрутом и билетами','Manage route and tickets','管理路线与门票')}</Text><Text style={styles.detailsText}>↗</Text>
    </PhysicalPressable>
  </View>;
}
// Editorial, action-first travel card; do not substitute imagery without rights.
const styles = StyleSheet.create({
  root: { marginTop: 18, marginBottom: 24 },
  hero: { backgroundColor: '#183C34', padding: 22, borderRadius: 25 },
  kicker: { color: '#EAD4AA', fontSize: 12, letterSpacing: 0.8, fontWeight: '700' },
  headline: { fontSize: 27, lineHeight: 34, color: '#FFF9EC', fontWeight: '700', marginTop: 12 },
  summary: { fontSize: 14, lineHeight: 21, color: '#DFE9E0', marginTop: 9 },
  nextCard: { marginTop: 21, backgroundColor: '#FFF8E9', borderRadius: 19, padding: 18 },
  nextLabel: { color: '#455E54', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  nextTitle: { color: '#172C24', fontSize: 22, lineHeight: 28, fontWeight: '700', marginTop: 9, marginBottom: 15 },
  action: { backgroundColor: '#173B32', borderRadius: 13, minHeight: 52 },
  actionInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, gap: 10 },
  actionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  heading: { marginTop: 26, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 },
  sectionTitle: { color: '#F7F4EC', fontSize: 23, lineHeight: 29, fontWeight: '700', flexShrink: 1 },
  sectionHint: { fontSize: 12, color: '#C8D0C9', marginBottom: 3 },
  stop: { flexDirection: 'row', gap: 11 },
  track: { width: 38, alignItems: 'center' },
  dot: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#294A3E', alignItems: 'center', justifyContent: 'center' },
  doneDot: { backgroundColor: '#607A62' },
  dotText: { color: '#F6E7CA', fontSize: 20 },
  line: { width: 2, minHeight: 48, flex: 1, backgroundColor: '#6B8273', marginVertical: 4 },
  stopCard: { flex: 1, backgroundColor: '#FFF9EE', borderWidth: 1, borderColor: '#E4DED0', borderRadius: 16, padding: 16, marginBottom: 12 },
  stopHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stopTime: { color: '#395448', fontSize: 13, fontWeight: '700' },
  bookingFlag: { color: '#203A2D', fontSize: 12, fontWeight: '700', backgroundColor: '#E9E1C8', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9 },
  stopTitle: { fontSize: 18, lineHeight: 25, color: '#1C3027', fontWeight: '700', marginTop: 9 },
  stopSub: { color: '#53665A', fontSize: 13, lineHeight: 19, marginTop: 8 },
  ticketPanel: { borderRadius: 18, padding: 18, backgroundColor: '#244437', marginTop: 12 },
  ticketTitle: { color: '#FFF8E7', fontSize: 18, fontWeight: '700' },
  ticketText: { color: '#E3EADF', fontSize: 13, lineHeight: 20, marginTop: 8 },
  detailsButton: { minHeight: 52, borderRadius: 15, borderColor: '#CAB587', borderWidth: 1, marginTop: 15 },
  detailsContent: { flexDirection: 'row', paddingHorizontal: 16, alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  detailsText: { color: '#F5E6C5', fontSize: 14, fontWeight: '700', flexShrink: 1 },
  empty: { backgroundColor: '#FFF9EE', padding: 22, borderRadius: 18 },
  emptyText: { color: '#25392E', fontSize: 15, lineHeight: 23 }
});
