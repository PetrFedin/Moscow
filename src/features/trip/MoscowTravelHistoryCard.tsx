import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import type { PersonalTrip } from '../../travel/personalTrip';
import type { PersonalTripArchive } from '../../travel/personalTripArchive';
import type { MoscowPassportCategory } from '../../travel/moscowPassport';
import {
  buildMoscowTravelHistory,
  filterMoscowTravelHistory,
  groupMoscowHistoryByDay
} from '../../travel/moscowTravelHistory';
import PhysicalPressable from '../../ui/PhysicalPressable';
import { buildMoscowFinanceHistory } from '../../travel/moscowFinanceHistory';
import { formatTripMoneyMinor } from '../../travel/tripFinance';

type Props = {
  activeTrip: PersonalTrip | null;
  archive: PersonalTripArchive;
  language: AppLanguage;
  onOpenTrip: (tripId: string) => void;
};

type CategoryFilter = 'all' | MoscowPassportCategory;

const categoryFilters: CategoryFilter[] = [
  'all', 'saw', 'ate', 'culture', 'nightlife', 'activity',
  'shopping', 'stay', 'transport', 'other'
];

const categoryNames: Record<AppLanguage, Record<CategoryFilter, string>> = {
  ru: {
    all: 'Все', saw: 'Что видел', ate: 'Где ел', culture: 'Культура',
    nightlife: 'Бары', activity: 'Активности', shopping: 'Покупки',
    stay: 'Отели', transport: 'Транспорт', other: 'Другое'
  },
  en: {
    all: 'All', saw: 'Seen', ate: 'Food', culture: 'Culture',
    nightlife: 'Nightlife', activity: 'Activities', shopping: 'Shopping',
    stay: 'Stay', transport: 'Transport', other: 'Other'
  },
  zh: {
    all: '全部', saw: '所见', ate: '美食', culture: '文化',
    nightlife: '夜生活', activity: '活动', shopping: '购物',
    stay: '住宿', transport: '交通', other: '其他'
  }
};

export default function MoscowTravelHistoryCard({ activeTrip, archive, language, onOpenTrip }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [visibleCount, setVisibleCount] = useState(15);
  const [financeExpanded, setFinanceExpanded] = useState(false);
  const [financeVisibleCount, setFinanceVisibleCount] = useState(12);

  const history = useMemo(
    () => buildMoscowTravelHistory({ activeTrip, archive }),
    [activeTrip, archive]
  );
  const financial = useMemo(() => buildMoscowFinanceHistory({ activeTrip, archive }), [activeTrip, archive]);
  const money = (minor: number) => formatTripMoneyMinor(minor, language);
  const filtered = useMemo(() => {
    try {
      return {
        entries: filterMoscowTravelHistory(history, { query, category, fromDate, toDate }),
        invalidDate: false
      };
    } catch {
      return { entries: [], invalidDate: true };
    }
  }, [history, query, category, fromDate, toDate]);
  const visibleDays = useMemo(
    () => groupMoscowHistoryByDay(filtered.entries.slice(0, visibleCount)),
    [filtered.entries, visibleCount]
  );

  const resetFilters = () => {
    setQuery('');
    setCategory('all');
    setFromDate('');
    setToDate('');
    setVisibleCount(15);
  };

  if (history.tripCount < 2 && history.visitCount === 0 && financial.entriesCount === 0) return null;

  return (
    <View testID="moscow-passport-v2-card" style={styles.root}>
      <Text style={styles.kicker}>{tr(language, 'ЛИЧНАЯ МОСКВА', 'MY MOSCOW', '我的莫斯科')}</Text>
      <Text style={styles.title}>{tr(language, 'История всех поездок', 'All journeys history', '全部旅程历史')}</Text>
      <Text style={styles.hint}>{tr(language,
        'Мои записи на этом устройстве. Отметка не доказывает физическое посещение и не подтверждает билет.',
        'My records on this device. A visit marker does not prove physical attendance or validate a ticket.',
        '仅本设备上的个人记录。到访标记不证明实际到场，也不验证门票。')}</Text>

      <View style={styles.metrics}>
        <View style={styles.metric}><Text style={styles.metricValue}>{history.tripCount}</Text>
          <Text style={styles.metricLabel}>{tr(language, 'поездок', 'trips', '次旅行')}</Text></View>
        <View style={styles.metric}><Text style={styles.metricValue}>{history.visitCount}</Text>
          <Text style={styles.metricLabel}>{tr(language, 'записей о визитах', 'visit records', '次到访记录')}</Text></View>
        <View style={styles.metric}><Text style={styles.metricValue}>{history.knownPlaceCount}</Text>
          <Text style={styles.metricLabel}>{tr(language, 'известных мест', 'identified places', '个已识别地点')}</Text></View>
      </View>
      <Text style={styles.hint}>{tr(language,
        `Из них повторных визитов в известные места: ${history.repeatKnownPlaceVisitCount}. Без точного ID: ${history.unknownIdentityVisitCount} записей — они не объединяются по похожим названиям.`,
        `Repeat visits to identified places: ${history.repeatKnownPlaceVisitCount}. Without a venue ID: ${history.unknownIdentityVisitCount} records — similar names are not merged.`,
        `已识别地点重复到访：${history.repeatKnownPlaceVisitCount}。缺少地点 ID 的记录：${history.unknownIdentityVisitCount}，不会按名称合并。`)}</Text>

      {financial.entriesCount > 0 && (
        <View testID="moscow-financial-history" style={styles.financeSection}>
          <Text style={styles.sectionTitle}>{tr(language,
            'Личный журнал расходов', 'Personal spending journal', '个人费用记录')}</Text>
          <Text style={styles.hint}>{tr(language,
            'Расходы из ваших записей, по разным поездкам. Это не подтверждённые банком платежи и не свидетельства посещения.',
            'Traveler-entered amounts across trips. These are not verified payments or evidence of visiting.',
            '跨行程的个人费用，不是已验证的支付或到访记录。')}</Text>
          <View style={styles.financeGrid}>
            <View style={styles.financeMetric}>
              <Text style={styles.financeLabel}>{tr(language, 'Записанный факт', 'Recorded actual', '已记录实付')}</Text>
              <Text testID="finance-history-actual" style={styles.financeAmount}>
                {financial.actualEntriesCount > 0 ? money(financial.actualMinor) : '—'}
              </Text>
            </View>
            <View style={styles.financeMetric}>
              <Text style={styles.financeLabel}>{tr(language, 'Прогноз по записям', 'Recorded forecast', '记录预测')}</Text>
              <Text testID="finance-history-projected" style={styles.financeAmount}>{money(financial.projectedMinor)}</Text>
            </View>
          </View>
          <PhysicalPressable accessibilityRole="button"
            accessibilityLabel={tr(language, 'Показать дневник расходов по поездкам', 'Toggle spending diary', '查看行程支出')}
            style={styles.financeToggle} contentStyle={styles.center}
            onPress={() => setFinanceExpanded(value => !value)}>
            <Text style={styles.toggleText}>{financeExpanded
              ? tr(language, 'Скрыть расходы', 'Hide expenses', '隐藏费用')
              : tr(language, 'Расходы по дням', 'Expenses by day', '按日查看费用')}</Text>
          </PhysicalPressable>
          {financeExpanded && (
            <View style={styles.financeDays}>
              {financial.days.slice(0, financeVisibleCount).map(day => (
                <View key={day.key} style={styles.financeDay}>
                  <Text style={styles.dayTitle}>{day.dayDate} · {day.tripTitle}</Text>
                  <View style={styles.financeSummaryRow}>
                    <Text style={styles.financeLabel}>{tr(language, 'Записано: ', 'Recorded: ', '已记录：')}
                      {day.entries.some(entry => entry.actualMinor !== undefined) ? money(day.actualMinor) : '—'}</Text>
                    <Text style={styles.financeAmountSmall}>{tr(language, 'Прогноз: ', 'Forecast: ', '预测：')}
                      {money(day.projectedMinor)}</Text>
                  </View>
                  {day.entries.map(entry => (
                    <View key={entry.id} style={styles.financeEntry}>
                      <Text style={styles.financeEntryTitle}>{entry.title}</Text>
                      <Text style={styles.financeLabel}>
                        {entry.actualMinor !== undefined
                          ? tr(language, 'Записанный факт: ', 'Recorded actual: ', '已记录实付：') + money(entry.actualMinor)
                          : tr(language, 'Ваша оценка: ', 'Your estimate: ', '您的估算：') + money(entry.estimateMinor ?? 0)}
                      </Text>
                    </View>
                  ))}
                  {activeTrip?.id !== day.tripId && (
                    <PhysicalPressable accessibilityRole="button"
                      accessibilityLabel={tr(language, 'Открыть поездку с расходами: ', 'Open journey containing expenses: ', '打开含支出的行程：') + day.tripTitle}
                      style={styles.tripAction} contentStyle={styles.center}
                      onPress={() => onOpenTrip(day.tripId)}>
                      <Text style={styles.toggleText}>{tr(language, 'Открыть поездку', 'Open journey', '打开行程')}</Text>
                    </PhysicalPressable>
                  )}
                </View>
              ))}
              {financial.days.length > financeVisibleCount && (
                <PhysicalPressable accessibilityRole="button"
                  accessibilityLabel={tr(language, 'Показать ещё дни расходов', 'Show more expense days', '显示更多支出日')}
                  style={styles.financeToggle} contentStyle={styles.center}
                  onPress={() => setFinanceVisibleCount(value => value + 12)}>
                  <Text style={styles.toggleText}>{tr(language, 'Показать ещё', 'Show more', '显示更多')}</Text>
                </PhysicalPressable>
              )}
            </View>
          )}
        </View>
      )}

      <PhysicalPressable
        accessibilityRole="button"
        accessibilityLabel={tr(language, 'Показать историю посещений по всем поездкам', 'Toggle visit history', '查看全部访问历史')}
        style={styles.toggle}
        contentStyle={styles.center}
        onPress={() => setExpanded((current) => !current)}
      >
        <Text style={styles.toggleText}>{expanded
          ? tr(language, 'Скрыть дневник', 'Hide diary', '隐藏日记')
          : tr(language, 'Открыть дневник посещений', 'Explore visit diary', '查看到访日记')}</Text>
      </PhysicalPressable>

      {expanded && (
        <View style={styles.diary}>
          <Text style={styles.sectionTitle}>{tr(language, 'Найти воспоминание', 'Find a memory', '搜索回忆')}</Text>
          <TextInput
            accessibilityLabel={tr(language, 'Поиск по истории Москвы', 'Search Moscow history', '搜索莫斯科历史')}
            placeholder={tr(language, 'Место, поездка или заметка', 'Place, trip or note', '地点、旅行或备注')}
            placeholderTextColor="#859b8b"
            value={query}
            onChangeText={(next) => { setQuery(next); setVisibleCount(15); }}
            style={styles.input}
            autoCorrect={false}
          />
          <View style={styles.chips}>
            {categoryFilters.map((option) => (
              <PhysicalPressable
                key={option}
                accessibilityRole="button"
                accessibilityLabel={tr(language, 'Фильтр категории: ', 'Category filter: ', '类别筛选：') + categoryNames[language][option]}
                accessibilityState={{ selected: category === option }}
                style={[styles.chip, category === option && styles.chipSelected]}
                contentStyle={styles.center}
                onPress={() => { setCategory(option); setVisibleCount(15); }}
              >
                <Text style={[styles.chipText, category === option && styles.chipTextSelected]}>{categoryNames[language][option]}</Text>
              </PhysicalPressable>
            ))}
          </View>
          <Text style={styles.hint}>{tr(language, 'Фильтр по датам, включая выбранные дни (ГГГГ-ММ-ДД)', 'Date range, inclusive (YYYY-MM-DD)', '日期范围（YYYY-MM-DD，含首尾）')}</Text>
          <View style={styles.dates}>
            <TextInput
              accessibilityLabel={tr(language, 'Дата посещения с', 'Visits from date', '起始日期')}
              placeholder="2026-01-01"
              placeholderTextColor="#859b8b"
              style={[styles.input, styles.dateInput]}
              value={fromDate}
              autoCapitalize="none"
              onChangeText={(next) => { setFromDate(next); setVisibleCount(15); }}
            />
            <Text style={styles.dateDivider}>—</Text>
            <TextInput
              accessibilityLabel={tr(language, 'Дата посещения по', 'Visits to date', '结束日期')}
              placeholder="2026-12-31"
              placeholderTextColor="#859b8b"
              style={[styles.input, styles.dateInput]}
              value={toDate}
              autoCapitalize="none"
              onChangeText={(next) => { setToDate(next); setVisibleCount(15); }}
            />
          </View>
          {filtered.invalidDate && (
            <Text style={styles.error}>{tr(language, 'Проверьте даты: формат ГГГГ-ММ-ДД, начало не позже конца.', 'Check the date range: YYYY-MM-DD, start no later than end.', '日期格式错误，开始日期不得晚于结束日期。')}</Text>
          )}

          <View style={styles.resultTop}>
            <Text style={styles.resultText}>{tr(language, 'Найдено посещений:', 'Visit records found:', '找到的到访记录：')} {filtered.entries.length}</Text>
            <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language, 'Сбросить фильтры истории', 'Reset history filters', '重置历史筛选')}
              style={styles.reset} contentStyle={styles.center} onPress={resetFilters}>
              <Text style={styles.resetText}>{tr(language, 'Сбросить', 'Reset', '重置')}</Text>
            </PhysicalPressable>
          </View>

          {filtered.entries.length === 0 && !filtered.invalidDate && (
            <Text style={styles.hint}>{tr(language, 'Совпадений нет. Измените поиск или период.', 'No matches. Try another search or date range.', '没有匹配记录。请调整搜索或日期。')}</Text>
          )}

          {visibleDays.map((day) => (
            <View key={day.dayDate} style={styles.day}>
              <Text style={styles.dayTitle}>{day.dayDate}</Text>
              {day.entries.map((entry) => (
                <View key={entry.key} style={styles.entry}>
                  <Text style={styles.entryTitle}>{entry.title}</Text>
                  <Text style={styles.entryMeta}>{categoryNames[language][entry.category]} · {entry.tripTitle}</Text>
                  <Text style={styles.entryEvidence}>{entry.evidence === 'user-confirmed'
                    ? tr(language, 'Отмечено вами', 'Marked by you', '由您标记')
                    : entry.evidence === 'provider-receipt'
                      ? tr(language, 'В записи указана квитанция провайдера — не проверена этим экраном', 'Record refers to provider receipt; not verified by this screen', '记录引用供应商凭证，此页面未验证')
                      : entry.evidence === 'route-completed'
                        ? tr(language, 'Отмечено в маршруте', 'Marked during a walk', '路线中标记')
                        : tr(language, 'Сигнал близости — не подтверждение посещения', 'Proximity signal, not attendance proof', '邻近信号并非到访凭证')}</Text>
                  {entry.note && <Text style={styles.note}>{entry.note}</Text>}
                  {activeTrip?.id !== entry.tripId && (
                    <PhysicalPressable accessibilityRole="button"
                      accessibilityLabel={tr(language, 'Открыть поездку с посещением: ', 'Open trip containing visit: ', '打开包含到访的行程：') + entry.tripTitle}
                      style={styles.tripAction} contentStyle={styles.center} onPress={() => onOpenTrip(entry.tripId)}>
                      <Text style={styles.toggleText}>{tr(language, 'Открыть поездку', 'Open trip', '打开行程')}</Text>
                    </PhysicalPressable>
                  )}
                </View>
              ))}
            </View>
          ))}

          {visibleCount < filtered.entries.length && (
            <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language, 'Показать ещё посещения', 'Show more visits', '显示更多到访')}
              style={styles.toggle} contentStyle={styles.center} onPress={() => setVisibleCount((value) => value + 15)}>
              <Text style={styles.toggleText}>{tr(language, 'Показать ещё', 'Show more', '加载更多')}</Text>
            </PhysicalPressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 16, padding: 17, borderRadius: 20, borderWidth: 1, borderColor: '#485e53', backgroundColor: '#1c3028', gap: 12 },
  kicker: { fontSize: 10, color: '#d7bc8b', letterSpacing: 1, fontWeight: '700' },
  title: { fontSize: 20, color: '#f6f0e2', fontWeight: '700' },
  hint: { fontSize: 12, lineHeight: 19, color: '#c5d1c9' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: { flexGrow: 1, flexBasis: 86, padding: 12, borderRadius: 12, backgroundColor: '#2b4536' },
  metricValue: { color: '#f4e8ce', fontWeight: '800', fontSize: 23 },
  metricLabel: { color: '#c9d7c9', fontSize: 11, marginTop: 4 },
  toggle: { minHeight: 46, borderRadius: 12, backgroundColor: '#3b5b45' },
  center: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
  toggleText: { color: '#f4e7ca', fontSize: 13, fontWeight: '700' },
  diary: { gap: 13, paddingTop: 10 },
  financeSection: { padding: 13, gap: 9, borderRadius: 14, backgroundColor: '#1a2c24', borderWidth: 1, borderColor: '#456151' },
  financeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  financeMetric: { flexBasis: 128, flexGrow: 1, minWidth: 0, gap: 4 },
  financeLabel: { color: '#c5d3c3', fontSize: 11, lineHeight: 17, flexShrink: 1 },
  financeAmount: { color: '#f4ead7', fontSize: 18, lineHeight: 24, fontWeight: '700' },
  financeAmountSmall: { color: '#ead4ac', fontSize: 12, lineHeight: 18, fontWeight: '700', flexShrink: 1 },
  financeToggle: { backgroundColor: '#34513d', minHeight: 44, borderRadius: 11 },
  financeDays: { gap: 11, paddingTop: 5 },
  financeDay: { borderTopWidth: 1, borderTopColor: '#506252', gap: 8, paddingTop: 10 },
  financeSummaryRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 },
  financeEntry: { borderRadius: 10, backgroundColor: '#23382c', padding: 9, gap: 3 },
  financeEntryTitle: { color: '#f7eddb', fontSize: 13, fontWeight: '700' },
  sectionTitle: { color: '#e6e3d6', fontWeight: '700', fontSize: 16 },
  input: { backgroundColor: '#14241b', borderColor: '#58725f', borderWidth: 1, minHeight: 48, paddingHorizontal: 13, color: '#f5f0e6', borderRadius: 11, fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { minHeight: 38, borderRadius: 20, backgroundColor: '#263f30', borderColor: '#435d48', borderWidth: 1 },
  chipSelected: { backgroundColor: '#e4d5b1', borderColor: '#e4d5b1' },
  chipText: { color: '#ecdfc5', fontSize: 12, fontWeight: '600' },
  chipTextSelected: { color: '#26392c' },
  dates: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateInput: { flex: 1, minWidth: 0 },
  dateDivider: { color: '#e0d3b5' },
  error: { color: '#ffb2a7', fontSize: 12, lineHeight: 18 },
  resultTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  resultText: { color: '#eee7d7', fontWeight: '700', fontSize: 13, flex: 1 },
  reset: { minHeight: 38, borderWidth: 1, borderColor: '#54725b', borderRadius: 10 },
  resetText: { color: '#e2d0aa', fontWeight: '700', fontSize: 12 },
  day: { borderTopWidth: 1, borderColor: '#506859', paddingTop: 10, gap: 9 },
  dayTitle: { color: '#f2dbaa', fontWeight: '800', fontSize: 16 },
  entry: { padding: 12, borderRadius: 12, backgroundColor: '#24382c', gap: 5 },
  entryTitle: { color: '#f8f1df', fontSize: 15, fontWeight: '700' },
  entryMeta: { color: '#c8d3c7', fontSize: 12 },
  entryEvidence: { color: '#e7c997', fontSize: 11, lineHeight: 17 },
  note: { color: '#e5e0d4', fontSize: 12, lineHeight: 19 },
  tripAction: { alignSelf: 'flex-start', minHeight: 39, backgroundColor: '#3b5b45', borderRadius: 9 }
});
