import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import {
  answerCityConcierge,
  askCityConcierge,
  type CityConciergeAnswer,
  type CityConciergeFact,
  type CityConciergeIntent
} from '../../travel/cityConcierge';
import type { PersonalTrip } from '../../travel/personalTrip';
import PhysicalPressable from '../../ui/PhysicalPressable';

type Props = {
  trip: PersonalTrip;
  language: AppLanguage;
};

const quickIntents: CityConciergeIntent[] = [
  'trip-overview',
  'today',
  'next-commitment',
  'free-time',
  'visited-history',
  'preferences'
];

function locale(language: AppLanguage) {
  return language === 'ru' ? 'ru-RU' : language === 'zh' ? 'zh-CN' : 'en-GB';
}

function maybeTime(language: AppLanguage, value: string | number | undefined) {
  if (value === undefined || typeof value === 'number') return value === undefined ? '' : String(value);
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || !value.includes('T')) return value;
  return new Intl.DateTimeFormat(locale(language), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Moscow'
  }).format(parsed);
}

function maybeDateTime(language: AppLanguage, value: string | number | undefined) {
  if (value === undefined || typeof value === 'number') return value === undefined ? '' : String(value);
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || !value.includes('T')) return value;
  return new Intl.DateTimeFormat(locale(language), {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Moscow'
  }).format(parsed);
}

function intentLabel(language: AppLanguage, intent: CityConciergeIntent) {
  switch (intent) {
    case 'trip-overview': return tr(language, 'Сводка', 'Overview', '行程总览');
    case 'today': return tr(language, 'Что сегодня', 'Today', '今天安排');
    case 'next-commitment': return tr(language, 'Ближайшая бронь', 'Next booking', '下一项预订');
    case 'free-time': return tr(language, 'Свободное время', 'Free time', '空闲时间');
    case 'visited-history': return tr(language, 'Что уже видел', 'Already visited', '已经去过');
    case 'preferences': return tr(language, 'Мои ограничения', 'My constraints', '我的限制');
    default: return tr(language, 'Вопрос', 'Question', '问题');
  }
}

function factLabel(language: AppLanguage, fact: CityConciergeFact) {
  const map: Record<CityConciergeFact['kind'], [string, string, string]> = {
    'trip-day-count': ['Дней', 'Days', '天数'],
    'planned-count': ['В плане', 'Planned', '已计划'],
    'commitment-count': ['Билеты / брони', 'Tickets / bookings', '门票 / 预订'],
    'completed-count': ['Завершено', 'Completed', '已完成'],
    'visited-count': ['Посещено', 'Visited', '已到访'],
    'today-date': ['Дата', 'Date', '日期'],
    'current-item': ['Сейчас', 'Now', '当前'],
    'next-item': ['Дальше', 'Next', '下一项'],
    'next-commitment': ['Фиксировано', 'Fixed commitment', '固定安排'],
    'minutes-until-next-commitment': ['До начала', 'Until start', '距离开始'],
    'free-window': ['Свободное окно', 'Free window', '空闲时段'],
    'conflict-count': ['Конфликты', 'Conflicts', '冲突'],
    'visit': ['Посещено', 'Visited', '已到访'],
    'pace': ['Темп', 'Pace', '节奏'],
    'day-bounds': ['День', 'Day bounds', '每日时间'],
    'lunch-window': ['Обед', 'Lunch', '午餐'],
    'step-free-intent': ['Без ступеней', 'Step-free', '无障碍'],
    'max-continuous-walking': ['Непрерывная ходьба', 'Continuous walking', '连续步行'],
    'priority-mode': ['Приоритет', 'Priority', '优先级']
  };
  return tr(language, ...map[fact.kind]);
}

function enumValue(language: AppLanguage, value: string | number) {
  if (typeof value === 'number') return String(value);
  const values: Record<string, [string, string, string]> = {
    relaxed: ['спокойный', 'relaxed', '轻松'],
    balanced: ['сбалансированный', 'balanced', '均衡'],
    intensive: ['интенсивный', 'intensive', '紧凑'],
    none: ['нет требования', 'no requirement', '无要求'],
    preferred: ['желательно', 'preferred', '优先'],
    required: ['обязательно', 'required', '必须'],
    'must-see': ['главное', 'must-see', '必看'],
    'discover-more': ['больше нового', 'discover more', '探索更多']
  };
  return values[value] ? tr(language, ...values[value]!) : value;
}

function factValue(language: AppLanguage, fact: CityConciergeFact) {
  if (fact.kind === 'free-window' && fact.secondaryValue !== undefined) {
    return `${maybeTime(language, fact.value)}–${maybeTime(language, fact.secondaryValue)}`;
  }
  if (fact.kind === 'day-bounds' || fact.kind === 'lunch-window') {
    return `${fact.value}–${fact.secondaryValue ?? ''}`;
  }
  if (fact.kind === 'next-item' || fact.kind === 'next-commitment') {
    const time = maybeDateTime(language, fact.secondaryValue);
    return time ? `${fact.value} · ${time}` : String(fact.value);
  }
  if (fact.kind === 'visit') {
    return `${fact.value} · ${maybeDateTime(language, fact.secondaryValue)}`;
  }
  if (fact.kind === 'minutes-until-next-commitment' || fact.kind === 'max-continuous-walking') {
    return `${fact.value} ${tr(language, 'мин', 'min', '分钟')}`;
  }
  if (fact.kind === 'completed-count' && fact.secondaryValue !== undefined) {
    return `${fact.value}/${fact.secondaryValue}`;
  }
  return enumValue(language, fact.value);
}

function groundingLabel(language: AppLanguage, fact: CityConciergeFact) {
  const grounding = fact.grounding;
  if (grounding.verification === 'provider-confirmed') {
    return tr(language, 'Провайдер подтверждён · есть receipt evidence', 'Provider confirmed · receipt evidence', '供应商已确认 · 有凭证证据');
  }
  if (grounding.verification === 'user-declared') {
    return tr(language, 'Добавлено вами · не проверено провайдером', 'Added by you · not provider verified', '由你添加 · 未经供应商验证');
  }
  if (grounding.verification === 'derived-local') {
    return tr(language, 'Локальный расчёт · не внешний факт', 'Local derivation · not an external fact', '本地推导 · 非外部事实');
  }
  if (grounding.verification === 'route-completed') {
    return tr(language, 'История маршрута · завершённая остановка', 'Route history · completed stop', '路线历史 · 已完成站点');
  }
  if (grounding.verification === 'user-confirmed') {
    return tr(language, 'Посещение подтверждено вами', 'Visit confirmed by you', '到访由你确认');
  }
  if (grounding.verification === 'provider-receipt') {
    return tr(language, 'Посещение подтверждено receipt провайдера', 'Visit backed by provider receipt', '到访由供应商凭证确认');
  }
  if (grounding.verification === 'proximity') {
    return tr(language, 'Зафиксировано по proximity-событию', 'Recorded from a proximity event', '基于接近事件记录');
  }
  if (grounding.verification === 'default') {
    return tr(language, 'Системное значение по умолчанию', 'System default', '系统默认值');
  }
  if (grounding.authority === 'destination-package') {
    return tr(language, 'Moscow Destination Package', 'Moscow Destination Package', 'Moscow Destination Package');
  }
  return tr(language, 'Локальная запись поездки', 'Local trip record', '本地行程记录');
}

function answerMessage(language: AppLanguage, answer: CityConciergeAnswer) {
  if (answer.status === 'answered') {
    switch (answer.intent) {
      case 'trip-overview':
        return tr(language, 'Вот сводка вашей поездки.', 'Here is your trip overview.', '这是你的行程总览。');
      case 'today':
        return tr(language, 'Вот что уже известно о сегодняшнем плане.', 'Here is what is already known about today.', '这是目前已知的今天安排。');
      case 'next-commitment':
        return tr(language, 'Ближайшее фиксированное обязательство в вашем плане.', 'Your next fixed commitment.', '你行程中的下一项固定安排。');
      case 'free-time':
        return tr(language, 'Нашёл свободное окно только по локальному расписанию.', 'I found a free window from the local schedule only.', '仅根据本地时间表找到一个空闲时段。');
      case 'visited-history':
        return tr(language, 'Вот зафиксированная история посещений.', 'Here is your recorded visit history.', '这是已记录的到访历史。');
      case 'preferences':
        return tr(language, 'Это видимые настройки, которыми сейчас руководствуется план.', 'These are the visible preferences currently guiding the plan.', '这些是当前用于行程规划的可见偏好。');
      default:
        return '';
    }
  }

  switch (answer.reason) {
    case 'external-live-fact-not-authorized':
      return tr(
        language,
        'У меня нет подтверждённого live-источника для этого вопроса. Я не буду угадывать часы работы, цены, наличие, погоду или доступность.',
        'There is no verified live source for this question. I will not guess opening hours, prices, availability, weather or accessibility.',
        '这个问题没有已验证的实时来源。我不会猜测开放时间、价格、可用性、天气或无障碍情况。'
      );
    case 'trip-not-active-today':
      return tr(language, 'Сегодня не входит в даты этой поездки.', 'Today is outside this trip.', '今天不在本次行程日期内。');
    case 'no-upcoming-confirmed-commitment':
      return tr(language, 'Впереди нет подтверждённой фиксированной брони или билета с указанным временем.', 'No upcoming confirmed fixed booking or ticket with a known time.', '没有带明确时间的后续已确认固定预订或门票。');
    case 'no-free-window':
      return tr(language, 'Свободного окна по текущему локальному расписанию не найдено.', 'No free window was found in the current local schedule.', '当前本地时间表中没有找到空闲时段。');
    case 'no-visited-history':
      return tr(language, 'История посещений пока пуста.', 'Visit history is empty.', '到访历史为空。');
    default:
      return tr(
        language,
        'Эта версия консьержа пока отвечает только по вашей поездке, билетам, свободному времени, посещениям и настройкам.',
        'This Concierge version only answers about your trip, commitments, free time, visits and preferences.',
        '当前版本仅回答你的行程、固定安排、空闲时间、到访和偏好。'
      );
  }
}

export default function CityConciergeCard({ trip, language }: Props) {
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState<CityConciergeAnswer>(() => answerCityConcierge({
    trip,
    nowIso: new Date().toISOString(),
    intent: 'trip-overview'
  }));

  const groundingCount = useMemo(
    () => new Set(answer.facts.map((fact) => `${fact.grounding.authority}:${fact.grounding.verification}`)).size,
    [answer]
  );

  const runIntent = (intent: CityConciergeIntent) => {
    setAnswer(answerCityConcierge({
      trip,
      nowIso: new Date().toISOString(),
      intent
    }));
  };

  const ask = () => {
    setAnswer(askCityConcierge({
      trip,
      nowIso: new Date().toISOString(),
      prompt
    }));
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>CITY CONCIERGE · READ-ONLY</Text>
          <Text style={styles.title}>{tr(language, 'Консьерж по вашей поездке', 'Your trip concierge', '你的行程礼宾')}</Text>
          <Text style={styles.body}>
            {tr(
              language,
              'Отвечает только по уже известным данным и показывает источник каждого факта.',
              'Answers only from already-known trip data and shows the authority behind each fact.',
              '仅基于已有行程数据回答，并显示每条事实的来源。'
            )}
          </Text>
        </View>
        <View style={styles.readOnlyBadge}>
          <Text style={styles.readOnlyText}>{tr(language, 'БЕЗ ДЕЙСТВИЙ', 'NO ACTIONS', '不执行操作')}</Text>
        </View>
      </View>

      <View style={styles.warning}>
        <Text style={styles.warningTitle}>
          {tr(language, 'LIVE-ДАННЫЕ НЕ ПОДМЕНЯЮТСЯ', 'NO FAKE LIVE DATA', '不伪造实时数据')}
        </Text>
        <Text style={styles.warningText}>
          {tr(
            language,
            'Нет подтверждённого источника — значит часы работы, цены, наличие, дорога, погода и доступность остаются неизвестными.',
            'Without a verified source, opening hours, prices, availability, routing, weather and accessibility remain unknown.',
            '没有已验证来源时，开放时间、价格、可用性、路线、天气和无障碍信息均保持未知。'
          )}
        </Text>
      </View>

      <View style={styles.quickWrap}>
        {quickIntents.map((intent) => (
          <PhysicalPressable
            key={intent}
            style={styles.quick}
            contentStyle={styles.center}
            accessibilityLabel={`Concierge · ${intentLabel(language, intent)}`}
            onPress={() => runIntent(intent)}
          >
            <Text style={styles.quickText}>{intentLabel(language, intent)}</Text>
          </PhysicalPressable>
        ))}
      </View>

      <View style={styles.askRow}>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder={tr(language, 'Например: когда моя следующая бронь?', 'For example: when is my next booking?', '例如：我的下一项预订是什么时候？')}
          placeholderTextColor="#666d75"
          style={styles.input}
          accessibilityLabel={tr(language, 'Вопрос консьержу', 'Concierge question', '礼宾问题')}
          returnKeyType="send"
          onSubmitEditing={ask}
        />
        <PhysicalPressable
          style={styles.askButton}
          contentStyle={styles.center}
          accessibilityLabel={tr(language, 'Задать вопрос консьержу', 'Ask Concierge', '询问礼宾')}
          onPress={ask}
        >
          <Text style={styles.askText}>{tr(language, 'Спросить', 'Ask', '询问')}</Text>
        </PhysicalPressable>
      </View>

      <View style={styles.answer}>
        <View style={styles.answerTop}>
          <Text style={styles.answerIntent}>{intentLabel(language, answer.intent)}</Text>
          <Text style={styles.sourceCount}>
            {answer.facts.length} {tr(language, 'фактов', 'facts', '条事实')} · {groundingCount} {tr(language, 'типов источников', 'source types', '类来源')}
          </Text>
        </View>
        <Text style={[styles.answerMessage, answer.status !== 'answered' && styles.answerWarning]}>
          {answerMessage(language, answer)}
        </Text>

        {answer.facts.map((fact) => (
          <View key={fact.id} style={styles.fact}>
            <Text style={styles.factLabel}>{factLabel(language, fact)}</Text>
            <Text style={styles.factValue}>{factValue(language, fact)}</Text>
            <Text style={styles.grounding}>{groundingLabel(language, fact)}</Text>
            {fact.grounding.sourceRef ? (
              <Text style={styles.sourceRef}>{fact.grounding.sourceRef}</Text>
            ) : null}
          </View>
        ))}

        {answer.facts.some((fact) => fact.kind === 'free-window') ? (
          <Text style={styles.assumption}>
            {tr(
              language,
              'Свободное окно — только календарный расчёт. Дорога, часы работы, доступность и погода не проверены.',
              'A free window is calendar-only. Routing, opening hours, accessibility and weather are not verified.',
              '空闲时段仅为日程计算；路线、开放时间、无障碍和天气均未验证。'
            )}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#3a403f',
    backgroundColor: '#101514',
    padding: 14,
    marginBottom: 14
  },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  header: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  headerCopy: { flex: 1, minWidth: 0 },
  kicker: { color: '#83a99c', fontSize: 7.5, fontWeight: '900', letterSpacing: 1.05 },
  title: { color: '#edf4ef', fontSize: 16, lineHeight: 20, fontWeight: '900', marginTop: 4 },
  body: { color: '#919b97', fontSize: 8.5, lineHeight: 12, marginTop: 4 },
  readOnlyBadge: { borderRadius: 9, borderWidth: 1, borderColor: '#496057', paddingHorizontal: 7, paddingVertical: 5 },
  readOnlyText: { color: '#8fb0a4', fontSize: 6.5, fontWeight: '900', letterSpacing: 0.6 },
  warning: { marginTop: 10, borderRadius: 13, backgroundColor: '#1b211f', padding: 9 },
  warningTitle: { color: '#c8b77e', fontSize: 7.5, fontWeight: '900', letterSpacing: 0.7 },
  warningText: { color: '#918a75', fontSize: 8, lineHeight: 12, marginTop: 3 },
  quickWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  quick: { minHeight: 34, borderRadius: 11, borderWidth: 1, borderColor: '#374440' },
  quickText: { color: '#adbcb7', fontSize: 7.5, fontWeight: '800' },
  askRow: { flexDirection: 'row', alignItems: 'stretch', gap: 7, marginTop: 10 },
  input: {
    minHeight: 42,
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#303a37',
    backgroundColor: '#171c1a',
    color: '#edf1ef',
    paddingHorizontal: 11,
    fontSize: 9
  },
  askButton: { minHeight: 42, borderRadius: 12, backgroundColor: '#b9cbbf' },
  askText: { color: '#111613', fontSize: 8, fontWeight: '900' },
  answer: { borderTopWidth: 1, borderTopColor: '#29312e', marginTop: 12, paddingTop: 10 },
  answerTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' },
  answerIntent: { color: '#dce8e1', fontSize: 10, fontWeight: '900' },
  sourceCount: { color: '#66716d', fontSize: 6.8 },
  answerMessage: { color: '#aab4af', fontSize: 8.5, lineHeight: 13, marginTop: 5 },
  answerWarning: { color: '#d0aa83' },
  fact: { borderRadius: 11, backgroundColor: '#171c1a', padding: 9, marginTop: 7 },
  factLabel: { color: '#78837f', fontSize: 6.8, fontWeight: '900', letterSpacing: 0.5 },
  factValue: { color: '#edf1ef', fontSize: 9.5, lineHeight: 14, fontWeight: '800', marginTop: 2 },
  grounding: { color: '#87a397', fontSize: 7.2, lineHeight: 11, marginTop: 3 },
  sourceRef: { color: '#6f7773', fontSize: 6.8, lineHeight: 10, marginTop: 2 },
  assumption: { color: '#928b75', fontSize: 7.5, lineHeight: 11, marginTop: 8 }
});
