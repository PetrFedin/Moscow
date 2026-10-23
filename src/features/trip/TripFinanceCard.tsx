import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import type { PersonalTrip } from '../../travel/personalTrip';
import {
  assessTripFinances,
  formatTripMoneyMinor,
  parseTripMoneyInput,
  removeTripFinanceEntry,
  setTripFinanceBudget,
  TRIP_FINANCE_CATEGORIES,
  tripMoneyInputValue,
  upsertTripFinanceEntry,
  type TripFinanceCategory,
  type TripFinanceEntry
} from '../../travel/tripFinance';
import PhysicalPressable from '../../ui/PhysicalPressable';

type Props = {
  trip: PersonalTrip;
  dayDate: string;
  language: AppLanguage;
  onUpdate: (trip: PersonalTrip) => Promise<void>;
  /** Explicit conflict recovery, never automatically merges another tab's writes. */
  onRefreshStoredTrip: () => Promise<void>;
};

function categoryName(language: AppLanguage, category: TripFinanceCategory): string {
  const names: Record<TripFinanceCategory, [string, string, string]> = {
    tickets: ['Билеты', 'Tickets', '门票'],
    food: ['Еда и напитки', 'Food & drink', '餐饮'],
    transport: ['Транспорт', 'Transport', '交通'],
    stay: ['Проживание', 'Accommodation', '住宿'],
    activities: ['Впечатления', 'Experiences', '体验'],
    shopping: ['Покупки', 'Shopping', '购物'],
    other: ['Прочее', 'Other', '其他']
  };
  const item = names[category];
  return language === 'ru' ? item[0] : language === 'zh' ? item[2] : item[1];
}

function safeError(language: AppLanguage, error: unknown) {
  const reason = error instanceof Error ? error.message : '';
  if (/integer|kopecks|decimal|amount|Trip budget/.test(reason)) {
    return tr(language,
      'Укажите неотрицательную сумму с точностью до копейки.',
      'Enter a nonnegative amount, to two decimal places.',
      '请输入非负金额，最多两位小数。');
  }
  return tr(language,
    'Не удалось сохранить запись. Введённые данные оставлены для повторной попытки.',
    'Could not save. Your input is retained so you can retry.',
    '保存失败，已保留输入以便重试。');
}

export default function TripFinanceCard({ trip, dayDate, language, onUpdate, onRefreshStoredTrip }: Props) {
  const [scope, setScope] = useState<'day' | 'trip'>('trip');
  const [showEditor, setShowEditor] = useState(false);
  const [budgetEditor, setBudgetEditor] = useState(false);
  const [budgetText, setBudgetText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftIdentity, setDraftIdentity] = useState<{ id: string; createdAt: string; dayDate: string } | null>(null);
  const [editingBaseline, setEditingBaseline] = useState<string | null>(null);
  const [budgetBaseline, setBudgetBaseline] = useState<number | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TripFinanceCategory>('other');
  const [estimateText, setEstimateText] = useState('');
  const [actualText, setActualText] = useState('');
  const [linkId, setLinkId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(12);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const overall = useMemo(() => assessTripFinances(trip), [trip]);
  const daily = useMemo(() => assessTripFinances(trip, dayDate), [trip, dayDate]);
  const report = scope === 'day' ? daily : overall;
  const entries = useMemo(
    () => (trip.finance?.entries ?? [])
      .filter(entry => scope === 'trip' || entry.dayDate === dayDate)
      .slice()
      .sort((a, b) => a.dayDate.localeCompare(b.dayDate)
        || a.createdAt.localeCompare(b.createdAt)),
    [trip, scope, dayDate]
  );

  useEffect(() => {
    // A visible editor is not silently reset when itinerary changes or a
    // persistence failure occurs. Only the selected day follows the trip.
    setVisibleLimit(12);
  }, [scope, dayDate]);

  const money = (value: number) => formatTripMoneyMinor(value, language);

  const submit = async (produce: () => PersonalTrip, done: () => void) => {
    if (busy) return;
    setBusy(true);
    try {
      await onUpdate(produce());
      setError('');
      done();
    } catch (cause) {
      setError(safeError(language, cause));
    } finally {
      setBusy(false);
    }
  };

  const openNew = () => {
    const at = new Date().toISOString();
    // Stable across journal faults and retry: a second tap must NOT invent a new expense.
    setDraftIdentity({
      id: 'expense:' + at + ':' + Math.random().toString(36).slice(2, 11),
      createdAt: at,
      dayDate
    });
    setEditingBaseline(null);
    setRefreshing(false);
    setRefreshNotice('');
    setEditingId(null);
    setPendingDeleteId(null);
    setTitle('');
    setCategory('other');
    setEstimateText('');
    setActualText('');
    setLinkId('');
    setError('');
    setShowEditor(true);
  };

  const edit = (entry: TripFinanceEntry) => {
    setDraftIdentity({ id: entry.id, createdAt: entry.createdAt, dayDate: entry.dayDate });
    setEditingBaseline(entry.updatedAt);
    setRefreshNotice('');
    setEditingId(entry.id);
    setPendingDeleteId(null);
    setTitle(entry.title);
    setCategory(entry.category);
    setEstimateText(tripMoneyInputValue(entry.estimateMinor));
    setActualText(tripMoneyInputValue(entry.actualMinor));
    setLinkId(entry.itemId ?? '');
    setError('');
    setShowEditor(true);
  };

  const saveBudget = () => {
    void submit(
      () => {
        if (trip.finance?.budgetMinor !== budgetBaseline) {
          throw new Error('Trip budget changed since editing; reload before replacing it');
        }
        return setTripFinanceBudget({
        trip, budgetMinor: parseTripMoneyInput(budgetText),
        updatedAt: new Date().toISOString()
        });
      },
      () => setBudgetEditor(false)
    );
  };

  const saveEntry = () => {
    if (!title.trim()) {
      setError(tr(language, 'Введите название расхода.', 'Enter an expense title.', '请输入费用名称。'));
      return;
    }
    void submit(() => {
      if (!draftIdentity) throw new Error('Missing stable expense draft identity');
      const at = new Date().toISOString();
      const original = (trip.finance?.entries ?? []).find(entry => entry.id === draftIdentity.id);
      // A refreshed external revision must not be overwritten by a stale form.
      if (editingId && (!original || original.updatedAt !== editingBaseline)) {
        throw new Error('Expense changed in another revision; reopen before editing');
      }
      const estimateMinor = parseTripMoneyInput(estimateText);
      const actualMinor = parseTripMoneyInput(actualText);
      const entry: TripFinanceEntry = {
        id: draftIdentity.id,
        dayDate: draftIdentity.dayDate,
        title: title.trim(),
        category,
        source: 'traveler-entered',
        ...(estimateMinor !== undefined ? { estimateMinor } : {}),
        ...(actualMinor !== undefined ? { actualMinor } : {}),
        ...(linkId ? { itemId: linkId } : {}),
        createdAt: draftIdentity.createdAt,
        updatedAt: at
      };
      return upsertTripFinanceEntry({ trip, entry, updatedAt: at });
    }, () => {
      setShowEditor(false);
      setEditingId(null);
      setDraftIdentity(null);
      setEditingBaseline(null);
    });
  };

  const removeEntry = (id: string) => {
    void submit(() => removeTripFinanceEntry({
      trip, entryId: id, updatedAt: new Date().toISOString()
    }), () => {
      setPendingDeleteId(null);
      if (editingId === id) {
        setEditingId(null);
        setShowEditor(false);
      }
    });
  };

  const linkedStops = trip.items.filter(item => item.status !== 'cancelled'
    && item.dayDate === (editingId
      ? (trip.finance?.entries ?? []).find(entry => entry.id === editingId)?.dayDate ?? dayDate
      : dayDate));

  return (
    <View testID="trip-finance-card" style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>{tr(language, 'РАСХОДЫ ПОЕЗДКИ', 'TRIP EXPENSES', '旅行费用')}</Text>
          <Text style={styles.title}>{tr(language, 'Бюджет и траты', 'Budget & spending', '预算与支出')}</Text>
          <Text style={styles.description}>{tr(language,
            'Личный учёт в рублях. Суммы вводите вы — приложение не проверяет платежи или цены продавцов.',
            'Private ruble-based journal. You enter every amount; seller prices and payments are not verified.',
            '私人卢布记账。金额由您填写，平台不核实商户价格或付款。')}</Text>
        </View>
      </View>

      <View style={styles.segment}>
        <PhysicalPressable accessibilityRole="button"
          accessibilityLabel={tr(language, 'Расходы всей поездки', 'Whole-trip expenses', '全程费用')}
          style={[styles.segmentButton, scope === 'trip' && styles.segmentSelected]}
          contentStyle={styles.center} onPress={() => setScope('trip')}>
          <Text style={styles.segmentText}>{tr(language, 'Вся поездка', 'Entire trip', '全程')}</Text>
        </PhysicalPressable>
        <PhysicalPressable accessibilityRole="button"
          accessibilityLabel={tr(language, 'Расходы выбранного дня', 'Selected-day expenses', '当日费用')}
          style={[styles.segmentButton, scope === 'day' && styles.segmentSelected]}
          contentStyle={styles.center} onPress={() => setScope('day')}>
          <Text style={styles.segmentText}>{tr(language, 'Этот день', 'This day', '当日')}</Text>
        </PhysicalPressable>
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>{tr(language, 'Запланировано', 'Estimated', '计划')}</Text>
          <Text testID="trip-finance-estimated" style={styles.metricValue}>{report.entriesCount ? money(report.estimatedMinor) : '—'}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>{tr(language, 'По вашим записям', 'Recorded', '已记录')}</Text>
          <Text testID="trip-finance-actual" style={styles.metricValue}>{report.entriesCount ? money(report.actualMinor) : '—'}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>{tr(language, 'Прогноз расходов', 'Projected total', '预计总额')}</Text>
          <Text testID="trip-finance-projected" style={styles.metricValue}>{report.entriesCount ? money(report.projectedMinor) : '—'}</Text>
        </View>
      </View>
      <Text style={styles.method}>{tr(language,
        'Прогноз = фактические суммы + оценки там, где факт ещё не введён. Это не подтверждённые оплаты.',
        'Forecast = recorded amounts + estimates where no actual has been entered. This is not payment verification.',
        '预测 = 已记录金额 + 未填实付时的估算金额；不等于支付凭证。')}</Text>

      {scope === 'trip' && (
        <View style={styles.budget}>
          <View style={styles.budgetCopy}>
            <Text style={styles.budgetTitle}>{tr(language, 'Лимит на поездку', 'Trip budget', '旅行预算')}</Text>
            <Text testID="trip-finance-budget" style={styles.budgetAmount}>
              {overall.budgetMinor === undefined ? tr(language, 'Не задан', 'Not set', '未设置') : money(overall.budgetMinor)}
            </Text>
            {overall.projectedBudgetRemainingMinor !== undefined && (
              <Text testID="trip-finance-remaining"
                style={[styles.remaining, overall.overBudget && styles.overBudget]}>
                {overall.overBudget
                  ? tr(language, 'Выше лимита по прогнозу: ', 'Projected over budget: ', '预计超支：')
                      + money(-overall.projectedBudgetRemainingMinor)
                  : tr(language, 'Остаётся по прогнозу: ', 'Projected remaining: ', '预计剩余：')
                      + money(overall.projectedBudgetRemainingMinor)}
              </Text>
            )}
          </View>
          <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language,
            'Настроить бюджет поездки', 'Set trip budget', '设置预算')}
            style={styles.outlineButton} contentStyle={styles.center}
            onPress={() => {
              setBudgetText(tripMoneyInputValue(trip.finance?.budgetMinor));
              setBudgetBaseline(trip.finance?.budgetMinor);
              setBudgetEditor(value => !value);
              setError('');
            }}>
            <Text style={styles.outlineText}>{tr(language, 'Изменить', 'Edit', '修改')}</Text>
          </PhysicalPressable>
        </View>
      )}
      {budgetEditor && scope === 'trip' && (
        <View style={styles.inlineEditor}>
          <Text style={styles.formLabel}>{tr(language,
            'Лимит поездки, ₽', 'Trip ceiling, RUB', '预算上限，卢布')}</Text>
          <TextInput testID="trip-finance-budget-input"
            accessibilityLabel={tr(language, 'Сумма бюджета', 'Budget amount', '预算金额')}
            style={styles.input} keyboardType="decimal-pad"
            placeholder="15000" placeholderTextColor="#717b79"
            value={budgetText} onChangeText={setBudgetText}/>
          <Text style={styles.hint}>{tr(language,
            'Очистите поле, чтобы убрать лимит.', 'Clear the field to remove the ceiling.', '清空输入可取消上限。')}</Text>
          <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language,
            'Сохранить бюджет', 'Save budget', '保存预算')}
            style={styles.primaryButton} contentStyle={styles.center}
            disabled={busy} onPress={saveBudget}>
            <Text style={styles.primaryText}>{tr(language, 'Сохранить бюджет', 'Save budget', '保存预算')}</Text>
          </PhysicalPressable>
        </View>
      )}

      <View style={styles.actions}>
        <Text style={styles.coverage}>{tr(language, 'Расходы связаны с ', 'Costs linked to ', '已关联站点 ')}
          {report.coveredStopCount} / {report.activeStopCount}
          {tr(language, ' пунктами плана', ' planned stops', ' 个行程点')}</Text>
        <PhysicalPressable accessibilityRole="button"
          accessibilityLabel={tr(language, 'Добавить расход', 'Add expense', '添加费用')}
          style={styles.primaryButton} contentStyle={styles.center}
          onPress={openNew}>
          <Text style={styles.primaryText}>{tr(language, '+ Добавить расход', '+ Add an expense', '+ 添加费用')}</Text>
        </PhysicalPressable>
      </View>

      {showEditor && (
        <View testID="trip-finance-editor" style={styles.inlineEditor}>
          <Text style={styles.editorHeading}>{editingId
            ? tr(language, 'Изменить запись', 'Edit expense', '修改记录')
            : tr(language, 'Новая запись', 'New expense', '新费用')}</Text>
          <Text style={styles.formLabel}>{tr(language, 'Название', 'Name', '名称')}</Text>
          <TextInput testID="trip-finance-title-input" style={styles.input}
            accessibilityLabel={tr(language, 'Название расхода', 'Expense name', '费用名称')}
            placeholder={tr(language, 'Например, билеты в музей', 'e.g. museum tickets', '如博物馆门票')}
            placeholderTextColor="#717b79" value={title} onChangeText={setTitle}/>
          <Text style={styles.formLabel}>{tr(language, 'Категория', 'Category', '类别')}</Text>
          <View style={styles.categoryChips}>
            {TRIP_FINANCE_CATEGORIES.map(kind => (
              <PhysicalPressable key={kind} accessibilityRole="button"
                accessibilityLabel={tr(language, 'Категория расхода: ', 'Expense category: ', '费用类别：') + categoryName(language, kind)}
                style={[styles.chip, category === kind && styles.chipSelected]}
                contentStyle={styles.center}
                onPress={() => setCategory(kind)}>
                <Text style={styles.chipText}>{categoryName(language, kind)}</Text>
              </PhysicalPressable>
            ))}
          </View>
          <View style={styles.amountRow}>
            <View style={styles.amountField}>
              <Text style={styles.formLabel}>{tr(language, 'Оценка, ₽', 'Estimate, RUB', '估算，卢布')}</Text>
              <TextInput testID="trip-finance-estimate-input" style={styles.input}
                accessibilityLabel={tr(language, 'Плановая сумма', 'Estimated amount', '估算金额')}
                keyboardType="decimal-pad" placeholder="1200"
                placeholderTextColor="#717b79" value={estimateText} onChangeText={setEstimateText}/>
            </View>
            <View style={styles.amountField}>
              <Text style={styles.formLabel}>{tr(language, 'Факт, ₽', 'Actual, RUB', '实付，卢布')}</Text>
              <TextInput testID="trip-finance-actual-input" style={styles.input}
                accessibilityLabel={tr(language, 'Фактическая сумма по вашим записям', 'Recorded actual amount', '已记录实付金额')}
                keyboardType="decimal-pad" placeholder="1150,50"
                placeholderTextColor="#717b79" value={actualText} onChangeText={setActualText}/>
            </View>
          </View>
          <Text style={styles.hint}>{tr(language,
            'Заполните хотя бы одно поле. Оценка и факт никогда не суммируются дважды.',
            'Fill at least one amount. Estimate and actual are never double-counted.',
            '至少填写一个金额；估算与实付不会重复计入。')}</Text>
          {linkedStops.length > 0 && (
            <>
              <Text style={styles.formLabel}>{tr(language, 'Связать с планом', 'Link to itinerary', '关联行程')}</Text>
              <View style={styles.categoryChips}>
                <PhysicalPressable accessibilityRole="button"
                  accessibilityLabel={tr(language, 'Расход без привязки к месту', 'Unlinked expense', '不关联站点')}
                  style={[styles.chip, !linkId && styles.chipSelected]}
                  contentStyle={styles.center} onPress={() => setLinkId('')}>
                  <Text style={styles.chipText}>{tr(language, 'Отдельный расход', 'Independent cost', '独立费用')}</Text>
                </PhysicalPressable>
                {linkedStops.slice(0, 30).map(item => (
                  <PhysicalPressable key={item.id} accessibilityRole="button"
                    accessibilityLabel={tr(language, 'Связать расход с: ', 'Link expense to: ', '关联费用：') + item.title}
                    style={[styles.chip, linkId === item.id && styles.chipSelected]}
                    contentStyle={styles.center} onPress={() => setLinkId(item.id)}>
                    <Text style={styles.chipText}>{item.title}</Text>
                  </PhysicalPressable>
                ))}
              </View>
            </>
          )}
          <View style={styles.editorActions}>
            <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language,
              'Отменить изменение расхода', 'Cancel expense edit', '取消修改')}
              style={styles.outlineButton} contentStyle={styles.center}
              disabled={busy} onPress={() => { setShowEditor(false); setError(''); }}>
              <Text style={styles.outlineText}>{tr(language, 'Отмена', 'Cancel', '取消')}</Text>
            </PhysicalPressable>
            <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language,
              'Сохранить расход', 'Save expense', '保存费用')}
              style={styles.primaryButton} contentStyle={styles.center}
              disabled={busy} onPress={saveEntry}>
              <Text style={styles.primaryText}>{tr(language, 'Сохранить запись', 'Save entry', '保存记录')}</Text>
            </PhysicalPressable>
          </View>
        </View>
      )}
      {error ? (
        <View style={styles.refreshPanel}>
          <Text testID="trip-finance-error" style={styles.error}>{error}</Text>
          <Text style={styles.hint}>{tr(language,
            'Если поездка изменена в другой вкладке, загрузите сохранённую версию. Текст открытого расхода останется в форме. Не объединяйте разные версии автоматически.',
            'If another tab changed this trip, reload stored data. The open expense draft remains in the form; versions are never silently merged.',
            '如果其他标签修改了行程，可刷新已保存数据。当前费用草稿会保留，版本不会自动合并。')}</Text>
          <PhysicalPressable accessibilityRole="button"
            accessibilityLabel={tr(language, 'Обновить сохранённую поездку для расходов', 'Reload saved trip for expenses', '重新加载已保存行程')}
            style={styles.outlineButton} contentStyle={styles.center}
            disabled={busy || refreshing}
            onPress={() => {
              setRefreshing(true);
              void onRefreshStoredTrip()
                .then(() => {
                  setError('');
                  setRefreshNotice(tr(language,
                    'Сохранённая копия загружена. Проверьте суммы и повторите сохранение своего черновика.',
                    'Saved copy loaded. Review figures before retrying your draft.',
                    '已加载保存的版本，请确认金额后重试。'));
                })
                .catch(() => setError(tr(language,
                  'Не удалось проверить сохранённую копию. Не очищайте данные приложения.',
                  'Saved copy could not be verified. Do not clear app data.',
                  '无法核实已保存版本，请勿清除数据。')))
                .finally(() => setRefreshing(false));
            }}>
            <Text style={styles.outlineText}>{tr(language,
              'Проверить сохранённую копию', 'Reload saved copy', '重新加载保存内容')}</Text>
          </PhysicalPressable>
        </View>
      ) : null}
      {refreshNotice ? <Text testID="trip-finance-refresh-notice" style={styles.hint}>{refreshNotice}</Text> : null}

      <View style={styles.ledger}>
        <Text style={styles.ledgerHeading}>{tr(language, 'Записи', 'Entries', '记录')} · {entries.length}</Text>
        {entries.length === 0 ? (
          <Text style={styles.empty}>{tr(language,
            'Пока нет записей. Билеты и брони не создают расходы автоматически.',
            'No spending entries yet. Tickets and bookings do not create costs automatically.',
            '暂无费用记录。门票和预订不会自动生成费用。')}</Text>
        ) : entries.slice(0, visibleLimit).map(entry => {
          const item = entry.itemId ? trip.items.find(candidate => candidate.id === entry.itemId) : undefined;
          return (
            <View key={entry.id} style={styles.ledgerRow}>
              <View style={styles.entryCopy}>
                <Text style={styles.entryTitle}>{entry.title}</Text>
                <Text style={styles.entryMeta}>
                  {entry.dayDate} · {categoryName(language, entry.category)}
                  {item ? ' · ' + item.title : ''}
                </Text>
                <Text style={styles.entryMoney}>
                  {entry.actualMinor !== undefined
                    ? tr(language, 'Записанный факт: ', 'Recorded: ', '已记录：') + money(entry.actualMinor)
                    : tr(language, 'План: ', 'Estimate: ', '估算：') + money(entry.estimateMinor ?? 0)}
                  {entry.actualMinor !== undefined && entry.estimateMinor !== undefined
                    ? tr(language, ' · было запланировано ', ' · originally estimated ', ' · 原估算 ')
                      + money(entry.estimateMinor)
                    : ''}
                </Text>
              </View>
              <PhysicalPressable accessibilityRole="button"
                accessibilityLabel={tr(language, 'Редактировать расход: ', 'Edit expense: ', '修改费用：') + entry.title}
                style={styles.smallButton} contentStyle={styles.center}
                onPress={() => edit(entry)}>
                <Text style={styles.smallText}>{tr(language, 'Изменить', 'Edit', '修改')}</Text>
              </PhysicalPressable>
              <PhysicalPressable accessibilityRole="button"
                accessibilityLabel={tr(language, 'Удалить расход: ', 'Delete expense: ', '删除费用：') + entry.title}
                style={styles.smallButton} contentStyle={styles.center}
                disabled={busy} onPress={() => setPendingDeleteId(entry.id)}>
                <Text style={styles.smallText}>{tr(language, 'Удалить', 'Delete', '删除')}</Text>
              </PhysicalPressable>
              {pendingDeleteId === entry.id && (
                <View style={styles.deleteConfirm}>
                  <Text style={styles.deleteText}>{tr(language,
                    'Удалить эту личную запись расходов?',
                    'Delete this personal spending entry?', '删除这条私人费用记录？')}</Text>
                  <PhysicalPressable accessibilityRole="button"
                    accessibilityLabel={tr(language, 'Подтвердить удаление расхода: ', 'Confirm expense deletion: ', '确认删除费用：') + entry.title}
                    style={styles.smallButton} contentStyle={styles.center}
                    disabled={busy} onPress={() => removeEntry(entry.id)}>
                    <Text style={styles.smallText}>{tr(language, 'Удалить запись', 'Delete entry', '删除记录')}</Text>
                  </PhysicalPressable>
                  <PhysicalPressable accessibilityRole="button"
                    accessibilityLabel={tr(language, 'Отменить удаление расхода', 'Cancel expense deletion', '取消删除费用')}
                    style={styles.smallButton} contentStyle={styles.center}
                    disabled={busy} onPress={() => setPendingDeleteId(null)}>
                    <Text style={styles.smallText}>{tr(language, 'Отмена', 'Cancel', '取消')}</Text>
                  </PhysicalPressable>
                </View>
              )}
            </View>
          );
        })}
        {entries.length > visibleLimit && (
          <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language,
            'Показать больше расходов', 'Show more expenses', '显示更多费用')}
            style={styles.outlineButton} contentStyle={styles.center}
            onPress={() => setVisibleLimit(v => v + 12)}>
            <Text style={styles.outlineText}>{tr(language, 'Показать ещё', 'Show more', '显示更多')}</Text>
          </PhysicalPressable>
        )}
      </View>
      {report.byCategory.length > 1 && (
        <View style={styles.breakdown}>
          <Text style={styles.ledgerHeading}>{tr(language, 'По категориям', 'By category', '按类别')}</Text>
          {report.byCategory.map(row => (
            <View key={row.category} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{categoryName(language, row.category)}</Text>
              <Text style={styles.breakdownAmount}>{money(row.projectedMinor)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderRadius: 20, borderWidth: 1, borderColor: '#39453e', backgroundColor: '#131a18', padding: 15, marginTop: 12, marginBottom: 14, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  headerCopy: { flex: 1, minWidth: 0 },
  kicker: { color: '#a9ad9a', fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  title: { color: '#f1eee4', fontSize: 20, lineHeight: 26, fontWeight: '700', marginTop: 4 },
  description: { color: '#adbab0', fontSize: 12, lineHeight: 18, marginTop: 6 },
  segment: { flexDirection: 'row', borderRadius: 13, backgroundColor: '#202b25', padding: 4, gap: 5 },
  segmentButton: { flex: 1, minHeight: 38, borderRadius: 10 },
  segmentSelected: { backgroundColor: '#394d40' },
  segmentText: { color: '#f0e8d8', fontSize: 12, fontWeight: '700' },
  center: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: { flexGrow: 1, minWidth: 118, flexBasis: 118, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, backgroundColor: '#1d2622' },
  metricLabel: { color: '#b7c1b9', fontSize: 11, lineHeight: 15 },
  metricValue: { color: '#f3ebdb', fontSize: 18, lineHeight: 24, fontWeight: '700', marginTop: 5 },
  method: { color: '#96a49d', fontSize: 11, lineHeight: 16 },
  budget: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#35423a', paddingTop: 11 },
  budgetCopy: { flex: 1, minWidth: 0 },
  budgetTitle: { color: '#b7c5b8', fontSize: 11 },
  budgetAmount: { color: '#f4e8ce', fontWeight: '700', fontSize: 16, marginTop: 3 },
  remaining: { color: '#b9d2ba', fontSize: 12, lineHeight: 17, marginTop: 3 },
  overBudget: { color: '#efb7a9' },
  actions: { gap: 10 },
  coverage: { color: '#bac5b8', fontSize: 11, lineHeight: 16 },
  primaryButton: { minHeight: 44, borderRadius: 12, backgroundColor: '#e5d1a8', paddingHorizontal: 13 },
  primaryText: { color: '#1c3024', fontSize: 13, fontWeight: '700' },
  outlineButton: { minHeight: 40, borderRadius: 11, borderWidth: 1, borderColor: '#657768', paddingHorizontal: 12 },
  outlineText: { color: '#e4d8b9', fontSize: 12, fontWeight: '700' },
  inlineEditor: { borderRadius: 13, padding: 12, backgroundColor: '#1c2721', gap: 7 },
  editorHeading: { color: '#f2ece0', fontSize: 15, fontWeight: '700' },
  formLabel: { color: '#c1ccc1', fontSize: 12, fontWeight: '600', marginTop: 6 },
  hint: { color: '#9aa99d', fontSize: 11, lineHeight: 16 },
  input: { minHeight: 46, borderRadius: 11, backgroundColor: '#111914', borderWidth: 1, borderColor: '#5b6f5f', paddingHorizontal: 12, color: '#f3f1e9', fontSize: 14 },
  categoryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { minHeight: 39, borderRadius: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: '#526457' },
  chipSelected: { backgroundColor: '#385343', borderColor: '#c8b78a' },
  chipText: { color: '#f0e9d8', fontSize: 11, fontWeight: '600' },
  amountRow: { flexDirection: 'row', gap: 9 },
  amountField: { flex: 1, minWidth: 0 },
  editorActions: { flexDirection: 'row', gap: 8, marginTop: 9 },
  ledger: { borderTopWidth: 1, borderTopColor: '#34433a', paddingTop: 10, gap: 8 },
  ledgerHeading: { color: '#e8e4d7', fontSize: 14, fontWeight: '700' },
  empty: { color: '#9daca0', fontSize: 12, lineHeight: 18 },
  ledgerRow: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 7, borderTopWidth: 1, borderTopColor: '#2b382e', paddingVertical: 11 },
  entryCopy: { flex: 1, minWidth: 160 },
  entryTitle: { color: '#f1ede3', fontSize: 13, fontWeight: '700' },
  entryMeta: { color: '#a6b4a6', fontSize: 11, lineHeight: 16, marginTop: 3 },
  entryMoney: { color: '#e4d4ae', fontSize: 12, lineHeight: 18, marginTop: 4 },
  smallButton: { minHeight: 39, borderRadius: 9, borderWidth: 1, borderColor: '#5a6b5b', paddingHorizontal: 9 },
  smallText: { color: '#d4dccf', fontSize: 10, fontWeight: '600' },
  deleteConfirm: { width: '100%', padding: 9, borderRadius: 10, backgroundColor: '#302822', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  deleteText: { color: '#f2d2bc', flexBasis: 150, flexGrow: 1, fontSize: 11, lineHeight: 16 },
  breakdown: { gap: 8 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  breakdownLabel: { color: '#c5d0c4', fontSize: 12, flex: 1 },
  breakdownAmount: { color: '#e8d6b7', fontWeight: '700', fontSize: 12 },
  error: { color: '#f2b1a5', fontSize: 12, lineHeight: 18 },
  refreshPanel: { borderWidth: 1, borderColor: '#745a4d', borderRadius: 12, padding: 11, gap: 9 }
});
