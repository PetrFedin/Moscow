import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import type { PersonalTripBackupPreview } from '../../travel/personalTripBackup';
import PhysicalPressable from '../../ui/PhysicalPressable';

type Props = {
  language: AppLanguage;
  busy: boolean;
  error: string;
  onExport: () => Promise<string>;
  onPreview: (raw: string) => PersonalTripBackupPreview;
  onImport: (raw: string) => Promise<{ imported: number; skipped: number }>;
};

export default function TripBackupPanel({ language, busy, error, onExport, onPreview, onImport }: Props) {
  const [open, setOpen] = useState(false);
  const [backupText, setBackupText] = useState('');
  const [preview, setPreview] = useState<PersonalTripBackupPreview | null>(null);
  const [previewRaw, setPreviewRaw] = useState('');
  const [localError, setLocalError] = useState('');
  const [result, setResult] = useState('');
  const [working, setWorking] = useState(false);
  const disabled = busy || working;

  const handleExport = async () => {
    setLocalError('');
    setResult('');
    setPreview(null);
    try {
      setWorking(true);
      const raw = await onExport();
      setBackupText(raw);
      setResult(tr(language, 'Копия подготовлена. Скопируйте текст и сохраните его в защищённом месте.',
        'Backup prepared. Copy the text and save it privately.',
        '备份已生成。请复制文本并安全保存。'));
    } catch {
      setLocalError(tr(language, 'Не удалось подготовить резервную копию.',
        'Could not prepare backup.', '无法创建备份。'));
    } finally {
      setWorking(false);
    }
  };

  const handlePreview = () => {
    setLocalError('');
    setResult('');
    setPreview(null);
    setPreviewRaw('');
    try {
      const checked = onPreview(backupText);
      setPreview(checked);
      setPreviewRaw(backupText);
    } catch {
      setLocalError(tr(language, 'Файл не распознан или повреждён. Ничего не импортировано.',
        'Backup is invalid or corrupt. No trips were imported.',
        '备份无效或已损坏，未导入任何行程。'));
    }
  };

  const handleImport = async () => {
    if (!preview || backupText !== previewRaw || disabled) return;
    setWorking(true);
    setLocalError('');
    setResult('');
    try {
      const merged = await onImport(previewRaw);
      setResult(tr(language,
        `Добавлено поездок: ${merged.imported}; уже сохранено: ${merged.skipped}. Текущая поездка не заменялась.`,
        `Trips added: ${merged.imported}; already present: ${merged.skipped}. Active trip unchanged.`,
        `已添加 ${merged.imported} 个行程，已存在 ${merged.skipped} 个。当前行程未被替换。`));
      setPreview(null);
      setPreviewRaw('');
      setBackupText('');
    } catch {
      setLocalError(tr(language, 'Импорт отменён: конфликт поездок или ошибка локального хранилища. Существующие поездки не заменены.',
        'Import blocked: trip conflict or storage error. Existing trips were not replaced.',
        '导入被阻止：行程冲突或存储错误。已有行程未被替换。'));
    } finally {
      setWorking(false);
    }
  };

  return (
    <View style={styles.root}>
      <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language, 'Открыть резервное копирование поездок', 'Open trip backup', '打开行程备份')}
        style={styles.toggle} contentStyle={styles.center} onPress={() => setOpen(!open)}>
        <Text style={styles.buttonText}>{tr(language, 'Резервная копия поездок', 'Trip backup', '行程备份')} {open ? '−' : '+'}</Text>
      </PhysicalPressable>
      {open && (
        <View style={styles.inner}>
          <Text style={styles.title}>{tr(language, 'Перенос вашей истории Москвы', 'Move your Moscow history', '迁移莫斯科旅行记录')}</Text>
          <Text style={styles.warning}>{tr(language,
            'Личные заметки, билеты и номера бронирований входят в копию. Это обычный НЕЗАШИФРОВАННЫЙ текст. Не публикуйте его, не отправляйте посторонним. Сервис никуда его не загружает.',
            'Private notes, tickets and reservation references are included. This is UNENCRYPTED text. Keep it private. The app does not upload it.',
            '备份包含私人备注与预订信息。文本未加密，请安全保管。应用不会上传备份。')}</Text>
          <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language, 'Создать резервную копию текста', 'Generate backup text', '生成备份文本')}
            style={styles.action} contentStyle={styles.center} disabled={disabled} onPress={() => { void handleExport(); }}>
            <Text style={styles.buttonText}>{tr(language, '1. Подготовить копию', '1. Prepare backup', '1. 创建备份')}</Text>
          </PhysicalPressable>
          <Text style={styles.hint}>{tr(language, 'Скопируйте текст ниже для сохранения, либо вставьте сюда копию с другого устройства.',
            'Copy the text below to save it, or paste a backup from another device.',
            '复制下方文本保存，或粘贴其他设备的备份。')}</Text>
          <TextInput multiline value={backupText} onChangeText={(value) => {
            setBackupText(value); setPreview(null); setPreviewRaw(''); setResult(''); setLocalError('');
          }} style={styles.input} textAlignVertical="top" autoCapitalize="none"
            accessibilityLabel={tr(language, 'Текст резервной копии поездок', 'Trip backup text', '行程备份文本')}
            placeholder={tr(language, 'Вставьте JSON резервной копии', 'Paste backup JSON', '粘贴备份 JSON')} />
          <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language, 'Проверить резервную копию перед импортом', 'Preview backup before importing', '导入前预览备份')}
            style={styles.action} contentStyle={styles.center} disabled={disabled || !backupText.trim()} onPress={handlePreview}>
            <Text style={styles.buttonText}>{tr(language, '2. Проверить содержимое', '2. Preview contents', '2. 预览内容')}</Text>
          </PhysicalPressable>
          {preview && (
            <View style={styles.preview}>
              <Text style={styles.previewTitle}>{tr(language, 'Проверено: ', 'Validated: ', '验证通过：')}{preview.tripCount} {tr(language, 'поездок', 'trips', '个行程')}</Text>
              <Text style={styles.hint}>{preview.itemCount} {tr(language, 'остановок', 'stops', '站')} · {preview.visitCount} {tr(language, 'посещений', 'visits', '次到访')} · {preview.commitmentCount} {tr(language, 'билетов / броней', 'tickets / bookings', '票据 / 预订')} · {preview.acceptanceReceiptCount} {tr(language, 'решений', 'accepted changes', '次变更')}</Text>
              <Text style={styles.warning}>{tr(language,
                'Импорт добавляет поездки только в архив. Текущий маршрут не изменится. При конфликте идентификатора импорт будет полностью отменён.',
                'Import adds trips to the archive only. Your active trip stays unchanged. Any identity conflict blocks the entire import.',
                '导入仅添加到历史记录。当前行程不变；任何身份冲突将阻止整批导入。')}</Text>
              <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language, 'Подтвердить импорт поездок в архив', 'Confirm import into trip archive', '确认将行程导入历史记录')}
                style={styles.confirm} contentStyle={styles.center} disabled={disabled} onPress={() => { void handleImport(); }}>
                <Text style={styles.confirmText}>{tr(language, '3. Добавить в историю', '3. Import to history', '3. 导入历史记录')}</Text>
              </PhysicalPressable>
            </View>
          )}
          {result ? <Text style={styles.success}>{result}</Text> : null}
          {localError || error ? <Text style={styles.error}>{localError || error}</Text> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 14, borderWidth: 1, borderColor: '#526858', backgroundColor: '#1d3027', borderRadius: 19, padding: 12 },
  toggle: { borderRadius: 11, backgroundColor: '#314b3a', minHeight: 46 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  buttonText: { color: '#f3e1bf', fontWeight: '700', fontSize: 13 },
  inner: { padding: 6, gap: 12 },
  title: { color: '#f6f0e2', fontWeight: '700', fontSize: 18 },
  warning: { color: '#e8c7a6', lineHeight: 19, fontSize: 12 },
  hint: { color: '#c6d3c8', lineHeight: 18, fontSize: 12 },
  action: { backgroundColor: '#314b3a', borderRadius: 11, minHeight: 46 },
  input: { backgroundColor: '#101d16', color: '#e4e4db', borderWidth: 1, borderColor: '#52705a', borderRadius: 12, padding: 12, minHeight: 112, maxHeight: 230, fontSize: 12, fontFamily: 'monospace' },
  preview: { gap: 10, borderWidth: 1, borderColor: '#7f926a', borderRadius: 12, padding: 12 },
  previewTitle: { color: '#e8e4d4', fontWeight: '700', fontSize: 14 },
  confirm: { backgroundColor: '#eddcb6', minHeight: 48, borderRadius: 12 },
  confirmText: { color: '#22372b', fontWeight: '700', fontSize: 13 },
  error: { color: '#ffada0', fontSize: 12, lineHeight: 17 },
  success: { color: '#d4eac7', fontSize: 12, lineHeight: 17 }
});
