import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import { moscowVarvarkaDestinationPackage } from '../../travel/moscowDestinationPackage';
import {
  addDestinationNodeToTrip,
  addManualTripItem,
  createPersonalTrip,
  getUnseenDestinationNodes,
  parsePersonalTrip,
  personalTripDayItems,
  recordTripVisit,
  resolvePersonalTripPreferences,
  summarizePersonalTrip,
  syncRouteCompletedVisits,
  type PersonalTrip,
  type PersonalTripCommitment,
  type PersonalTripItemKind
} from '../../travel/personalTrip';
import {
  deriveTripFreeWindows,
  detectTripScheduleConflicts,
  moveTripItem,
  reorderTripDayItems
} from '../../travel/tripScheduler';
import PhysicalPressable from '../../ui/PhysicalPressable';
import TouristTodayCard from './TouristTodayCard';
import MoscowPassportCard from './MoscowPassportCard';
import BookingWalletCard from './BookingWalletCard';
import TripPreferencesCard from './TripPreferencesCard';
import DayReplanCard from './DayReplanCard';
import CityConciergeCard from './CityConciergeCard';

export const PERSONAL_TRIP_STORAGE_KEY = 'moscow:v1:personal-trip';

type Props = {
  language: AppLanguage;
  savedIds: string[];
  visitedIds: string[];
  onOpenPlace: (placeId: string) => void;
};

type CommitmentChoice = 'none' | 'ticket' | 'reservation';

const durationOptions = [1, 2, 3, 5, 7] as const;
const manualKinds: PersonalTripItemKind[] = [
  'museum',
  'food',
  'event',
  'theatre',
  'bar',
  'activity',
  'stay',
  'transport',
  'shopping',
  'other'
];

const kindLabels: Record<AppLanguage, Partial<Record<PersonalTripItemKind, string>>> = {
  ru: {
    museum: 'Музей',
    food: 'Ресторан',
    event: 'Событие',
    theatre: 'Театр',
    bar: 'Бар',
    activity: 'Активность',
    stay: 'Отель',
    transport: 'Транспорт',
    shopping: 'Покупки',
    other: 'Другое'
  },
  en: {
    museum: 'Museum',
    food: 'Restaurant',
    event: 'Event',
    theatre: 'Theatre',
    bar: 'Bar',
    activity: 'Activity',
    stay: 'Stay',
    transport: 'Transport',
    shopping: 'Shopping',
    other: 'Other'
  },
  zh: {
    museum: '博物馆',
    food: '餐厅',
    event: '活动',
    theatre: '剧院',
    bar: '酒吧',
    activity: '体验',
    stay: '住宿',
    transport: '交通',
    shopping: '购物',
    other: '其他'
  }
};

function localDateOnly(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function moscowDateOnly(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return year && month && day ? `${year}-${month}-${day}` : localDateOnly(date);
}

function addDays(dateOnly: string, days: number) {
  const date = new Date(`${dateOnly}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function tripId(startDate: string) {
  return `moscow-trip:${startDate}:${Date.now().toString(36)}`;
}

function itemId(prefix: string) {
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

function moscowTimestamp(dayDate: string, time: string) {
  const normalized = /^\d{2}:\d{2}$/.test(time) ? time : '12:00';
  return `${dayDate}T${normalized}:00+03:00`;
}

function visitTimestamp(dayDate: string) {
  return dayDate === moscowDateOnly()
    ? new Date().toISOString()
    : `${dayDate}T12:00:00+03:00`;
}

function shortDay(language: AppLanguage, dateOnly: string) {
  const date = new Date(`${dateOnly}T12:00:00.000Z`);
  const locale = language === 'ru' ? 'ru-RU' : language === 'zh' ? 'zh-CN' : 'en-GB';
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
}

function timeLabel(value?: string) {
  if (!value) return '';
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Moscow'
  }).format(parsed);
}

function moscowTimeLabel(language: AppLanguage, value: string) {
  const locale = language === 'ru' ? 'ru-RU' : language === 'zh' ? 'zh-CN' : 'en-GB';
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Moscow'
  }).format(new Date(value));
}

function nodeTitle(language: AppLanguage, node: typeof moscowVarvarkaDestinationPackage.nodes[number]) {
  if (language === 'en') return node.titleEn ?? node.titleRu;
  if (language === 'zh') return node.titleZh ?? node.titleRu;
  return node.titleRu;
}

export default function PersonalTripPlanner({
  language,
  savedIds,
  visitedIds,
  onOpenPlace
}: Props) {
  const [trip, setTrip] = useState<PersonalTrip | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [selectedDay, setSelectedDay] = useState(localDateOnly());
  const [startDateInput, setStartDateInput] = useState(localDateOnly());
  const [durationDays, setDurationDays] = useState<(typeof durationOptions)[number]>(3);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualKind, setManualKind] = useState<PersonalTripItemKind>('event');
  const [manualTime, setManualTime] = useState('19:00');
  const [manualEndTime, setManualEndTime] = useState('21:00');
  const [commitmentChoice, setCommitmentChoice] = useState<CommitmentChoice>('none');
  const [manualReference, setManualReference] = useState('');
  const [manualProvider, setManualProvider] = useState('');
  const [manualPartySize, setManualPartySize] = useState('');
  const [manualSeats, setManualSeats] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualExternalUrl, setManualExternalUrl] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(PERSONAL_TRIP_STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const restored = parsePersonalTrip(raw);
        setTrip(restored);
        setSelectedDay(
          restored.days.includes(localDateOnly())
            ? localDateOnly()
            : restored.days[0] ?? restored.startDate
        );
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated || !trip) return;
    AsyncStorage.setItem(PERSONAL_TRIP_STORAGE_KEY, JSON.stringify(trip)).catch(() => undefined);
  }, [hydrated, trip]);

  useEffect(() => {
    if (!hydrated || !trip || visitedIds.length === 0) return;
    const today = moscowDateOnly();
    if (!trip.days.includes(today)) return;

    const synced = syncRouteCompletedVisits({
      trip,
      pkg: moscowVarvarkaDestinationPackage,
      destinationNodeIds: visitedIds,
      dayDate: today,
      at: new Date().toISOString(),
      idForNode: (nodeId) => itemId(`route-visit:${nodeId}`)
    });

    if (synced.visits.length !== trip.visits.length) setTrip(synced);
  }, [hydrated, trip, visitedIds]);

  const summary = useMemo(() => trip ? summarizePersonalTrip(trip) : null, [trip]);
  const tripPreferences = useMemo(() => trip ? resolvePersonalTripPreferences(trip) : null, [trip]);
  const activeItems = useMemo(
    () => trip && trip.days.includes(selectedDay) ? personalTripDayItems(trip, selectedDay) : [],
    [selectedDay, trip]
  );
  const unseen = useMemo(
    () => trip
      ? getUnseenDestinationNodes({
          pkg: moscowVarvarkaDestinationPackage,
          trip,
          visitedDestinationNodeIds: visitedIds
        })
      : [],
    [trip, visitedIds]
  );
  const savedNodes = useMemo(
    () => moscowVarvarkaDestinationPackage.nodes.filter((node) => savedIds.includes(node.id)),
    [savedIds]
  );
  const visitByItemId = useMemo(
    () => new Map((trip?.visits ?? []).flatMap((visit) => visit.itemId ? [[visit.itemId, visit] as const] : [])),
    [trip]
  );
  const dayConflicts = useMemo(
    () => trip ? detectTripScheduleConflicts(trip).filter((conflict) => conflict.dayDate === selectedDay) : [],
    [selectedDay, trip]
  );
  const freeWindows = useMemo(() => {
    if (!trip || !trip.days.includes(selectedDay)) return [];
    return deriveTripFreeWindows({
      trip,
      dayDate: selectedDay,
      dayStartsAt: moscowTimestamp(selectedDay, tripPreferences?.dayStart ?? '09:00'),
      dayEndsAt: moscowTimestamp(selectedDay, tripPreferences?.dayEnd ?? '23:00'),
      minimumMinutes: 45,
      reservedWindows: tripPreferences?.lunchWindow
        ? [{
            startsAt: moscowTimestamp(selectedDay, tripPreferences.lunchWindow.start),
            endsAt: moscowTimestamp(selectedDay, tripPreferences.lunchWindow.end),
            reason: 'meal'
          }]
        : []
    });
  }, [
    selectedDay,
    trip,
    tripPreferences?.dayStart,
    tripPreferences?.dayEnd,
    tripPreferences?.lunchWindow?.start,
    tripPreferences?.lunchWindow?.end
  ]);

  const createTrip = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDateInput)) return;
    const createdAt = new Date().toISOString();
    try {
      const next = createPersonalTrip({
        id: tripId(startDateInput),
        destinationId: 'moscow',
        title: tr(language, 'Моя поездка в Москву', 'My Moscow trip', '我的莫斯科之旅'),
        startDate: startDateInput,
        endDate: addDays(startDateInput, durationDays - 1),
        createdAt
      });
      setTrip(next);
      setSelectedDay(next.days[0] ?? startDateInput);
    } catch {
      return;
    }
  };

  const addNode = (nodeId: string) => {
    if (!trip) return;
    const node = moscowVarvarkaDestinationPackage.nodes.find((candidate) => candidate.id === nodeId);
    if (!node) return;
    if (trip.items.some((item) => item.destinationNodeId === nodeId && item.dayDate === selectedDay)) return;

    const now = new Date().toISOString();
    setTrip(addDestinationNodeToTrip({
      trip,
      node,
      itemId: itemId(`node:${node.id}`),
      dayDate: selectedDay,
      updatedAt: now
    }));
  };

  const addManual = () => {
    if (!trip || !manualTitle.trim()) return;
    const now = new Date().toISOString();
    const commitment: PersonalTripCommitment | undefined = commitmentChoice === 'none'
      ? undefined
      : {
          kind: commitmentChoice,
          status: 'confirmed',
          verification: 'user-declared',
          ...(manualReference.trim() ? { reference: manualReference.trim() } : {}),
          ...(manualProvider.trim() ? { provider: manualProvider.trim() } : {}),
          ...(manualPartySize.trim() ? { partySize: Number(manualPartySize.trim()) } : {}),
          ...(manualSeats.trim() ? { seats: manualSeats.trim() } : {}),
          ...(manualAddress.trim() ? { address: manualAddress.trim() } : {}),
          ...(manualExternalUrl.trim() ? { externalUrl: manualExternalUrl.trim() } : {})
        };

    try {
      setFormError('');
      setTrip(addManualTripItem({
        trip,
        itemId: itemId('manual'),
        dayDate: selectedDay,
        title: manualTitle,
        kind: manualKind,
        plannedStartAt: moscowTimestamp(selectedDay, manualTime),
        plannedEndAt: moscowTimestamp(selectedDay, manualEndTime),
        updatedAt: now,
        ...(commitment ? { commitment } : {})
      }));
      setManualTitle('');
      setManualReference('');
      setManualProvider('');
      setManualPartySize('');
      setManualSeats('');
      setManualAddress('');
      setManualExternalUrl('');
      setManualTime('19:00');
      setManualEndTime('21:00');
      setCommitmentChoice('none');
      setManualOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'invalid-trip-item');
      return;
    }
  };

  const moveItemToAdjacentDay = (tripItemId: string, offset: -1 | 1) => {
    if (!trip) return;
    const item = trip.items.find((candidate) => candidate.id === tripItemId);
    if (!item || visitByItemId.has(item.id)) return;
    const currentIndex = trip.days.indexOf(item.dayDate);
    const targetDay = trip.days[currentIndex + offset];
    if (!targetDay) return;
    try {
      setTrip(moveTripItem({
        trip,
        itemId: item.id,
        targetDayDate: targetDay,
        updatedAt: new Date().toISOString()
      }));
    } catch {
      return;
    }
  };

  const reorderItem = (tripItemId: string, offset: -1 | 1) => {
    if (!trip) return;
    const ids = activeItems.map((item) => item.id);
    const index = ids.indexOf(tripItemId);
    const target = index + offset;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    try {
      setTrip(reorderTripDayItems({
        trip,
        dayDate: selectedDay,
        orderedItemIds: ids,
        updatedAt: new Date().toISOString()
      }));
    } catch {
      return;
    }
  };

  const markVisited = (tripItemId: string) => {
    if (!trip) return;
    const item = trip.items.find((candidate) => candidate.id === tripItemId);
    if (!item) return;

    const at = visitTimestamp(item.dayDate);
    setTrip(recordTripVisit({
      trip,
      visitId: itemId(`visit:${tripItemId}`),
      itemId: tripItemId,
      ...(item.destinationNodeId ? { destinationNodeId: item.destinationNodeId } : {}),
      dayDate: item.dayDate,
      visitedAt: at,
      title: item.title,
      kind: item.kind,
      evidence: 'user-confirmed',
      updatedAt: new Date().toISOString()
    }));
  };

  if (!trip) {
    return (
      <View style={styles.root}>
        <Text style={styles.kicker}>{tr(language, 'МОЯ ПОЕЗДКА', 'MY TRIP', '我的行程')}</Text>
        <Text style={styles.title}>
          {tr(
            language,
            'Соберите Москву по дням',
            'Build Moscow day by day',
            '按天规划莫斯科行程'
          )}
        </Text>
        <Text style={styles.body}>
          {tr(
            language,
            'Добавляйте места, рестораны, театры, события и уже купленные билеты. После визита они останутся в вашей истории Москвы.',
            'Add places, restaurants, theatres, events and tickets you already bought. After the visit they remain in your Moscow history.',
            '添加景点、餐厅、剧院、活动和已购买的门票。到访后，它们会保留在你的莫斯科足迹中。'
          )}
        </Text>

        <Text style={styles.label}>{tr(language, 'ДАТА ПРИЕЗДА', 'ARRIVAL DATE', '抵达日期')}</Text>
        <TextInput
          value={startDateInput}
          onChangeText={setStartDateInput}
          placeholder="2026-10-02"
          placeholderTextColor="#666d75"
          style={styles.input}
          autoCapitalize="none"
        />

        <Text style={styles.label}>{tr(language, 'СКОЛЬКО ДНЕЙ', 'HOW MANY DAYS', '行程天数')}</Text>
        <View style={styles.chips}>
          {durationOptions.map((days) => (
            <PhysicalPressable
              key={days}
              style={[styles.chip, durationDays === days && styles.chipActive]}
              contentStyle={styles.center}
              onPress={() => setDurationDays(days)}
            >
              <Text style={[styles.chipText, durationDays === days && styles.chipTextActive]}>{days}</Text>
            </PhysicalPressable>
          ))}
        </View>

        <PhysicalPressable style={styles.primary} contentStyle={styles.center} strong onPress={createTrip}>
          <Text style={styles.primaryText}>{tr(language, 'Создать поездку', 'Create trip', '创建行程')}</Text>
        </PhysicalPressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.kicker}>{tr(language, 'МОЯ ПОЕЗДКА', 'MY TRIP', '我的行程')}</Text>
          <Text style={styles.title}>{trip.title}</Text>
          <Text style={styles.body}>
            {trip.startDate} → {trip.endDate}
          </Text>
        </View>
        <PhysicalPressable
          style={styles.reset}
          contentStyle={styles.center}
          onPress={() => {
            setTrip(null);
            AsyncStorage.removeItem(PERSONAL_TRIP_STORAGE_KEY).catch(() => undefined);
          }}
        >
          <Text style={styles.resetText}>{tr(language, 'Новая', 'New', '新行程')}</Text>
        </PhysicalPressable>
      </View>

      {summary && (
        <View style={styles.metrics}>
          <View style={styles.metric}><Text style={styles.metricValue}>{summary.dayCount}</Text><Text style={styles.metricLabel}>{tr(language, 'дней', 'days', '天')}</Text></View>
          <View style={styles.metric}><Text style={styles.metricValue}>{summary.commitmentCount}</Text><Text style={styles.metricLabel}>{tr(language, 'броней', 'bookings', '预订')}</Text></View>
          <View style={styles.metric}><Text style={styles.metricValue}>{summary.visitedCount}</Text><Text style={styles.metricLabel}>{tr(language, 'посещено', 'visited', '已到访')}</Text></View>
        </View>
      )}

      <TripPreferencesCard
        trip={trip}
        language={language}
        onUpdate={setTrip}
      />

      <CityConciergeCard trip={trip} language={language} />

      <TouristTodayCard
        trip={trip}
        language={language}
        visitedIds={visitedIds}
        onOpenPlace={onOpenPlace}
      />

      <BookingWalletCard trip={trip} language={language} />

      <DayReplanCard
        trip={trip}
        dayDate={selectedDay}
        language={language}
        onUpdate={setTrip}
      />

      <Text style={styles.label}>{tr(language, 'ДНИ ПОЕЗДКИ', 'TRIP DAYS', '行程日期')}</Text>
      <View style={styles.dayChips}>
        {trip.days.map((day, index) => (
          <PhysicalPressable
            key={day}
            style={[styles.dayChip, selectedDay === day && styles.dayChipActive]}
            contentStyle={styles.center}
            onPress={() => setSelectedDay(day)}
          >
            <Text style={[styles.dayNumber, selectedDay === day && styles.dayNumberActive]}>
              {tr(language, `День ${index + 1}`, `Day ${index + 1}`, `第${index + 1}天`)}
            </Text>
            <Text style={[styles.dayDate, selectedDay === day && styles.dayDateActive]}>{shortDay(language, day)}</Text>
          </PhysicalPressable>
        ))}
      </View>

      <View style={styles.sectionTop}>
        <View>
          <Text style={styles.kicker}>{tr(language, 'ПЛАН ДНЯ', 'DAY PLAN', '当天计划')}</Text>
          <Text style={styles.sectionTitle}>{shortDay(language, selectedDay)}</Text>
        </View>
        <PhysicalPressable style={styles.smallPrimary} contentStyle={styles.center} onPress={() => setManualOpen((value) => !value)}>
          <Text style={styles.smallPrimaryText}>{manualOpen ? '×' : '+'} {tr(language, 'Добавить', 'Add', '添加')}</Text>
        </PhysicalPressable>
      </View>

      {manualOpen && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{tr(language, 'Добавить своё', 'Add your own', '添加自定义项目')}</Text>
          <TextInput
            value={manualTitle}
            onChangeText={setManualTitle}
            placeholder={tr(language, 'Например: Большой театр', 'For example: Bolshoi Theatre', '例如：莫斯科大剧院')}
            placeholderTextColor="#626972"
            style={styles.input}
          />

          <Text style={styles.label}>{tr(language, 'ТИП', 'TYPE', '类型')}</Text>
          <View style={styles.wrapChips}>
            {manualKinds.map((kind) => (
              <PhysicalPressable
                key={kind}
                style={[styles.kindChip, manualKind === kind && styles.kindChipActive]}
                contentStyle={styles.center}
                onPress={() => setManualKind(kind)}
              >
                <Text style={[styles.kindText, manualKind === kind && styles.kindTextActive]}>
                  {kindLabels[language][kind] ?? kind}
                </Text>
              </PhysicalPressable>
            ))}
          </View>

          <View style={styles.inlineFields}>
            <View style={styles.field}>
              <Text style={styles.label}>{tr(language, 'ВРЕМЯ', 'TIME', '时间')}</Text>
              <TextInput
                value={manualTime}
                onChangeText={setManualTime}
                placeholder="19:00"
                placeholderTextColor="#626972"
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{tr(language, 'ДО', 'UNTIL', '结束')}</Text>
              <TextInput
                value={manualEndTime}
                onChangeText={setManualEndTime}
                placeholder="21:00"
                placeholderTextColor="#626972"
                style={styles.input}
              />
            </View>
          </View>

          <Text style={styles.label}>{tr(language, 'УЖЕ ЕСТЬ', 'ALREADY HAVE', '已有')}</Text>
          <View style={styles.chips}>
            {(['none', 'ticket', 'reservation'] as CommitmentChoice[]).map((choice) => (
              <PhysicalPressable
                key={choice}
                style={[styles.commitChip, commitmentChoice === choice && styles.commitChipActive]}
                contentStyle={styles.center}
                onPress={() => setCommitmentChoice(choice)}
              >
                <Text style={[styles.commitText, commitmentChoice === choice && styles.commitTextActive]}>
                  {choice === 'none'
                    ? tr(language, 'Нет', 'None', '无')
                    : choice === 'ticket'
                      ? tr(language, 'Билет', 'Ticket', '门票')
                      : tr(language, 'Бронь', 'Reservation', '预订')}
                </Text>
              </PhysicalPressable>
            ))}
          </View>

          {commitmentChoice !== 'none' && (
            <>
              <Text style={styles.truthNote}>
                {tr(
                  language,
                  'Сохраняется как указанное вами подтверждение, а не как проверка провайдера.',
                  'Saved as a confirmation declared by you, not as provider verification.',
                  '将保存为你自行填写的确认信息，并非平台已验证的供应商凭证。'
                )}
              </Text>
              <TextInput
                value={manualProvider}
                onChangeText={setManualProvider}
                placeholder={tr(language, 'Где куплено / забронировано', 'Where it was booked / bought', '购买 / 预订平台')}
                placeholderTextColor="#626972"
                style={styles.input}
              />
              <TextInput
                value={manualReference}
                onChangeText={setManualReference}
                placeholder={tr(language, 'Номер заказа / заметка (необязательно)', 'Order reference / note (optional)', '订单号 / 备注（可选）')}
                placeholderTextColor="#626972"
                style={[styles.input, styles.inputSpaced]}
              />
              <TextInput
                value={manualPartySize}
                onChangeText={setManualPartySize}
                placeholder={tr(language, 'Количество гостей / билетов', 'Party size / ticket count', '人数 / 门票数量')}
                placeholderTextColor="#626972"
                keyboardType="number-pad"
                style={[styles.input, styles.inputSpaced]}
              />
              <TextInput
                value={manualSeats}
                onChangeText={setManualSeats}
                placeholder={tr(language, 'Сектор, ряд, места', 'Section, row, seats', '区域、排、座位')}
                placeholderTextColor="#626972"
                style={[styles.input, styles.inputSpaced]}
              />
              <TextInput
                value={manualAddress}
                onChangeText={setManualAddress}
                placeholder={tr(language, 'Адрес / место встречи', 'Address / meeting point', '地址 / 集合地点')}
                placeholderTextColor="#626972"
                style={[styles.input, styles.inputSpaced]}
              />
              <TextInput
                value={manualExternalUrl}
                onChangeText={setManualExternalUrl}
                placeholder={tr(language, 'https:// ссылка на билет / бронь', 'https:// ticket / reservation link', 'https:// 门票 / 预订链接')}
                placeholderTextColor="#626972"
                autoCapitalize="none"
                style={[styles.input, styles.inputSpaced]}
              />
            </>
          )}

          {formError ? (
            <Text style={styles.formError}>
              {formError.includes('HTTPS')
                ? tr(language, 'Ссылка должна начинаться с https://', 'The link must start with https://', '链接必须以 https:// 开头')
                : tr(language, 'Проверьте время и данные пункта', 'Check the time and item details', '请检查时间和项目详情')}
            </Text>
          ) : null}
          <PhysicalPressable style={styles.primary} contentStyle={styles.center} strong onPress={addManual}>
            <Text style={styles.primaryText}>{tr(language, 'Добавить в день', 'Add to day', '添加到当天')}</Text>
          </PhysicalPressable>
        </View>
      )}

      {dayConflicts.length > 0 && (
        <View style={styles.conflictBox}>
          <Text style={styles.conflictTitle}>
            {tr(language, 'КОНФЛИКТ ВРЕМЕНИ', 'TIME CONFLICT', '时间冲突')}
          </Text>
          {dayConflicts.map((conflict) => {
            const left = trip.items.find((item) => item.id === conflict.itemIds[0]);
            const right = trip.items.find((item) => item.id === conflict.itemIds[1]);
            return (
              <Text key={conflict.itemIds.join(':')} style={styles.conflictText}>
                {left?.title ?? conflict.itemIds[0]} ↔ {right?.title ?? conflict.itemIds[1]} · {moscowTimeLabel(language, conflict.overlapStartAt)}–{moscowTimeLabel(language, conflict.overlapEndAt)}
              </Text>
            );
          })}
        </View>
      )}

      {activeItems.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{tr(language, 'День пока свободен', 'This day is still open', '这一天尚未安排')}</Text>
          <Text style={styles.emptyBody}>
            {tr(
              language,
              'Добавьте сохранённое место или внесите билет/бронь, которые у вас уже есть.',
              'Add a saved place or enter a ticket/reservation you already have.',
              '添加收藏地点，或录入你已有的门票/预订。'
            )}
          </Text>
        </View>
      ) : activeItems.map((item) => {
        const visited = visitByItemId.has(item.id);
        return (
          <View key={item.id} style={[styles.timelineItem, visited && styles.timelineItemDone]}>
            <View style={styles.timelineMarker}>
              <Text style={styles.timelineMarkerText}>{visited ? '✓' : timeLabel(item.plannedStartAt) || '•'}</Text>
            </View>
            <View style={styles.timelineCopy}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>
                {(kindLabels[language][item.kind] ?? item.kind)}
                {item.plannedStartAt ? ` · ${timeLabel(item.plannedStartAt)}${item.plannedEndAt ? `–${timeLabel(item.plannedEndAt)}` : ''}` : ''}
                {item.commitment
                  ? ` · ${item.commitment.kind === 'ticket' ? tr(language, 'билет', 'ticket', '门票') : tr(language, 'бронь', 'reservation', '预订')}`
                  : ''}
              </Text>
              {item.commitment?.provider || item.commitment?.reference ? (
                <Text style={styles.commitmentProvider}>
                  {item.commitment.provider ? `${tr(language, 'Источник', 'Source', '来源')}: ${item.commitment.provider}` : ''}
                  {item.commitment.reference ? `${item.commitment.provider ? ' · ' : ''}${item.commitment.reference}` : ''}
                </Text>
              ) : null}
              {item.commitment?.partySize ? (
                <Text style={styles.commitmentDetail}>
                  {tr(language, 'Гостей / билетов', 'Guests / tickets', '人数 / 门票')}: {item.commitment.partySize}
                </Text>
              ) : null}
              {item.commitment?.seats ? (
                <Text style={styles.commitmentDetail}>
                  {tr(language, 'Места', 'Seats', '座位')}: {item.commitment.seats}
                </Text>
              ) : null}
              {item.commitment?.address ? (
                <Text style={styles.commitmentDetail}>
                  {tr(language, 'Адрес', 'Address', '地址')}: {item.commitment.address}
                </Text>
              ) : null}
              {item.commitment && (
                <Text style={styles.commitmentStatus}>
                  {item.commitment.verification === 'provider-confirmed'
                    ? tr(language, 'Подтверждено провайдером', 'Provider confirmed', '供应商已确认')
                    : tr(language, 'Добавлено вами · не проверено провайдером', 'Added by you · not provider verified', '由你添加 · 未经供应商验证')}
                </Text>
              )}
              <View style={styles.itemActions}>
                {!visited && item.commitment?.status !== 'confirmed' && activeItems.length > 1 && (
                  <>
                    <PhysicalPressable
                      style={styles.iconButton}
                      contentStyle={styles.center}
                      disabled={activeItems[0]?.id === item.id}
                      accessibilityLabel={tr(language, `Переместить ${item.title} выше`, `Move ${item.title} up`, `将 ${item.title} 上移`)}
                      onPress={() => reorderItem(item.id, -1)}
                    >
                      <Text style={styles.iconButtonText}>↑</Text>
                    </PhysicalPressable>
                    <PhysicalPressable
                      style={styles.iconButton}
                      contentStyle={styles.center}
                      disabled={activeItems[activeItems.length - 1]?.id === item.id}
                      accessibilityLabel={tr(language, `Переместить ${item.title} ниже`, `Move ${item.title} down`, `将 ${item.title} 下移`)}
                      onPress={() => reorderItem(item.id, 1)}
                    >
                      <Text style={styles.iconButtonText}>↓</Text>
                    </PhysicalPressable>
                  </>
                )}
                {!visited && trip.days.indexOf(item.dayDate) > 0 && (
                  <PhysicalPressable
                    style={styles.iconButton}
                    contentStyle={styles.center}
                    accessibilityLabel={tr(language, `Перенести ${item.title} на предыдущий день`, `Move ${item.title} to previous day`, `将 ${item.title} 移到前一天`)}
                    onPress={() => moveItemToAdjacentDay(item.id, -1)}
                  >
                    <Text style={styles.iconButtonText}>←</Text>
                  </PhysicalPressable>
                )}
                {!visited && trip.days.indexOf(item.dayDate) < trip.days.length - 1 && (
                  <PhysicalPressable
                    style={styles.iconButton}
                    contentStyle={styles.center}
                    accessibilityLabel={tr(language, `Перенести ${item.title} на следующий день`, `Move ${item.title} to next day`, `将 ${item.title} 移到后一天`)}
                    onPress={() => moveItemToAdjacentDay(item.id, 1)}
                  >
                    <Text style={styles.iconButtonText}>→</Text>
                  </PhysicalPressable>
                )}
                {item.commitment?.externalUrl && (
                  <PhysicalPressable
                    style={styles.textButton}
                    contentStyle={styles.center}
                    onPress={() => { void Linking.openURL(item.commitment!.externalUrl!); }}
                  >
                    <Text style={styles.textButtonText}>{tr(language, 'Билет / бронь', 'Ticket / booking', '门票 / 预订')}</Text>
                  </PhysicalPressable>
                )}
                {item.destinationNodeId && (
                  <PhysicalPressable
                    style={styles.textButton}
                    contentStyle={styles.center}
                    onPress={() => onOpenPlace(item.destinationNodeId!)}
                  >
                    <Text style={styles.textButtonText}>{tr(language, 'Открыть', 'Open', '打开')}</Text>
                  </PhysicalPressable>
                )}
                {!visited && (
                  <PhysicalPressable style={styles.visitButton} contentStyle={styles.center} onPress={() => markVisited(item.id)}>
                    <Text style={styles.visitButtonText}>{tr(language, 'Я был здесь', 'I was here', '我来过这里')}</Text>
                  </PhysicalPressable>
                )}
              </View>
            </View>
          </View>
        );
      })}

      {freeWindows.length > 0 && (
        <>
          <Text style={styles.label}>{tr(language, 'СВОБОДНЫЕ ОКНА', 'FREE WINDOWS', '空闲时段')}</Text>
          <View style={styles.freeWindows}>
            {freeWindows.map((window) => (
              <View key={`${window.startsAt}:${window.endsAt}`} style={styles.freeWindow}>
                <Text style={styles.freeWindowTime}>{moscowTimeLabel(language, window.startsAt)}–{moscowTimeLabel(language, window.endsAt)}</Text>
                <Text style={styles.freeWindowMeta}>
                  {window.minutes} {tr(language, 'мин · без учёта дороги и часов работы', 'min · travel/opening hours not verified', '分钟 · 未核验交通与营业时间')}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {savedNodes.length > 0 && (
        <>
          <Text style={styles.label}>{tr(language, 'ИЗ СОХРАНЁННОГО', 'FROM SAVED', '从收藏中添加')}</Text>
          <View style={styles.quickList}>
            {savedNodes.slice(0, 5).map((node) => {
              const added = trip.items.some((item) => item.destinationNodeId === node.id && item.dayDate === selectedDay);
              return (
                <View key={node.id} style={styles.quickRow}>
                  <View style={styles.quickCopy}>
                    <Text style={styles.quickTitle}>{nodeTitle(language, node)}</Text>
                    <Text style={styles.quickMeta}>{node.kind}</Text>
                  </View>
                  <PhysicalPressable
                    style={[styles.addButton, added && styles.disabled]}
                    contentStyle={styles.center}
                    disabled={added}
                    onPress={() => addNode(node.id)}
                  >
                    <Text style={styles.addButtonText}>{added ? '✓' : '+'}</Text>
                  </PhysicalPressable>
                </View>
              );
            })}
          </View>
        </>
      )}

      {unseen.length > 0 && (
        <>
          <View style={styles.sectionTop}>
            <View>
              <Text style={styles.kicker}>{tr(language, 'ЧТО ЕЩЁ УВИДЕТЬ', 'WHAT ELSE TO SEE', '还可以去哪里')}</Text>
              <Text style={styles.sectionTitle}>{tr(language, 'Ещё не в плане и не посещено', 'Not planned or visited yet', '尚未计划或到访')}</Text>
            </View>
          </View>
          <View style={styles.quickList}>
            {unseen.slice(0, 4).map((node) => (
              <View key={node.id} style={styles.quickRow}>
                <PhysicalPressable style={styles.quickCopy} contentStyle={styles.quickCopyContent} onPress={() => onOpenPlace(node.id)}>
                  <Text style={styles.quickTitle}>{nodeTitle(language, node)}</Text>
                  <Text style={styles.quickMeta}>{tr(language, 'Проверенное место из Moscow Destination', 'Source-backed Moscow place', '莫斯科目的地中的已验证地点')}</Text>
                </PhysicalPressable>
                <PhysicalPressable style={styles.addButton} contentStyle={styles.center} onPress={() => addNode(node.id)}>
                  <Text style={styles.addButtonText}>+</Text>
                </PhysicalPressable>
              </View>
            ))}
          </View>
        </>
      )}

      <MoscowPassportCard trip={trip} language={language} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderRadius: 26, borderWidth: 1, borderColor: '#343a42', backgroundColor: '#101318', padding: 18, marginBottom: 24 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  kicker: { color: '#b99b69', fontSize: 9, letterSpacing: 1.35, fontWeight: '900' },
  title: { color: '#fff8ea', fontSize: 23, lineHeight: 29, fontWeight: '900', marginTop: 5 },
  body: { color: '#9da2aa', fontSize: 12, lineHeight: 18, marginTop: 6 },
  label: { color: '#737a83', fontSize: 8, letterSpacing: 1.15, fontWeight: '900', marginTop: 16, marginBottom: 7 },
  input: { minHeight: 47, borderRadius: 14, borderWidth: 1, borderColor: '#363c44', backgroundColor: '#171b20', color: '#f2eee5', paddingHorizontal: 13, fontSize: 13 },
  inputSpaced: { marginTop: 7 },
  formError: { color: '#dc9e94', fontSize: 9, lineHeight: 14, marginTop: 8 },
  chips: { flexDirection: 'row', gap: 7 },
  chip: { flex: 1, minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: '#3b424a' },
  chipActive: { backgroundColor: '#d7bb84', borderColor: '#d7bb84' },
  chipText: { color: '#aeb3ba', fontSize: 11, fontWeight: '900' },
  chipTextActive: { color: '#17130d' },
  primary: { minHeight: 50, borderRadius: 15, backgroundColor: '#d7bb84', marginTop: 14 },
  primaryText: { color: '#17130d', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headingCopy: { flex: 1, minWidth: 0 },
  reset: { minHeight: 38, borderRadius: 12, borderWidth: 1, borderColor: '#3c424a', paddingHorizontal: 10 },
  resetText: { color: '#ad9a77', fontSize: 9, fontWeight: '900' },
  metrics: { flexDirection: 'row', gap: 8, marginTop: 15 },
  metric: { flex: 1, borderRadius: 15, backgroundColor: '#181c22', padding: 12 },
  metricValue: { color: '#e3c486', fontSize: 21, fontWeight: '900' },
  metricLabel: { color: '#777e87', fontSize: 9, marginTop: 3 },
  dayChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  dayChip: { minWidth: 88, minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: '#353b43', paddingHorizontal: 10 },
  dayChipActive: { borderColor: '#ad915f', backgroundColor: '#211b13' },
  dayNumber: { color: '#777e87', fontSize: 8, fontWeight: '900' },
  dayNumberActive: { color: '#d9ba7e' },
  dayDate: { color: '#bec2c8', fontSize: 10, fontWeight: '800', marginTop: 2 },
  dayDateActive: { color: '#f3dfb6' },
  sectionTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginTop: 20, marginBottom: 9 },
  sectionTitle: { color: '#ece8df', fontSize: 16, lineHeight: 21, fontWeight: '900', marginTop: 4 },
  smallPrimary: { minHeight: 38, borderRadius: 12, backgroundColor: '#262017', paddingHorizontal: 10, borderWidth: 1, borderColor: '#6d5a39' },
  smallPrimaryText: { color: '#e1c184', fontSize: 9, fontWeight: '900' },
  form: { borderRadius: 18, backgroundColor: '#15191e', borderWidth: 1, borderColor: '#30363e', padding: 14, marginBottom: 12 },
  formTitle: { color: '#f0ece4', fontSize: 16, fontWeight: '900', marginBottom: 10 },
  wrapChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  kindChip: { minHeight: 36, borderRadius: 12, borderWidth: 1, borderColor: '#343b43', paddingHorizontal: 9 },
  kindChipActive: { borderColor: '#90784e', backgroundColor: '#241e15' },
  kindText: { color: '#9298a0', fontSize: 9, fontWeight: '800' },
  kindTextActive: { color: '#e1c486' },
  inlineFields: { flexDirection: 'row', gap: 8 },
  field: { flex: 1 },
  commitChip: { flex: 1, minHeight: 40, borderRadius: 12, borderWidth: 1, borderColor: '#383e46' },
  commitChipActive: { borderColor: '#a48858', backgroundColor: '#211b13' },
  commitText: { color: '#9da2aa', fontSize: 9, fontWeight: '900' },
  commitTextActive: { color: '#e5c88e' },
  truthNote: { color: '#8b929a', fontSize: 9, lineHeight: 14, marginVertical: 8 },
  empty: { borderRadius: 17, backgroundColor: '#171b20', padding: 15, marginBottom: 10 },
  emptyTitle: { color: '#ede8df', fontSize: 14, fontWeight: '900' },
  emptyBody: { color: '#858c94', fontSize: 10, lineHeight: 15, marginTop: 4 },
  timelineItem: { flexDirection: 'row', gap: 10, borderRadius: 17, backgroundColor: '#171b20', borderWidth: 1, borderColor: '#292f36', padding: 13, marginBottom: 8 },
  timelineItemDone: { borderColor: '#3e5f49' },
  timelineMarker: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#22272e' },
  timelineMarkerText: { color: '#d8b97d', fontSize: 10, fontWeight: '900' },
  timelineCopy: { flex: 1, minWidth: 0 },
  itemTitle: { color: '#f1ede5', fontSize: 14, fontWeight: '900' },
  itemMeta: { color: '#969ca4', fontSize: 9, marginTop: 3 },
  commitmentProvider: { color: '#9ea5ad', fontSize: 8.5, lineHeight: 12, marginTop: 5 },
  commitmentDetail: { color: '#858d95', fontSize: 8.5, lineHeight: 12, marginTop: 2 },
  commitmentStatus: { color: '#b69a67', fontSize: 8.5, lineHeight: 12, marginTop: 5 },
  itemActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9 },
  iconButton: { width: 34, minHeight: 34, borderRadius: 11, borderWidth: 1, borderColor: '#3b4149' },
  iconButtonText: { color: '#c7b58e', fontSize: 13, fontWeight: '900' },
  textButton: { minHeight: 34, borderRadius: 11, borderWidth: 1, borderColor: '#3b4149', paddingHorizontal: 9 },
  textButtonText: { color: '#c5b28c', fontSize: 8.5, fontWeight: '900' },
  visitButton: { minHeight: 34, borderRadius: 11, backgroundColor: '#d3b578', paddingHorizontal: 10 },
  visitButtonText: { color: '#17130d', fontSize: 8.5, fontWeight: '900' },
  quickList: { gap: 7 },
  quickRow: { minHeight: 58, borderRadius: 15, backgroundColor: '#171b20', flexDirection: 'row', alignItems: 'center', padding: 10 },
  quickCopy: { flex: 1, minWidth: 0, paddingRight: 8 },
  quickCopyContent: { alignItems: 'flex-start', justifyContent: 'center', paddingHorizontal: 0 },
  quickTitle: { color: '#ede9e1', fontSize: 12, fontWeight: '900' },
  quickMeta: { color: '#7e858e', fontSize: 8.5, lineHeight: 12, marginTop: 3 },
  addButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#282116' },
  addButtonText: { color: '#e2c283', fontSize: 18, fontWeight: '900' },
  disabled: { opacity: 0.42 },
  conflictBox: { borderRadius: 15, borderWidth: 1, borderColor: '#754f47', backgroundColor: '#241716', padding: 12, marginBottom: 10 },
  conflictTitle: { color: '#e3a99e', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  conflictText: { color: '#c8a39c', fontSize: 9, lineHeight: 14, marginTop: 5 },
  freeWindows: { gap: 6 },
  freeWindow: { borderRadius: 13, borderWidth: 1, borderColor: '#313941', backgroundColor: '#151a1f', padding: 10 },
  freeWindowTime: { color: '#d5bd8d', fontSize: 11, fontWeight: '900' },
  freeWindowMeta: { color: '#79818a', fontSize: 8.5, marginTop: 3 }
});
