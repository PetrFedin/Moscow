import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';

import PhysicalPressable from '../../ui/PhysicalPressable';
import { tr, type AppLanguage } from '../../i18n';
import {
  buildDestinationDayPrototype,
  type DestinationDaySlot
} from '../../travel/destinationDayPrototype';
import { moscowVarvarkaDestinationPackage } from '../../travel/moscowDestinationPackage';

type Props = {
  language: AppLanguage;
  onStartHistory: () => void;
};

const budgetOptions = [180, 300, 480] as const;

function slotTitle(language: AppLanguage, slot: DestinationDaySlot) {
  if (slot.kind === 'heritage') {
    return tr(language, 'История и город', 'History & city', '历史与城市');
  }
  if (slot.kind === 'food') {
    return tr(language, 'Где поесть', 'Where to eat', '去哪里吃饭');
  }
  if (slot.kind === 'event') {
    return tr(language, 'Что происходит сегодня', 'What is on today', '今天有什么活动');
  }
  return tr(language, 'Куда дальше', 'What next', '下一站去哪里');
}

function slotTime(language: AppLanguage, slot: DestinationDaySlot) {
  if (slot.kind === 'heritage') {
    return slot.durationMinutes
      ? tr(
          language,
          `≈${slot.durationMinutes} мин`,
          `≈${slot.durationMinutes} min`,
          `约${slot.durationMinutes}分钟`
        )
      : '';
  }
  if (slot.kind === 'food') return tr(language, 'После прогулки', 'After the walk', '路线之后');
  if (slot.kind === 'event') return tr(language, 'Днём / вечером', 'Afternoon / evening', '下午 / 晚上');
  return tr(language, 'Свободное окно', 'Open slot', '自由时段');
}

function unresolvedCopy(language: AppLanguage, slot: DestinationDaySlot) {
  if (slot.kind === 'food') {
    return tr(
      language,
      'Подключим только заведения с подтверждённым provider feed. Никаких выдуманных «открыто сейчас» или свободных столов.',
      'Only venues from a verified provider feed will appear here. No invented “open now” or table availability.',
      '这里只会显示来自已验证数据源的餐饮场所，不会虚构“正在营业”或空桌信息。'
    );
  }
  if (slot.kind === 'event') {
    return tr(
      language,
      'Здесь появятся реальные события, время, статус и билет только после формального live feed.',
      'Real events, times, status and ticket handoff appear only after a formal live feed is connected.',
      '接入正式实时数据后，这里才会显示真实活动、时间、状态和购票入口。'
    );
  }
  return tr(
    language,
    'Свободный блок дня заполняется только подтверждённой активностью из live destination feed.',
    'The open part of the day is filled only by a verified live destination activity.',
    '当天的自由时段只会由实时目的地数据中已验证的活动填充。'
  );
}

export default function DestinationDayPrototypeCard({
  language,
  onStartHistory
}: Props) {
  const [budgetMinutes, setBudgetMinutes] = useState<(typeof budgetOptions)[number]>(300);

  const day = useMemo(
    () => buildDestinationDayPrototype({
      pkg: moscowVarvarkaDestinationPackage,
      budgetMinutes,
      themes: ['история Москвы', 'архитектура', 'Зарядье']
    }),
    [budgetMinutes]
  );

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <View style={styles.topCopy}>
          <Text style={styles.kicker}>
            {tr(language, 'МОЙ ДЕНЬ В МОСКВЕ · PROTOTYPE', 'MY DAY IN MOSCOW · PROTOTYPE', '我的莫斯科一天 · 原型')}
          </Text>
          <Text style={styles.title}>
            {tr(
              language,
              'Не ищите по отдельности — соберите день целиком',
              'Do not search one thing at a time — build the whole day',
              '不必一个个寻找，一次规划完整一天'
            )}
          </Text>
          <Text style={styles.body}>
            {tr(
              language,
              'История → прогулка → еда → событие → следующий шаг. Сейчас исторический контур уже работает; live-слоты подключаются только к подтверждённым городским или партнёрским данным.',
              'History → walk → food → event → what next. The heritage layer already works; live slots activate only from verified city or partner data.',
              '历史 → 步行路线 → 餐饮 → 活动 → 下一步。历史层已经可用；实时模块只接入经过验证的城市或合作方数据。'
            )}
          </Text>
        </View>

        <View style={styles.readiness}>
          <Text style={styles.readinessValue}>{day.readySlotCount}/4</Text>
          <Text style={styles.readinessLabel}>
            {tr(language, 'слотов сейчас подтверждено', 'slots verified now', '当前已验证模块')}
          </Text>
        </View>
      </View>

      <Text style={styles.label}>
        {tr(language, 'СКОЛЬКО ВРЕМЕНИ', 'HOW MUCH TIME', '可用时间')}
      </Text>

      <View style={styles.budgets}>
        {budgetOptions.map((minutes) => (
          <PhysicalPressable
            key={minutes}
            accessibilityRole="button"
            accessibilityLabel={tr(
              language,
              `Выбрать ${minutes / 60} часов`,
              `Choose ${minutes / 60} hours`,
              `选择${minutes / 60}小时`
            )}
            style={[
              styles.budget,
              budgetMinutes === minutes && styles.budgetActive
            ]}
            contentStyle={styles.center}
            onPress={() => setBudgetMinutes(minutes)}
          >
            <Text style={[
              styles.budgetText,
              budgetMinutes === minutes && styles.budgetTextActive
            ]}>
              {minutes / 60} {tr(language, 'ч', 'h', '小时')}
            </Text>
          </PhysicalPressable>
        ))}
      </View>

      <View style={styles.timeline}>
        {day.slots.map((slot, index) => {
          const ready = slot.status === 'ready';

          return (
            <View key={slot.id} style={styles.slotRow}>
              <View style={styles.rail}>
                <View style={[
                  styles.dot,
                  ready ? styles.dotReady : styles.dotBlocked
                ]}>
                  <Text style={styles.dotText}>{index + 1}</Text>
                </View>
                {index < day.slots.length - 1 && <View style={styles.line} />}
              </View>

              <View style={[
                styles.slot,
                ready && styles.slotReady
              ]}>
                <View style={styles.slotHeader}>
                  <View style={styles.slotHeaderCopy}>
                    <Text style={styles.slotTime}>{slotTime(language, slot)}</Text>
                    <Text style={styles.slotTitle}>{slotTitle(language, slot)}</Text>
                  </View>
                  <View style={[
                    styles.status,
                    ready && styles.statusReady
                  ]}>
                    <Text style={[
                      styles.statusText,
                      ready && styles.statusTextReady
                    ]}>
                      {ready
                        ? tr(language, 'ГОТОВО', 'READY', '已就绪')
                        : tr(language, 'НУЖЕН LIVE FEED', 'LIVE FEED NEEDED', '需要实时数据')}
                    </Text>
                  </View>
                </View>

                {slot.kind === 'heritage' && ready ? (
                  <>
                    <Text style={styles.slotBody}>
                      {tr(
                        language,
                        'Варварка во времени: проверенный редакционный маршрут, источники, архивные слои, 3D/AR там, где spatial proof допускает публикацию.',
                        'Varvarka Through Time: a published editorial route with sources, archive layers and 3D/AR where spatial proof allows it.',
                        '“穿越时光的瓦尔瓦尔卡”：已发布的编辑路线，包含来源、档案层，以及在空间验证允许时提供的3D/AR。'
                      )}
                    </Text>
                    <View style={styles.heritageMeta}>
                      <Text style={styles.heritageMetaText}>
                        {slot.heritageNodes?.length ?? 0} {tr(language, 'мест', 'places', '个地点')}
                      </Text>
                      <Text style={styles.heritageMetaText}>
                        {tr(language, 'RU · EN · 中文', 'RU · EN · 中文', 'RU · EN · 中文')}
                      </Text>
                    </View>
                    <PhysicalPressable
                      accessibilityRole="button"
                      accessibilityLabel={tr(
                        language,
                        'Начать историческую часть дня',
                        'Start the history part of the day',
                        '开始当天的历史路线'
                      )}
                      style={styles.primary}
                      contentStyle={styles.center}
                      strong
                      onPress={onStartHistory}
                    >
                      <Text style={styles.primaryText}>
                        {tr(language, 'Начать с Варварки →', 'Start with Varvarka →', '从瓦尔瓦尔卡开始 →')}
                      </Text>
                    </PhysicalPressable>
                  </>
                ) : ready && slot.liveEntity ? (
                  <>
                    <Text style={styles.liveProvider}>
                      {slot.liveEntity.providerName}
                    </Text>
                    <Text style={styles.slotBody}>
                      {language === 'ru'
                        ? slot.liveEntity.titleRu
                        : language === 'zh'
                          ? slot.liveEntity.titleZh
                          : slot.liveEntity.titleEn}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.slotBody}>
                      {unresolvedCopy(language, slot)}
                    </Text>
                    <View style={styles.lockRow}>
                      <Text style={styles.lockMark}>◇</Text>
                      <Text style={styles.lockText}>
                        {tr(
                          language,
                          'Не показываем demo-данные как реальные',
                          'Demo data is never presented as live truth',
                          '不会把演示数据当作实时事实'
                        )}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerKicker}>
          {tr(language, 'КАК ЭТО СТАНЕТ ПОЛНЫМ ПРОДУКТОМ', 'HOW THIS BECOMES THE FULL PRODUCT', '如何变成完整产品')}
        </Text>
        <Text style={styles.footerText}>
          {tr(
            language,
            'Подключаем RUSSPASS / city / partner providers → свежесть и operational status → booking handoff → тот же DestinationPackage переносится в первый регион без московских костылей.',
            'Connect RUSSPASS / city / partner providers → freshness and operational status → booking handoff → the same DestinationPackage moves to the first region without Moscow-only logic.',
            '接入 RUSSPASS / 城市 / 合作方数据 → 新鲜度与运营状态 → 预订跳转 → 同一个 DestinationPackage 可直接复制到首个外部地区。'
          )}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#4f442f',
    backgroundColor: '#13110d',
    padding: 18,
    marginBottom: 20
  },
  top: {
    flexDirection: 'row',
    gap: 14
  },
  topCopy: { flex: 1, minWidth: 0 },
  kicker: {
    color: '#b99b69',
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 1.2,
    fontWeight: '900'
  },
  title: {
    marginTop: 6,
    color: '#fff7e7',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900'
  },
  body: {
    marginTop: 7,
    color: '#ada79d',
    fontSize: 10.5,
    lineHeight: 16
  },
  readiness: {
    width: 78,
    borderRadius: 18,
    padding: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d1912',
    borderWidth: 1,
    borderColor: '#5f5035'
  },
  readinessValue: {
    color: '#e5c888',
    fontSize: 23,
    fontWeight: '900'
  },
  readinessLabel: {
    marginTop: 4,
    color: '#8f8066',
    fontSize: 7,
    lineHeight: 10,
    textAlign: 'center',
    fontWeight: '800'
  },
  label: {
    marginTop: 18,
    marginBottom: 7,
    color: '#756d61',
    fontSize: 8,
    letterSpacing: 1.1,
    fontWeight: '900'
  },
  budgets: {
    flexDirection: 'row',
    gap: 7
  },
  budget: {
    flex: 1,
    minHeight: 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#3e3a32',
    backgroundColor: '#171511'
  },
  budgetActive: {
    backgroundColor: '#d7bb84',
    borderColor: '#e8ca90'
  },
  budgetText: {
    color: '#8f8a80',
    fontSize: 10,
    fontWeight: '900'
  },
  budgetTextActive: { color: '#17130d' },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10
  },
  timeline: { marginTop: 16 },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'stretch'
  },
  rail: {
    width: 38,
    alignItems: 'center'
  },
  dot: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dotReady: { backgroundColor: '#d7bb84' },
  dotBlocked: {
    backgroundColor: '#25231e',
    borderWidth: 1,
    borderColor: '#4b463d'
  },
  dotText: {
    color: '#17130d',
    fontSize: 9,
    fontWeight: '900'
  },
  line: {
    flex: 1,
    width: 1,
    minHeight: 44,
    backgroundColor: '#3d382d'
  },
  slot: {
    flex: 1,
    marginBottom: 11,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#302d27',
    backgroundColor: '#171612'
  },
  slotReady: {
    borderColor: '#5f5137',
    backgroundColor: '#1b1812'
  },
  slotHeader: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start'
  },
  slotHeaderCopy: { flex: 1, minWidth: 0 },
  slotTime: {
    color: '#8c7a5b',
    fontSize: 8,
    fontWeight: '800'
  },
  slotTitle: {
    marginTop: 3,
    color: '#eee8dc',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900'
  },
  status: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: '#302d27'
  },
  statusReady: { backgroundColor: '#26372a' },
  statusText: {
    color: '#938d82',
    fontSize: 6.5,
    fontWeight: '900'
  },
  statusTextReady: { color: '#abd0b1' },
  slotBody: {
    marginTop: 8,
    color: '#aaa69e',
    fontSize: 10,
    lineHeight: 15
  },
  heritageMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 9
  },
  heritageMetaText: {
    color: '#c6a970',
    fontSize: 8,
    fontWeight: '800'
  },
  primary: {
    marginTop: 11,
    minHeight: 43,
    borderRadius: 13,
    backgroundColor: '#d7bb84'
  },
  primaryText: {
    color: '#17130d',
    fontSize: 10,
    fontWeight: '900'
  },
  liveProvider: {
    marginTop: 8,
    color: '#7e9ea7',
    fontSize: 8,
    fontWeight: '900'
  },
  lockRow: {
    marginTop: 9,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center'
  },
  lockMark: {
    color: '#8b7650',
    fontSize: 13
  },
  lockText: {
    flex: 1,
    color: '#756f65',
    fontSize: 8,
    lineHeight: 12,
    fontWeight: '800'
  },
  footer: {
    marginTop: 4,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#101317',
    borderWidth: 1,
    borderColor: '#293239'
  },
  footerKicker: {
    color: '#7e99a1',
    fontSize: 7.5,
    letterSpacing: 1,
    fontWeight: '900'
  },
  footerText: {
    marginTop: 6,
    color: '#99a7ab',
    fontSize: 9.5,
    lineHeight: 15
  }
});
