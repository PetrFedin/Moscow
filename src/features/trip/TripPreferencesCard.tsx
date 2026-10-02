import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import {
  resolvePersonalTripPreferences,
  setTripPreferences,
  type PersonalTrip,
  type TripPace,
  type TripPriorityMode
} from '../../travel/personalTrip';
import type { StepFreeIntent } from '../../travel/accessibilityRouteProfile';
import PhysicalPressable from '../../ui/PhysicalPressable';

type Props = {
  trip: PersonalTrip;
  language: AppLanguage;
  onUpdate: (trip: PersonalTrip) => void;
};

const paceOptions: TripPace[] = ['relaxed', 'balanced', 'intensive'];
const priorityOptions: TripPriorityMode[] = ['must-see', 'balanced', 'discover-more'];
const stepFreeOptions: StepFreeIntent[] = ['none', 'preferred', 'required'];

function paceLabel(language: AppLanguage, value: TripPace) {
  if (value === 'relaxed') return tr(language, 'Спокойно', 'Relaxed', '轻松');
  if (value === 'intensive') return tr(language, 'Насыщенно', 'Intensive', '紧凑');
  return tr(language, 'Баланс', 'Balanced', '平衡');
}

function priorityLabel(language: AppLanguage, value: TripPriorityMode) {
  if (value === 'must-see') return tr(language, 'Главное', 'Must-see', '必看');
  if (value === 'discover-more') return tr(language, 'Больше нового', 'Discover more', '探索更多');
  return tr(language, 'Баланс', 'Balanced', '平衡');
}

function stepFreeLabel(language: AppLanguage, value: StepFreeIntent) {
  if (value === 'required') return tr(language, 'Обязательно', 'Required', '必须');
  if (value === 'preferred') return tr(language, 'Желательно', 'Preferred', '优先');
  return tr(language, 'Не задано', 'Not set', '未设置');
}

export default function TripPreferencesCard({ trip, language, onUpdate }: Props) {
  const resolved = resolvePersonalTripPreferences(trip);
  const [open, setOpen] = useState(false);
  const [pace, setPace] = useState<TripPace>(resolved.pace);
  const [priorityMode, setPriorityMode] = useState<TripPriorityMode>(resolved.priorityMode);
  const [stepFreeIntent, setStepFreeIntent] = useState<StepFreeIntent>(resolved.stepFreeIntent);
  const [dayStart, setDayStart] = useState(resolved.dayStart);
  const [dayEnd, setDayEnd] = useState(resolved.dayEnd);
  const [maxWalking, setMaxWalking] = useState(String(resolved.maxContinuousWalkingMinutes));
  const [lunchStart, setLunchStart] = useState(resolved.lunchWindow?.start ?? '');
  const [lunchEnd, setLunchEnd] = useState(resolved.lunchWindow?.end ?? '');
  const [error, setError] = useState('');

  useEffect(() => {
    const next = resolvePersonalTripPreferences(trip);
    setPace(next.pace);
    setPriorityMode(next.priorityMode);
    setStepFreeIntent(next.stepFreeIntent);
    setDayStart(next.dayStart);
    setDayEnd(next.dayEnd);
    setMaxWalking(String(next.maxContinuousWalkingMinutes));
    setLunchStart(next.lunchWindow?.start ?? '');
    setLunchEnd(next.lunchWindow?.end ?? '');
  }, [trip.updatedAt]);

  const save = () => {
    const hasLunch = Boolean(lunchStart.trim() || lunchEnd.trim());
    if (hasLunch && (!lunchStart.trim() || !lunchEnd.trim())) {
      setError(tr(language, 'Для обеда нужны начало и конец окна.', 'Lunch needs both start and end.', '午餐时段需要开始和结束时间。'));
      return;
    }

    try {
      const next = setTripPreferences({
        trip,
        preferences: {
          pace,
          priorityMode,
          stepFreeIntent,
          dayStart: dayStart.trim(),
          dayEnd: dayEnd.trim(),
          maxContinuousWalkingMinutes: Number(maxWalking),
          lunchWindow: hasLunch
            ? { start: lunchStart.trim(), end: lunchEnd.trim() }
            : null
        },
        updatedAt: new Date().toISOString()
      });
      setError('');
      onUpdate(next);
      setOpen(false);
    } catch (caught) {
      const raw = caught instanceof Error ? caught.message : '';
      setError(
        raw.includes('walking')
          ? tr(language, 'Непрерывная прогулка: от 10 до 240 минут.', 'Walking limit must be 10–240 minutes.', '连续步行需为10–240分钟。')
          : tr(language, 'Проверьте время: формат ЧЧ:ММ, конец дня и обеда должен быть позже начала.', 'Check HH:MM times; end must be after start.', '请检查HH:MM时间，结束时间必须晚于开始时间。')
      );
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.kicker}>{tr(language, 'КАК Я ХОЧУ ПРОВЕСТИ ПОЕЗДКУ', 'HOW I WANT TO TRAVEL', '我的出行偏好')}</Text>
          <Text style={styles.title}>{tr(language, 'Настройки поездки', 'Trip preferences', '行程设置')}</Text>
          <Text style={styles.summary}>
            {paceLabel(language, resolved.pace)} · {resolved.dayStart}–{resolved.dayEnd} · {tr(language, 'пешком до', 'walk up to', '连续步行')} {resolved.maxContinuousWalkingMinutes} {tr(language, 'мин', 'min', '分钟')}
          </Text>
          <Text style={styles.summary}>
            {tr(language, 'Без ступеней', 'Step-free', '无障碍')}: {stepFreeLabel(language, resolved.stepFreeIntent)} · {priorityLabel(language, resolved.priorityMode)}
          </Text>
        </View>
        <PhysicalPressable style={styles.edit} contentStyle={styles.center} onPress={() => setOpen((value) => !value)}>
          <Text style={styles.editText}>{open ? '×' : tr(language, 'Изменить', 'Edit', '编辑')}</Text>
        </PhysicalPressable>
      </View>

      {open ? (
        <View style={styles.form}>
          <Text style={styles.label}>{tr(language, 'ТЕМП', 'PACE', '节奏')}</Text>
          <View style={styles.chips}>
            {paceOptions.map((value) => (
              <PhysicalPressable
                key={value}
                style={[styles.chip, pace === value && styles.chipActive]}
                contentStyle={styles.center}
                onPress={() => setPace(value)}
              >
                <Text style={[styles.chipText, pace === value && styles.chipTextActive]}>{paceLabel(language, value)}</Text>
              </PhysicalPressable>
            ))}
          </View>

          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.label}>{tr(language, 'НАЧАЛО ДНЯ', 'DAY START', '开始')}</Text>
              <TextInput value={dayStart} onChangeText={setDayStart} placeholder="09:00" placeholderTextColor="#626972" style={styles.input} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{tr(language, 'КОНЕЦ ДНЯ', 'DAY END', '结束')}</Text>
              <TextInput value={dayEnd} onChangeText={setDayEnd} placeholder="23:00" placeholderTextColor="#626972" style={styles.input} />
            </View>
          </View>

          <Text style={styles.label}>{tr(language, 'БЕЗ СТУПЕНЕЙ', 'STEP-FREE', '无障碍')}</Text>
          <View style={styles.chips}>
            {stepFreeOptions.map((value) => (
              <PhysicalPressable
                key={value}
                style={[styles.chip, stepFreeIntent === value && styles.chipActive]}
                contentStyle={styles.center}
                onPress={() => setStepFreeIntent(value)}
              >
                <Text style={[styles.chipText, stepFreeIntent === value && styles.chipTextActive]}>{stepFreeLabel(language, value)}</Text>
              </PhysicalPressable>
            ))}
          </View>
          {stepFreeIntent !== 'none' ? (
            <Text style={styles.truth}>
              {tr(
                language,
                'Это ваше требование к маршруту. Оно не означает, что конкретный маршрут уже подтверждён как доступный.',
                'This is your routing intent. It does not mean any route is already verified accessible.',
                '这是你的路线需求，并不代表具体路线已被验证为无障碍。'
              )}
            </Text>
          ) : null}

          <Text style={styles.label}>{tr(language, 'МАКС. НЕПРЕРЫВНО ПЕШКОМ, МИН', 'MAX CONTINUOUS WALK, MIN', '最长连续步行，分钟')}</Text>
          <TextInput value={maxWalking} onChangeText={setMaxWalking} keyboardType="number-pad" placeholder="60" placeholderTextColor="#626972" style={styles.input} />

          <Text style={styles.label}>{tr(language, 'ОКНО НА ОБЕД · НЕОБЯЗАТЕЛЬНО', 'LUNCH WINDOW · OPTIONAL', '午餐时段 · 可选')}</Text>
          <View style={styles.fields}>
            <View style={styles.field}>
              <TextInput value={lunchStart} onChangeText={setLunchStart} placeholder="13:00" placeholderTextColor="#626972" style={styles.input} />
            </View>
            <View style={styles.field}>
              <TextInput value={lunchEnd} onChangeText={setLunchEnd} placeholder="14:00" placeholderTextColor="#626972" style={styles.input} />
            </View>
          </View>

          <Text style={styles.label}>{tr(language, 'ПРИОРИТЕТ', 'PRIORITY', '优先级')}</Text>
          <View style={styles.chips}>
            {priorityOptions.map((value) => (
              <PhysicalPressable
                key={value}
                style={[styles.chip, priorityMode === value && styles.chipActive]}
                contentStyle={styles.center}
                onPress={() => setPriorityMode(value)}
              >
                <Text style={[styles.chipText, priorityMode === value && styles.chipTextActive]}>{priorityLabel(language, value)}</Text>
              </PhysicalPressable>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PhysicalPressable style={styles.save} contentStyle={styles.center} strong onPress={save}>
            <Text style={styles.saveText}>{tr(language, 'Сохранить настройки', 'Save preferences', '保存设置')}</Text>
          </PhysicalPressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderRadius: 20, borderWidth: 1, borderColor: '#343a42', backgroundColor: '#13171b', padding: 13, marginTop: 14, marginBottom: 4 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  heading: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  headingCopy: { flex: 1, minWidth: 0 },
  kicker: { color: '#8997a6', fontSize: 7.5, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#e8edf1', fontSize: 15, fontWeight: '900', marginTop: 4 },
  summary: { color: '#899099', fontSize: 8.5, lineHeight: 12, marginTop: 4 },
  edit: { minHeight: 34, borderRadius: 11, borderWidth: 1, borderColor: '#46505a', paddingHorizontal: 8 },
  editText: { color: '#b9c4ce', fontSize: 8, fontWeight: '900' },
  form: { borderTopWidth: 1, borderTopColor: '#2b3238', marginTop: 12, paddingTop: 10 },
  label: { color: '#737d86', fontSize: 7.5, fontWeight: '900', letterSpacing: 0.8, marginTop: 10, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { minHeight: 36, flexGrow: 1, borderRadius: 11, borderWidth: 1, borderColor: '#353e46', paddingHorizontal: 8 },
  chipActive: { borderColor: '#8e7953', backgroundColor: '#231e16' },
  chipText: { color: '#8f98a1', fontSize: 8, fontWeight: '800' },
  chipTextActive: { color: '#e0c486' },
  fields: { flexDirection: 'row', gap: 7 },
  field: { flex: 1 },
  input: { minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: '#343c44', backgroundColor: '#181d22', color: '#e8e7e3', paddingHorizontal: 10, fontSize: 11 },
  truth: { color: '#8e7c5b', fontSize: 8, lineHeight: 12, marginTop: 7 },
  error: { color: '#d49a91', fontSize: 8.5, lineHeight: 13, marginTop: 9 },
  save: { minHeight: 43, borderRadius: 13, backgroundColor: '#d2b679', marginTop: 12 },
  saveText: { color: '#17130d', fontSize: 9, fontWeight: '900' }
});
