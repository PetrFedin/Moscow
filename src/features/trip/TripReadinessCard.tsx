import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import type { PersonalTrip } from '../../travel/personalTrip';
import {
  assessTripReadiness,
  type TripReadinessCode,
  type TripReadinessIssue
} from '../../travel/tripReadiness';
import PhysicalPressable from '../../ui/PhysicalPressable';

type Props = Readonly<{
  trip: PersonalTrip;
  dayDate: string;
  language: AppLanguage;
  onManageBooking: (itemId: string) => void;
  onOpenTripDetails: () => void;
}>;

function issueDescription(lang: AppLanguage, code: TripReadinessCode): string {
  switch (code) {
    case 'fixed-overlap':
      return tr(lang, 'Два записанных билета или брони пересекаются по времени. Изменение согласовывайте с поставщиком.',
        'Two saved tickets or reservations overlap. Rescheduling requires the supplier.',
        '两条已记录门票或预订时间重叠，变更须与供应商确认。');
    case 'planned-overlap':
      return tr(lang, 'Пункты личного плана пересекаются. Время в пути отдельно не проверено.',
        'Personal itinerary slots overlap. Travel time has not been verified.',
        '个人行程时间重叠，交通时间未经核验。');
    case 'missing-time':
      return tr(lang, 'Время ещё не указано. Проверьте часы работы или свой билет перед посещением.',
        'No time entered. Check opening times or your own ticket before visiting.',
        '尚未填写时间，出行前请核实营业时间或门票。');
    case 'incomplete-time':
      return tr(lang, 'Указано только начало или окончание. Проверьте обе границы интервала.',
        'Only start or end time is recorded. Review both ends of the interval.',
        '仅记录开始或结束时间，请补全。');
    case 'provisional-hold':
      return tr(lang, 'Предварительная бронь не означает окончательное подтверждение.',
        'A provisional hold is not a confirmed reservation.', '临时预留不代表最终确认。');
    case 'user-declared-booking':
      return tr(lang, 'Билет или бронь указаны вами. Проверьте оригинал у поставщика.',
        'Ticket or reservation entered by you. Verify the original with the provider.',
        '门票或预订由您录入，请向供应商核对原件。');
    case 'provider-recorded-check-original':
      return tr(lang, 'В записи есть отметка о подтверждении поставщика, но эта проверка её не перепроверяет.',
        'Provider confirmation is noted in the record, but has not been reverified.',
        '记录标有供应商确认，但此处未重新核验。');
    case 'unresolved-provider-question':
      return tr(lang, 'Есть открытое обращение по билету или брони. Ответ поставщика не подтверждён приложением.',
        'A booking question remains open. The supplier reply is not verified by this app.',
        '门票或预订咨询尚未关闭，供应商回复未经本应用核实。');
  }
}

function severityName(lang: AppLanguage, issue: TripReadinessIssue) {
  if (issue.severity === 'conflict') return tr(lang, 'КОНФЛИКТ', 'CONFLICT', '冲突');
  if (issue.severity === 'check') return tr(lang, 'ПРОВЕРИТЬ', 'CHECK', '待核实');
  return tr(lang, 'УТОЧНИТЬ', 'REVIEW', '待补充');
}

export default function TripReadinessCard({
  trip, dayDate, language, onManageBooking, onOpenTripDetails
}: Props) {
  const [scope, setScope] = useState<'day' | 'trip'>('day');
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const day = useMemo(() => assessTripReadiness(trip, dayDate), [trip, dayDate]);
  const overall = useMemo(() => assessTripReadiness(trip), [trip]);
  const report = scope === 'day' ? day : overall;
  const visible = showAll ? report.issues : report.issues.slice(0, 5);
  const issueTarget = (entry: TripReadinessIssue) =>
    entry.itemIds.map(id => trip.items.find(item => item.id === id))
      .find(item => item?.commitment && item.status === 'planned');

  return <View testID="trip-readiness" style={styles.root}>
    <Text style={styles.kicker}>{tr(language, 'ПРОВЕРКА ПЛАНА', 'ITINERARY REVIEW', '行程检查')}</Text>
    <Text style={styles.title}>{tr(language, 'Всё ли учтено перед выходом?',
      'Anything to check before you go?', '出发前有什么需要检查？')}</Text>
    <Text style={styles.disclaimer}>{tr(language,
      'Проверяются только ваши сохранённые записи. Наличие мест, работа заведений, время в пути, оплата и действительность билетов онлайн не проверяются.',
      'Only your saved entries are reviewed. Live availability, opening hours, travel times, payment and ticket validity are NOT checked.',
      '只检查您保存的行程，不核实实时余位、营业时间、交通、支付或门票有效性。')}</Text>

    <View style={styles.scopeRow}>
      <PhysicalPressable accessibilityRole="button"
        accessibilityLabel={tr(language, 'Проверить выбранный день', 'Review selected day', '检查所选日期')}
        accessibilityState={{ selected: scope === 'day' }}
        style={[styles.scope, scope === 'day' && styles.scopeActive]}
        contentStyle={styles.scopeInner} onPress={() => { setScope('day'); setShowAll(false); }}>
        <Text style={styles.scopeText}>{tr(language, 'Этот день', 'This day', '当天')}</Text>
      </PhysicalPressable>
      <PhysicalPressable accessibilityRole="button"
        accessibilityLabel={tr(language, 'Проверить все дни поездки', 'Review all trip days', '检查整个行程')}
        accessibilityState={{ selected: scope === 'trip' }}
        style={[styles.scope, scope === 'trip' && styles.scopeActive]}
        contentStyle={styles.scopeInner} onPress={() => { setScope('trip'); setShowAll(false); }}>
        <Text style={styles.scopeText}>{tr(language, 'Вся поездка', 'Full trip', '整个行程')}</Text>
      </PhysicalPressable>
    </View>

    <View style={styles.metrics}>
      <View style={styles.metric}>
        <Text testID="trip-readiness-conflicts" style={styles.metricValue}>{report.conflictCount}</Text>
        <Text style={styles.metricLabel}>{tr(language, 'конфликтов', 'conflicts', '冲突')}</Text>
      </View>
      <View style={styles.metric}>
        <Text testID="trip-readiness-checks" style={styles.metricValue}>{report.checkCount}</Text>
        <Text style={styles.metricLabel}>{tr(language, 'проверок', 'checks', '待核验')}</Text>
      </View>
      <View style={styles.metric}>
        <Text testID="trip-readiness-information" style={styles.metricValue}>{report.informationCount}</Text>
        <Text style={styles.metricLabel}>{tr(language, 'уточнений', 'details', '待补充')}</Text>
      </View>
    </View>
    <Text testID="trip-readiness-status" style={styles.status}>
      {report.level === 'conflict'
        ? tr(language, 'Есть пересечения, которые нужно разобрать.',
            'Scheduling conflicts need review.', '有时间冲突需要处理。')
        : report.level === 'check'
          ? tr(language, 'Есть записи, которые нужно проверить перед визитом.',
              'Some details need checking before your visit.', '部分信息需要出发前核实。')
          : tr(language, 'Локальных конфликтов не обнаружено. Это не подтверждение бронирований.',
              'No local scheduling conflicts detected. Bookings are NOT verified.',
              '未发现本地行程冲突，但预订未获核实。')}
    </Text>

    <PhysicalPressable accessibilityRole="button"
      accessibilityLabel={expanded
        ? tr(language, 'Свернуть результаты проверки', 'Collapse itinerary review', '收起检查结果')
        : tr(language, 'Показать результаты проверки', 'Show itinerary review', '查看检查结果')}
      style={styles.toggle} contentStyle={styles.scopeInner} onPress={() => setExpanded(v => !v)}>
      <Text style={styles.scopeText}>{expanded
        ? tr(language, 'Свернуть', 'Collapse', '收起')
        : tr(language, 'Посмотреть замечания', 'View findings', '查看问题')}</Text>
    </PhysicalPressable>
    {expanded && <View testID="trip-readiness-issues" style={styles.issues}>
      {report.issueCount === 0 && <Text style={styles.empty}>
        {tr(language, 'Новых замечаний по выбранному охвату нет.',
          'No local findings in the selected scope.', '所选范围暂无新发现。')}
      </Text>}
      {visible.map(item => {
        const target = issueTarget(item);
        return <View key={item.id} style={styles.issue}>
          <Text style={styles.issueMeta}>{severityName(language, item)} · {item.dayDate}</Text>
          <Text style={styles.issueTitle}>{item.titles.join(' / ')}</Text>
          <Text style={styles.issueText}>{issueDescription(language, item.code)}</Text>
          {target && <PhysicalPressable accessibilityRole="button"
            accessibilityLabel={tr(language, 'Открыть обращение по брони: ', 'Open booking inquiry: ', '打开预订咨询：') + target.title}
            style={styles.issueAction} contentStyle={styles.scopeInner}
            onPress={() => onManageBooking(target.id)}>
            <Text style={styles.issueActionText}>{tr(language, 'Вопрос по брони →',
              'Booking inquiry →', '预订咨询 →')}</Text>
          </PhysicalPressable>}
        </View>;
      })}
      {!showAll && report.issues.length > 5 && <PhysicalPressable accessibilityRole="button"
        accessibilityLabel={tr(language, 'Показать все замечания', 'Show all findings', '查看全部问题')}
        style={styles.toggle} contentStyle={styles.scopeInner} onPress={() => setShowAll(true)}>
        <Text style={styles.scopeText}>{tr(language, 'Показать все замечания',
          'Show all findings', '查看全部问题')} ({report.issues.length})</Text>
      </PhysicalPressable>}
      {showAll && report.issues.length > 5 && <PhysicalPressable accessibilityRole="button"
        accessibilityLabel={tr(language, 'Показать первые замечания', 'Show first findings', '查看前几个问题')}
        style={styles.toggle} contentStyle={styles.scopeInner} onPress={() => setShowAll(false)}>
        <Text style={styles.scopeText}>{tr(language, 'Свернуть список', 'Show less', '收起列表')}</Text>
      </PhysicalPressable>}
      {report.issues.length > 0 && <PhysicalPressable accessibilityRole="button"
        accessibilityLabel={tr(language, 'Открыть настройки и управление маршрутом', 'Manage itinerary details', '管理行程详情')}
        style={styles.manage} contentStyle={styles.scopeInner} onPress={onOpenTripDetails}>
        <Text style={styles.manageText}>{tr(language, 'Управлять маршрутом →',
          'Manage itinerary →', '管理行程 →')}</Text>
      </PhysicalPressable>}
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  root: { borderRadius: 22, backgroundColor: '#222D2B', padding: 16, borderWidth: 1, borderColor: '#526960', marginBottom: 18 },
  kicker: { color: '#DCC59A', fontSize: 10, letterSpacing: 1.3, fontWeight: '800' },
  title: { color: '#FAF4E9', fontSize: 20, lineHeight: 27, fontWeight: '800', marginTop: 7 },
  disclaimer: { color: '#CBD7D0', fontSize: 12, lineHeight: 19, marginTop: 9 },
  scopeRow: { flexDirection: 'row', gap: 8, marginTop: 13 },
  scope: { flex: 1, minWidth: 0, minHeight: 45, borderRadius: 11, borderWidth: 1, borderColor: '#769186' },
  scopeActive: { backgroundColor: '#395C4C', borderColor: '#E5C68D' },
  scopeInner: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 9 },
  scopeText: { color: '#FFF4DD', fontSize: 12, lineHeight: 18, textAlign: 'center', fontWeight: '700' },
  metrics: { flexDirection: 'row', gap: 7, marginTop: 11 },
  metric: { flex: 1, minWidth: 0, paddingVertical: 10, paddingHorizontal: 5, alignItems: 'center', backgroundColor: '#1A2722', borderRadius: 12 },
  metricValue: { color: '#FFF4D8', fontSize: 22, fontWeight: '800' },
  metricLabel: { color: '#BFD1C5', fontSize: 10, lineHeight: 15, textAlign: 'center' },
  status: { color: '#E9DFCC', fontSize: 13, lineHeight: 20, marginTop: 12, fontWeight: '600' },
  toggle: { marginTop: 12, borderRadius: 11, borderWidth: 1, borderColor: '#789488', minHeight: 43 },
  issues: { gap: 9, marginTop: 12 },
  empty: { color: '#CEDDD0', fontSize: 12, lineHeight: 19 },
  issue: { borderRadius: 13, backgroundColor: '#17231F', padding: 12, borderWidth: 1, borderColor: '#394A42' },
  issueMeta: { color: '#E1C590', fontWeight: '800', fontSize: 10, letterSpacing: 0.6 },
  issueTitle: { color: '#FDF2DF', fontSize: 13, fontWeight: '700', marginTop: 5 },
  issueText: { color: '#CFDDD1', fontSize: 12, lineHeight: 18, marginTop: 5 },
  issueAction: { borderRadius: 9, borderWidth: 1, borderColor: '#849A86', marginTop: 10, minHeight: 41 },
  issueActionText: { color: '#EAD2A3', fontWeight: '700', fontSize: 12 },
  manage: { backgroundColor: '#E7D8B8', borderRadius: 11, marginTop: 5, minHeight: 45 },
  manageText: { color: '#203C30', fontSize: 13, fontWeight: '800' }
});
