import React, { useEffect, useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import type { PersonalTrip } from '../../travel/personalTrip';
import {
  archiveBookingResolution,
  beginBookingResolution,
  bookingResolutionIsOpen,
  latestBookingResolution,
  noteBookingContact,
  noteBookingResponse,
  type BookingResolutionTopic,
  type BookingResolutionEvent
} from '../../travel/bookingResolution';
import { requireAdmittedDestination } from '../../product/travelProductIdentity';
import PhysicalPressable from '../../ui/PhysicalPressable';

type Props = {
  trip: PersonalTrip;
  language: AppLanguage;
  open: boolean;
  focusedItemId?: string;
  onToggle: (next: boolean) => void;
  onUpdate: (nextTrip: PersonalTrip) => Promise<void>;
};

const topics: readonly BookingResolutionTopic[] = [
  'change-date', 'cancel-refund', 'venue-unavailable', 'other'
];

function topicName(language: AppLanguage, topic: BookingResolutionTopic) {
  if (topic === 'change-date') return tr(language, 'Изменить дату', 'Change date', '变更日期');
  if (topic === 'cancel-refund') return tr(language, 'Отмена / возврат', 'Cancel / refund', '取消 / 退款');
  if (topic === 'venue-unavailable') return tr(language, 'Место недоступно', 'Venue unavailable', '场所无法使用');
  return tr(language, 'Другой вопрос', 'Another question', '其他问题');
}

function eventName(language: AppLanguage, kind: BookingResolutionEvent['kind']) {
  if (kind === 'opened') return tr(language, 'Начали разбираться', 'Started inquiry', '开始询问');
  if (kind === 'contact-self-reported') return tr(language, 'Вы отметили попытку связи', 'You recorded an attempt to contact', '已记录联系尝试');
  if (kind === 'reply-self-reported') return tr(language, 'Вы записали ответ своими словами', 'You noted a response in your own words', '已自行记录回复');
  return tr(language, 'Вы архивировали обращение', 'You archived this inquiry', '已归档');
}

function eventTimeLabel(language: AppLanguage, destinationId: string, iso: string) {
  const locale = language === 'ru' ? 'ru-RU' : language === 'zh' ? 'zh-CN' : 'en-GB';
  const timezone = requireAdmittedDestination(destinationId).timezone;
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short'
  }).format(new Date(iso));
}

function bookingRequestTemplate(
  language: AppLanguage, title: string, topic: BookingResolutionTopic, reference?: string
) {
  const ref = reference
    ? tr(language, 'Номер бронирования: ', 'Booking reference: ', '预订编号：') + reference + '. '
    : '';
  return tr(language,
    'Здравствуйте! У меня вопрос по бронированию «' + title + '». ' + ref +
      'Тема: ' + topicName(language, topic) + '. Уточните, пожалуйста, возможные варианты и условия. ' +
      'Буду благодарен за письменное подтверждение ответа.',
    'Hello! I have a question about my booking “' + title + '”. ' + ref +
      'Topic: ' + topicName(language, topic) + '. Could you explain the available options and terms? ' +
      'Please confirm your response in writing.',
    '您好！关于预订“' + title + '”我有一个问题。' + ref +
      '主题：' + topicName(language, topic) + '。请告知可用方案和条件，并提供书面答复。');
}

function uniqueId(prefix: string) {
  return prefix + ':' + Date.now().toString(36) + ':' + Math.random().toString(36).slice(2, 11);
}

export default function BookingResolutionCard({
  trip, language, open, focusedItemId, onToggle, onUpdate
}: Props) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [topic, setTopic] = useState<BookingResolutionTopic>('change-date');
  const [reply, setReply] = useState('');
  const [showTemplate, setShowTemplate] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(12);

  useEffect(() => {
    if (focusedItemId) {
      setSelectedItemId(focusedItemId);
      setReply('');
      setError('');
    }
  }, [focusedItemId]);

  const bookings = useMemo(
    () => trip.items.filter(item => item.commitment !== undefined)
      .sort((a,b) => a.dayDate.localeCompare(b.dayDate)
        || a.title.localeCompare(b.title, 'ru')),
    [trip.items]
  );
  const selected = bookings.find(item => item.id === selectedItemId) ?? bookings[0];
  const current = selected ? latestBookingResolution(trip, selected.id) : undefined;
  const active = current && bookingResolutionIsOpen(current) ? current : undefined;
  const archivedCases = (trip.bookingResolutions ?? []).filter(c =>
    c.itemId === selected?.id && !bookingResolutionIsOpen(c)).slice().reverse();
  const openCount = useMemo(
    () => (trip.bookingResolutions ?? []).filter(bookingResolutionIsOpen).length,
    [trip.bookingResolutions]
  );

  if (bookings.length === 0) return null;

  const run = async (update: () => PersonalTrip, clearReply = false): Promise<void> => {
    if (saving) return;
    setSaving(true);
    try {
      const next = update();
      await onUpdate(next);
      setError('');
      if (clearReply) setReply('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'booking-inquiry-local-error');
    } finally {
      setSaving(false);
    }
  };

  const start = () => {
    if (!selected || active) return;
    const at = new Date().toISOString();
    void run(() => beginBookingResolution({
      trip, itemId: selected.id, topic,
      caseId: uniqueId('booking-case'),
      eventId: uniqueId('booking-open'),
      at
    }));
  };

  const recordContact = () => {
    if (!active) return;
    void run(() => noteBookingContact({
      trip, caseId: active.id,
      eventId: uniqueId('booking-contact'), at: new Date().toISOString()
    }));
  };
  const recordResponse = () => {
    if (!active) return;
    void run(() => noteBookingResponse({
      trip, caseId: active.id, eventId: uniqueId('booking-reply'),
      at: new Date().toISOString(), note: reply
    }), true);
  };
  const archive = () => {
    if (!active) return;
    void run(() => archiveBookingResolution({
      trip, caseId: active.id, eventId: uniqueId('booking-archive'),
      at: new Date().toISOString()
    }));
  };

  return (
    <View testID="booking-resolution-card" style={styles.root}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.kicker}>{tr(language, 'ПОМОЩЬ С БИЛЕТАМИ', 'BOOKING ASSISTANCE', '预订协助')}</Text>
          <Text style={styles.title}>
            {tr(language, 'Если планы изменились', 'When plans change', '计划变更时')}
          </Text>
          <Text style={styles.subtitle}>
            {tr(language,
              'Сохраните свои обращения, включая вопросы об отменённых заказах. Никаких автоматических запросов, переносов или возвратов денег.',
              'Keep your own record of inquiries, including cancelled bookings. No automatic contact, date changes or refunds.',
              '自行记录沟通与已取消预订；不会自动联系供应商、更改日期或退款。')}
          </Text>
        </View>
        <View style={styles.counter}><Text style={styles.counterText}>{openCount}</Text>
          <Text style={styles.counterCaption}>{tr(language,'открыто','open','未结')}</Text>
        </View>
      </View>

      <PhysicalPressable
        accessibilityRole="button"
        accessibilityLabel={open
          ? tr(language,'Свернуть помощь с билетами','Close booking assistance','关闭预订协助')
          : tr(language,'Открыть помощь с билетами','Open booking assistance','打开预订协助')}
        style={styles.toggle} contentStyle={styles.center}
        onPress={() => onToggle(!open)}
      >
        <Text style={styles.toggleText}>{open
          ? tr(language, 'Свернуть', 'Collapse', '收起')
          : tr(language, 'Разобраться с билетом или бронью', 'Get help with a ticket or booking', '处理门票或预订')}</Text>
      </PhysicalPressable>

      {open && selected ? (
        <>
          <Text style={styles.sectionTitle}>{tr(language,'Выберите билет / бронь','Choose ticket / reservation','选择门票 / 预订')}</Text>
          <View style={styles.choices}>
            {bookings.slice(0, visibleLimit).map(item => (
              <PhysicalPressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={tr(language,'Выбрать обращение: ','Select inquiry for: ','选择相关预订：') + item.title}
                style={[styles.choice, selected.id === item.id && styles.choiceActive]}
                contentStyle={styles.choiceContent}
                onPress={() => { setSelectedItemId(item.id); setReply(''); setShowTemplate(false); setError(''); }}
              >
                <Text style={[styles.choiceText, selected.id === item.id && styles.choiceTextActive]}>
                  {item.title} · {item.dayDate}
                  {item.status === 'cancelled' || item.commitment?.status === 'cancelled'
                    ? tr(language, ' · отменено', ' · cancelled', ' · 已取消') : ''}
                </Text>
              </PhysicalPressable>
            ))}
          </View>
          {visibleLimit < bookings.length ? (
            <PhysicalPressable accessibilityRole="button"
              accessibilityLabel={tr(language,'Показать ещё билеты','Show more bookings','显示更多预订')}
              style={styles.secondary} contentStyle={styles.center}
              onPress={() => setVisibleLimit(count => count + 12)}>
              <Text style={styles.secondaryText}>{tr(language,'Показать ещё','Show more','显示更多')}</Text>
            </PhysicalPressable>
          ) : null}

          <View testID={'booking-resolution-selected-' + selected.id} style={styles.selected}>
            <Text style={styles.selectedTitle}>{selected.title}</Text>
            <Text style={styles.selectedSub}>
              {selected.commitment?.provider
                ? tr(language,'Указанный источник: ','Recorded provider: ','记录的供应商：') + selected.commitment.provider
                : tr(language,'Поставщик не указан','No supplier recorded','未记录供应商')}
              {selected.commitment?.reference
                ? ' · ' + tr(language,'Номер: ','Ref: ','编号：') + selected.commitment.reference
                : ''}
            </Text>
            <Text style={styles.truth}>{tr(language,
              'Вся история ниже — ваша личная запись. Наличие ответа, открытие ссылки или закрытие обращения не подтверждают изменение билета.',
              'This is your own record. An answer, link opening or archiving does not verify any ticket change.',
              '以下仅为个人记录；回复、打开链接或归档都不代表票务变更已核实。')}
            </Text>
            {selected.commitment?.externalUrl ? (
              <PhysicalPressable accessibilityRole="link"
                accessibilityLabel={tr(language,'Открыть сохранённую ссылку на билет','Open saved ticket link','打开已保存票务链接')}
                style={styles.secondary} contentStyle={styles.center}
                onPress={() => { void Linking.openURL(selected.commitment!.externalUrl!).catch(() => setError('booking-link-unavailable')); }}>
                <Text style={styles.secondaryText}>{tr(language,'Открыть сохранённую ссылку','Open saved link','打开已保存链接')} ↗</Text>
              </PhysicalPressable>
            ) : null}
          </View>

          {!active ? (
            <View style={styles.panel}>
              {current && <Text style={styles.closed}>
                {tr(language,'Последнее обращение архивировано; можно создать новое.','Previous inquiry archived; you may open a new one.','此前记录已归档，可新建。')}
              </Text>}
              <Text style={styles.sectionTitle}>{tr(language,'О чём хотите спросить?','What would you like to ask?','您想询问什么？')}</Text>
              <View style={styles.choices}>
                {topics.map(value => (
                  <PhysicalPressable key={value} accessibilityRole="button"
                    accessibilityLabel={topicName(language, value)}
                    style={[styles.choice, topic === value && styles.choiceActive]}
                    contentStyle={styles.choiceContent} onPress={() => setTopic(value)}>
                    <Text style={[styles.choiceText, topic === value && styles.choiceTextActive]}>
                      {topicName(language, value)}
                    </Text>
                  </PhysicalPressable>
                ))}
              </View>
              <PhysicalPressable accessibilityRole="button"
                accessibilityLabel={tr(language,'Начать личную запись об обращении','Start personal inquiry record','新建个人沟通记录')}
                style={styles.primary} contentStyle={styles.center}
                disabled={saving}
                onPress={start}>
                <Text style={styles.primaryText}>{tr(language,'Создать обращение','Start an inquiry','新建记录')}</Text>
              </PhysicalPressable>
            </View>
          ) : (
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>
                {tr(language,'Моя история обращения','My inquiry history','我的沟通历史')}
                {' · '}{topicName(language, active.topic)}
              </Text>
              {active.events.map(event => (
                <View key={event.id} style={styles.event}>
                  <Text style={styles.eventTitle}>{eventName(language, event.kind)}</Text>
                  <Text style={styles.eventTime}>{eventTimeLabel(language, trip.destinationId, event.at)}</Text>
                  {event.note ? <Text style={styles.eventNote}>{event.note}</Text> : null}
                </View>
              ))}
              <PhysicalPressable accessibilityRole="button"
                accessibilityLabel={showTemplate
                  ? tr(language,'Скрыть пример запроса поставщику','Hide example supplier request','隐藏消息范本')
                  : tr(language,'Показать пример запроса поставщику','Show example supplier request','显示消息范本')}
                style={styles.secondary} contentStyle={styles.center}
                onPress={() => setShowTemplate(shown => !shown)}>
                <Text style={styles.secondaryText}>{showTemplate
                  ? tr(language,'Скрыть пример сообщения','Hide message example','隐藏消息范本')
                  : tr(language,'Пример сообщения поставщику','Message template for supplier','供应商消息范本')}</Text>
              </PhysicalPressable>
              {showTemplate ? (
                <View style={styles.templateBox}>
                  <Text style={styles.templateHint}>
                    {tr(language,
                      'Выделите текст и скопируйте вручную. Сообщение НЕ отправлено.',
                      'Select and copy the text yourself. Nothing has been sent.',
                      '请自行选择并复制文字；应用不会发送消息。')}
                  </Text>
                  <Text testID="booking-resolution-message-template" selectable style={styles.templateText}>
                    {bookingRequestTemplate(language, selected.title, active.topic, selected.commitment?.reference)}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.sourceDisclaimer}>
                {tr(language,
                  'Отметка контакта добавляется только после вашего реального обращения. Приложение ничего не отправляет.',
                  'Only mark contact after you personally contacted the supplier. This app sends nothing.',
                  '仅在您亲自联系供应商后记录；应用不会发送任何信息。')}
              </Text>
              <PhysicalPressable accessibilityRole="button"
                accessibilityLabel={tr(language,'Я самостоятельно связался с поставщиком','I contacted the supplier myself','我已自行联系供应商')}
                style={styles.secondary} contentStyle={styles.center}
                disabled={saving}
                onPress={recordContact}>
                <Text style={styles.secondaryText}>{tr(language,'Я связался с поставщиком','I contacted the supplier','我已联系供应商')}</Text>
              </PhysicalPressable>
              <Text style={styles.sectionTitle}>{tr(language,'Что вам ответили? (только со слов пользователя)','What did you hear? (your own note)','您收到什么回复？（个人记录）')}</Text>
              <TextInput
                testID="booking-resolution-reply-input"
                accessibilityLabel={tr(language,'Ваша заметка об ответе поставщика','Your note about supplier reply','自行记录供应商回复')}
                multiline
                maxLength={800}
                style={styles.input}
                value={reply}
                onChangeText={setReply}
                placeholder={tr(language,'Запишите ответ или условия переноса своими словами','Write what you were told, in your own words','自行记录对方回复')}
                placeholderTextColor="#799083"
              />
              <PhysicalPressable accessibilityRole="button"
                accessibilityLabel={tr(language,'Сохранить мою заметку об ответе','Save my note about the response','保存个人回复记录')}
                style={styles.secondary} contentStyle={styles.center}
                disabled={!reply.trim() || saving}
                onPress={recordResponse}>
                <Text style={styles.secondaryText}>{tr(language,'Сохранить мою заметку','Save my note','保存我的记录')}</Text>
              </PhysicalPressable>
              <PhysicalPressable accessibilityRole="button"
                accessibilityLabel={tr(language,'Архивировать моё обращение без изменения брони','Archive inquiry without changing booking','归档沟通但不修改预订')}
                style={styles.archive} contentStyle={styles.center} disabled={saving} onPress={archive}>
                <Text style={styles.archiveText}>{tr(language,'Архивировать обращение','Archive inquiry','归档记录')}</Text>
              </PhysicalPressable>
            </View>
          )}
          {archivedCases.length > 0 ? (
            <View testID="booking-resolution-history" style={styles.history}>
              <Text style={styles.sectionTitle}>
                {tr(language, 'Архив моих обращений', 'My past inquiry notes', '我的过往沟通记录')}
              </Text>
              {archivedCases.map(record => (
                <View key={record.id} style={styles.archivedCase}>
                  <Text style={styles.archivedTopic}>{topicName(language, record.topic)}</Text>
                  {record.events.map(event => (
                    <View key={event.id} style={styles.event}>
                      <Text style={styles.eventTitle}>{eventName(language, event.kind)}</Text>
                      <Text style={styles.eventTime}>{eventTimeLabel(language, trip.destinationId, event.at)}</Text>
                      {event.note ? <Text style={styles.eventNote}>{event.note}</Text> : null}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : null}
          {error ? <Text testID="booking-resolution-error" style={styles.error}>{tr(language,
            'Не удалось сохранить обращение. Введённый текст оставлен для повторной попытки.',
            'Inquiry not saved. Your note is retained for retry.',
            '未能保存沟通记录，您的笔记已保留以便重试。')} · {error}</Text> : null}
          <Text style={styles.privacy}>{tr(language,
            'Заметки хранятся локально вместе с поездкой и входят в незашифрованный JSON-экспорт. Не записывайте банковские данные или секреты.',
            'Notes stay locally with your trip and are included in unencrypted JSON backups. Do not enter payment details or secrets.',
            '记录与行程保存在本机，并包含于未加密的 JSON 备份，请勿输入支付或敏感信息。')}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#1B362D', borderWidth: 1, borderColor: '#536E61', borderRadius: 23, padding: 18, marginBottom: 18 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headingCopy: { flex: 1 },
  kicker: { color: '#E9C88D', fontSize: 12, fontWeight: '800', letterSpacing: 0.6 },
  title: { color: '#FFF8EC', fontSize: 21, lineHeight: 28, fontWeight: '700', marginTop: 7 },
  subtitle: { color: '#D6E0D6', fontSize: 14, lineHeight: 21, marginTop: 8 },
  counter: { minWidth: 59, borderRadius: 12, padding: 9, backgroundColor: '#315449', alignItems: 'center' },
  counterText: { color: '#FFF8EC', fontSize: 23, fontWeight: '800' },
  counterCaption: { color: '#E1EBE0', fontSize: 12 },
  toggle: { minHeight: 52, borderRadius: 12, marginTop: 15, backgroundColor: '#F5E8CC' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  toggleText: { color: '#19392F', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  sectionTitle: { color: '#FFF9EC', fontSize: 16, lineHeight: 23, fontWeight: '700', marginTop: 18, marginBottom: 9 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderRadius: 11, minHeight: 46, borderWidth: 1, borderColor: '#83A18A', paddingHorizontal: 11 },
  choiceActive: { borderColor: '#F4E0B7', backgroundColor: '#466653' },
  choiceContent: { alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  choiceText: { fontSize: 13, color: '#DFE9DE', fontWeight: '600' },
  choiceTextActive: { color: '#FFFFFF', fontWeight: '700' },
  selected: { borderRadius: 15, backgroundColor: '#FFF8EC', padding: 16, marginTop: 16 },
  selectedTitle: { fontSize: 18, lineHeight: 25, color: '#193529', fontWeight: '700' },
  selectedSub: { fontSize: 13, lineHeight: 19, color: '#53675C', marginTop: 8 },
  truth: { fontSize: 13, lineHeight: 20, color: '#4A6255', marginTop: 9 },
  panel: { marginTop: 12 },
  closed: { fontSize: 13, lineHeight: 19, color: '#DFE7D7', marginTop: 7 },
  primary: { backgroundColor: '#F5E8CC', borderRadius: 12, minHeight: 52, marginTop: 14 },
  primaryText: { color: '#19392F', fontSize: 15, fontWeight: '700' },
  secondary: { borderRadius: 12, borderWidth: 1, borderColor: '#BACAB6', minHeight: 50, marginTop: 10 },
  secondaryText: { color: '#F5F0E0', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  archive: { minHeight: 48, marginTop: 13 },
  archiveText: { color: '#E5D5BB', fontSize: 14, fontWeight: '700' },
  event: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#536B5B' },
  eventTitle: { color: '#FFF9EC', fontSize: 14, lineHeight: 20, fontWeight: '600' },
  eventTime: { color: '#B8CAB9', fontSize: 12, marginTop: 3 },
  eventNote: { color: '#E5EEE5', fontSize: 14, lineHeight: 21, marginTop: 7 },
  input: { minHeight: 105, borderWidth: 1, borderColor: '#CAD8C8', borderRadius: 12,
    padding: 12, color: '#FFF8EC', fontSize: 15, textAlignVertical: 'top' },
  templateBox: { backgroundColor: '#F6EFDF', padding: 14, borderRadius: 12, marginTop: 9 },
  templateHint: { color: '#56685D', fontSize: 12, lineHeight: 18 },
  templateText: { color: '#1C3B30', fontSize: 14, lineHeight: 22, marginTop: 8 },
  sourceDisclaimer: { fontSize: 13, lineHeight: 20, color: '#EADFC6', marginTop: 16 },
  privacy: { color: '#DFE4DA', fontSize: 12, lineHeight: 19, marginTop: 14 },
  history: { borderTopWidth: 1, borderTopColor: '#698471', marginTop: 18, paddingTop: 8 },
  archivedCase: { marginTop: 9, borderRadius: 13, borderWidth: 1, borderColor: '#688272', padding: 12 },
  archivedTopic: { fontSize: 14, color: '#FFF3D9', fontWeight: '700' },
  error: { fontSize: 13, lineHeight: 20, color: '#FFCEB9', marginTop: 12 }
});
