import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import type { PersonalTrip } from '../../travel/personalTrip';
import { previewCalendarInvite, importCalendarInvite, type CalendarImportChoice, type CalendarInvitePreview } from '../../travel/calendarInviteImport';
import PhysicalPressable from '../../ui/PhysicalPressable';
import { overlappingFixedCommitments } from '../../travel/tripScheduler';

type Props = { trip: PersonalTrip; language: AppLanguage; onUpdate: (trip: PersonalTrip) => void };
export default function CalendarInviteImportCard({ trip, language, onUpdate }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [raw, setRaw] = useState('');
  const [preview, setPreview] = useState<CalendarInvitePreview | null>(null);
  const [choice, setChoice] = useState<CalendarImportChoice>('plan');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const overlaps = preview ? overlappingFixedCommitments(trip, preview.startAt, preview.endAt) : [];
  const inspect = () => {
    try {
      const found = previewCalendarInvite(raw, trip);
      setPreview(found); setError('');
    } catch (e) { setPreview(null); setError(e instanceof Error ? e.message : 'Invalid calendar invite'); }
  };
  const save = () => {
    if (!preview) return;
    try {
      const next = importCalendarInvite({
        trip, raw, choice, reference: choice === 'plan' ? undefined : reference,
        itemId: 'calendar:' + Date.now().toString(36) + ':' + Math.random().toString(36).slice(2, 9),
        updatedAt: new Date().toISOString()
      });
      onUpdate(next);
      setRaw(''); setPreview(null); setReference(''); setChoice('plan'); setError(''); setExpanded(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Calendar import failed'); }
  };
  return <View testID="calendar-invite-import" style={styles.root}>
    <Text style={styles.title}>{tr(language, 'Добавить из календарного приглашения', 'Import calendar invitation', '导入日历邀请')}</Text>
    <Text style={styles.caption}>{tr(language,
      'Вставьте текст одного события .ics. Это не PDF/QR-билет и не проверка покупки. Никакие данные поставщику не отправляются.',
      'Paste a single .ics event. This is not PDF/QR ticket processing or purchase verification. No supplier data is sent.',
      '粘贴单个 .ics 事件；不验证付款、PDF 或二维码，也不向供应商发送数据。')}</Text>
    <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language,'Открыть импорт календарного события','Open calendar import','打开日历导入')}
      style={styles.button} contentStyle={styles.center} onPress={() => setExpanded(x => !x)}>
      <Text style={styles.buttonText}>{expanded ? tr(language,'Свернуть','Close','收起') : tr(language,'Импорт .ics','Import .ics','导入 .ics')}</Text>
    </PhysicalPressable>
    {expanded && <>
      <TextInput testID="calendar-invite-input" accessibilityLabel={tr(language,'Текст приглашения ICS','ICS invitation text','ICS 邀请文本')}
        multiline style={styles.input} value={raw} onChangeText={value => {setRaw(value);setPreview(null);}} maxLength={32000}
        placeholder="BEGIN:VCALENDAR" placeholderTextColor="#A6B3AA" />
      <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language,'Проверить приглашение','Preview calendar invite','预览邀请')}
        style={styles.button} contentStyle={styles.center} onPress={inspect}><Text style={styles.buttonText}>{tr(language,'Проверить данные','Preview event','预览')}</Text></PhysicalPressable>
      {preview && <View testID="calendar-invite-preview" style={styles.preview}>
        <Text style={styles.title}>{preview.title}</Text>
        <Text style={styles.caption}>{preview.dayDate} · {preview.startAt} → {preview.endAt}</Text>
        {preview.location ? <Text style={styles.caption}>{preview.location}</Text> : null}
        {overlaps.length > 0 ? <Text testID="calendar-invite-overlap-warning" style={styles.error}>{tr(language,
          'Внимание: время пересекается с существующим билетом или бронью. Проверьте расписание до добавления. Конфликтов: ',
          'Warning: this overlaps an existing ticket or reservation. Review timing before adding. Conflicts: ',
          '警告：此时段与现有门票或预订冲突，请先核对时间。冲突数：') + overlaps.length}</Text> : null}
        <Text style={styles.caption}>{tr(language,'Выберите, чем является запись. Источник не проверен.','Choose what this represents. The source is not verified.','选择记录类型；来源未经核实。')}</Text>
        {(['plan','ticket','reservation'] as const).map(value => <PhysicalPressable key={value} accessibilityRole="button"
          accessibilityLabel={value === 'plan' ? tr(language,'Только план','Plan only','仅计划') : value === 'ticket' ? tr(language,'Мой билет','My ticket','我的门票') : tr(language,'Моя бронь','My reservation','我的预订')}
          style={styles.choice} contentStyle={styles.center} onPress={() => setChoice(value)}>
          <Text style={styles.buttonText}>{choice === value ? '● ' : '○ '}{value === 'plan' ? tr(language,'Только план','Plan only','仅计划') : value === 'ticket' ? tr(language,'Мой билет','My ticket','我的门票') : tr(language,'Моя бронь','My booking','我的预订')}</Text>
        </PhysicalPressable>)}
        {choice !== 'plan' && <TextInput accessibilityLabel={tr(language,'Номер заказа (необязательно)','Order number (optional)','订单号（选填）')}
          style={styles.shortInput} value={reference} onChangeText={setReference} maxLength={120}
          placeholder={tr(language,'Номер заказа — только если известен','Order reference if known','已知订单号')} placeholderTextColor="#A6B3AA"/>}
        <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language,'Подтвердить импорт события','Confirm calendar import','确认导入')}
          style={styles.button} contentStyle={styles.center} onPress={save}><Text style={styles.buttonText}>{tr(language,'Добавить в поездку','Add to trip','添加到行程')}</Text></PhysicalPressable>
      </View>}
      {error ? <Text testID="calendar-invite-error" style={styles.error}>{error}</Text> : null}
    </>}
  </View>;
}
const styles=StyleSheet.create({
  root:{borderWidth:1,borderColor:'#526858',backgroundColor:'#1D3027',borderRadius:18,padding:16,marginBottom:16},
  title:{color:'#FFF7E5',fontSize:18,fontWeight:'700',marginBottom:7},
  caption:{color:'#E0E6DA',fontSize:13,lineHeight:20,marginBottom:7},
  button:{minHeight:48,borderRadius:12,borderWidth:1,borderColor:'#B4C8B8',marginTop:8},
  choice:{minHeight:45,borderRadius:12,marginTop:5,backgroundColor:'#325143'},
  center:{justifyContent:'center',alignItems:'center',paddingHorizontal:12},
  buttonText:{color:'#FFF7E5',fontWeight:'700',fontSize:14},
  input:{minHeight:150,borderWidth:1,borderColor:'#A2B7A3',borderRadius:12,padding:12,color:'#FFFFFF',fontSize:13,textAlignVertical:'top',marginTop:12},
  shortInput:{minHeight:48,borderWidth:1,borderColor:'#A2B7A3',borderRadius:12,padding:12,color:'#FFFFFF',fontSize:14,marginTop:8},
  preview:{paddingVertical:12},
  error:{color:'#FFC0AC',fontSize:13,marginTop:8}
});