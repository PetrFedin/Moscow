import React, { useState } from 'react';
import { Linking, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import type { PersonalTrip } from '../../travel/personalTrip';
import type { CuratedMoscowPlace } from '../../travel/curatedMoscowPlaces';
import {
  officialVenueServiceHandoff,
  saveVenueServiceToTrip,
  venueServiceCapability
} from '../../travel/serviceBookingBridge';
import PhysicalPressable from '../../ui/PhysicalPressable';

type Props = Readonly<{
  place: CuratedMoscowPlace;
  trip: PersonalTrip;
  dayDate: string;
  language: AppLanguage;
  busy: boolean;
  onPersist: (trip: PersonalTrip) => Promise<void>;
  onSaved: () => void;
}>;

export default function VenueServiceIntakeCard({
  place, trip, dayDate, language, busy, onPersist, onSaved
}: Props) {
  const capability = venueServiceCapability(place.kind);
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<'plan' | 'self-reported'>('plan');
  const [startTime, setStartTime] = useState(capability.vertical === 'dining' ? '19:00' : '12:00');
  const [endTime, setEndTime] = useState(capability.vertical === 'dining' ? '21:00' : '14:00');
  const [partySize, setPartySize] = useState('');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const openOfficial = async () => {
    try {
      const verified = officialVenueServiceHandoff(place);
      await Linking.openURL(verified.url);
      setError('');
    } catch {
      setError(tr(language, 'Официальный сайт не удалось открыть.', 'Could not open the official website.', '无法打开官方网站。'));
    }
  };

  const save = async () => {
    if (saving || busy) return;
    setSaving(true);
    try {
      const next = saveVenueServiceToTrip({
        trip, venue: place, dayDate, startTime, endTime, mode,
        itemId: 'venue-service:' + Date.now().toString(36) + ':' + Math.random().toString(36).slice(2, 10),
        updatedAt: new Date().toISOString(),
        ...(partySize.trim() ? { partySize: Number(partySize.trim()) } : {}),
        ...(mode === 'self-reported' && reference.trim() ? { reference } : {})
      });
      await onPersist(next);
      // Successful durable local persistence is required before clearing input
      // or claiming a saved visit/ticket.
      setError('');
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Venue booking could not be saved');
    } finally {
      setSaving(false);
    }
  };

  return <View testID="venue-service-intake" style={styles.root}>
    <Text style={styles.title}>{tr(language, 'Места, билеты и бронирования', 'Visits, tickets & bookings', '行程、门票与预订')}</Text>
    <Text style={styles.body}>{tr(language,
      'Можно указать желаемое время или сохранить уже имеющийся билет/бронь. Доступность и оплата у поставщика не проверяются.',
      'You can plan a time or record a ticket/booking you already hold. No supplier availability or payment is verified.',
      '可计划时间或记录已有门票和预订；不会核实供应商余位或支付。')}</Text>
    <PhysicalPressable
      accessibilityRole="button"
      accessibilityLabel={tr(language, 'Открыть официальный сайт заведения', 'Open official venue website', '打开场馆官方网站')}
      style={styles.outline} contentStyle={styles.inner} onPress={() => { void openOfficial(); }}>
      <Text style={styles.linkText}>{tr(language,
        'Проверить билеты или столики на официальном сайте ↗',
        'Check tickets or tables on the official website ↗',
        '在官网查看门票或餐位 ↗')}</Text>
    </PhysicalPressable>
    <PhysicalPressable
      accessibilityRole="button"
      accessibilityLabel={tr(language, 'Открыть запись времени или билета', 'Record visit time or ticket', '记录时间或门票')}
      style={styles.outline} contentStyle={styles.inner} onPress={() => setExpanded(value => !value)}>
      <Text style={styles.linkText}>{expanded ? tr(language,'Свернуть форму','Close form','收起表单')
        : tr(language,'Внести время / имеющийся билет','Enter time / existing ticket','添加时间或现有门票')}</Text>
    </PhysicalPressable>
    {expanded && <View style={styles.fields}>
      <Text style={styles.body}>{tr(language,'Выбранный день','Selected day','所选日期')}: {dayDate}</Text>
      <PhysicalPressable
        accessibilityRole="button"
        accessibilityState={{ selected: mode === 'plan' }}
        accessibilityLabel={tr(language, 'Только личный план', 'Personal plan only', '仅个人计划')}
        style={[styles.choice, mode === 'plan' && styles.active]}
        contentStyle={styles.inner} onPress={() => { setMode('plan'); setReference(''); }}>
        <Text style={styles.linkText}>{tr(language, '○ Только план, не бронь', '○ Plan only, not a booking', '○ 仅计划，非预订')}</Text>
      </PhysicalPressable>
      {capability.commitmentKind && <PhysicalPressable
        accessibilityRole="button"
        accessibilityState={{ selected: mode === 'self-reported' }}
        accessibilityLabel={tr(language, 'Уже есть мой билет или бронь', 'I already have a ticket or reservation', '我已有门票或预订')}
        style={[styles.choice, mode === 'self-reported' && styles.active]}
        contentStyle={styles.inner} onPress={() => setMode('self-reported')}>
        <Text style={styles.linkText}>{tr(language,
          '○ У меня уже есть ' + (capability.commitmentKind === 'ticket' ? 'билет' : 'бронь') + ' — без проверки поставщика',
          '○ I already hold a booking / ticket (unverified)',
          '○ 我已有预订或门票（未经核验）')}</Text>
      </PhysicalPressable>}
      <View style={styles.times}>
        <View style={styles.timeBox}>
          <Text style={styles.label}>{tr(language,'Начало · Москва','Start · Moscow','开始·莫斯科')}</Text>
          <TextInput testID="venue-service-time-start" accessibilityLabel={tr(language,'Время начала','Start time','开始时间')}
            value={startTime} onChangeText={setStartTime} maxLength={5}
            placeholder="19:00" placeholderTextColor="#9BAA9F" style={styles.input}/>
        </View>
        <View style={styles.timeBox}>
          <Text style={styles.label}>{tr(language,'Окончание · Москва','End · Moscow','结束·莫斯科')}</Text>
          <TextInput testID="venue-service-time-end" accessibilityLabel={tr(language,'Время окончания','End time','结束时间')}
            value={endTime} onChangeText={setEndTime} maxLength={5}
            placeholder="21:00" placeholderTextColor="#9BAA9F" style={styles.input}/>
        </View>
      </View>
      <Text style={styles.note}>{tr(language,
        'Если окончание раньше начала, оно относится к следующему дню. Время берётся из вашей записи, а не из онлайн-расписания.',
        'An earlier end clock means next day. Times come from your entry, not live supplier schedules.',
        '结束时间早于开始时间表示次日；时间来自您的输入而非实时排期。')}</Text>
      <Text style={styles.label}>{tr(language,'Человек / билетов (необязательно)','Guests / tickets (optional)','人数/门票（选填）')}</Text>
      <TextInput testID="venue-service-party-size" accessibilityLabel={tr(language,'Количество гостей или билетов','Guest or ticket count','人数或门票数')}
        inputMode="numeric" value={partySize} onChangeText={setPartySize} maxLength={2}
        placeholder="2" placeholderTextColor="#9BAA9F" style={styles.input}/>
      {mode === 'self-reported' && <><Text style={styles.label}>{tr(language,
        'Ваш номер заказа (необязательно)', 'Your order reference (optional)', '您的订单号（选填）')}</Text>
        <TextInput testID="venue-service-reference" accessibilityLabel={tr(language,'Номер вашего заказа','Your booking reference','您的订单号')}
          value={reference} onChangeText={setReference} maxLength={120}
          placeholder="Номер заказа" placeholderTextColor="#9BAA9F" style={styles.input}/>
      </>}
      {error ? <Text testID="venue-service-intake-error" style={styles.error}>{error}</Text> : null}
      <PhysicalPressable
        testID="venue-service-save"
        accessibilityRole="button"
        accessibilityLabel={tr(language,'Сохранить в мою поездку без подтверждения поставщика','Save to my trip without supplier confirmation','保存到行程但不代表供应商确认')}
        style={styles.action} contentStyle={styles.inner} disabled={saving || busy} onPress={() => { void save(); }}>
        <Text style={styles.actionText}>{saving
          ? tr(language,'Сохраняем…','Saving…','保存中…')
          : tr(language,'Сохранить в мой маршрут','Save to my itinerary','保存到行程')}</Text>
      </PhysicalPressable>
      <Text style={styles.note}>{tr(language,
        'Система не оформляет билет, не резервирует столик, не принимает оплату и не передаёт персональные данные поставщику.',
        'No ticket is issued, table held, payment accepted or personal details submitted to the supplier.',
        '系统不会出票、占座、收款或向供应商提交个人资料。')}</Text>
    </View>}
    {!expanded && error ? <Text testID="venue-service-intake-error" style={styles.error}>{error}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  root: { marginTop: 12, backgroundColor: '#25362C', borderRadius: 16, borderWidth: 1, borderColor: '#57715F', padding: 13 },
  title: { color: '#FBF4E6', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  body: { color: '#E1E7DC', fontSize: 12, lineHeight: 18, marginBottom: 9 },
  note: { color: '#C5D2C4', fontSize: 11, lineHeight: 17, marginTop: 8 },
  outline: { minHeight: 46, borderWidth: 1, borderColor: '#93A997', borderRadius: 12, marginTop: 8 },
  inner: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 9 },
  linkText: { color: '#FFF3DC', fontWeight: '700', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  fields: { marginTop: 12 },
  choice: { minHeight: 44, marginBottom: 6, backgroundColor: '#314D3C', borderRadius: 10 },
  active: { borderColor: '#E6C88E', borderWidth: 2 },
  times: { flexDirection: 'row', gap: 10, marginTop: 8 },
  timeBox: { flex: 1, minWidth: 0 },
  label: { color: '#DCE6DB', fontSize: 12, fontWeight: '600', marginTop: 10, marginBottom: 5 },
  input: { borderRadius: 11, backgroundColor: '#15241D', color: '#FFF7EA', borderWidth: 1, borderColor: '#9BAD9E', padding: 11, minHeight: 48 },
  action: { minHeight: 48, backgroundColor: '#EAD8B6', borderRadius: 12, marginTop: 13 },
  actionText: { color: '#23382A', fontSize: 13, fontWeight: '700' },
  error: { color: '#FFD0BC', fontSize: 12, marginTop: 10 }
});
