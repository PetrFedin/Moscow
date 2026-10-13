import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import type { PersonalTrip } from '../../travel/personalTrip';
import type { PersonalTripArchive } from '../../travel/personalTripArchive';
import { buildMoscowTravelHistory } from '../../travel/moscowTravelHistory';
import PhysicalPressable from '../../ui/PhysicalPressable';

type Props = {
  activeTrip: PersonalTrip | null;
  archive: PersonalTripArchive;
  language: AppLanguage;
  onOpenTrip: (tripId: string) => void;
};

export default function MoscowTravelHistoryCard({ activeTrip, archive, language, onOpenTrip }: Props) {
  const [expanded, setExpanded] = useState(false);
  const history = useMemo(() => buildMoscowTravelHistory({ activeTrip, archive }), [activeTrip, archive]);
  if (history.tripCount < 2 && history.visitCount === 0) return null;

  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>{tr(language, 'ЛИЧНАЯ МОСКВА', 'MY MOSCOW', '我的莫斯科')}</Text>
      <Text style={styles.title}>{tr(language, 'История всех поездок', 'All journeys history', '全部旅程历史')}</Text>
      <Text style={styles.hint}>{tr(language,
        'Сохранено только на этом устройстве. Отметки о посещениях не являются геолокационным или музейным подтверждением.',
        'Stored only on this device. Visit markers are not geolocation or venue verification.',
        '仅保存在本设备。到访标记不代表地理位置或场馆认证。')}</Text>
      <View style={styles.metrics}>
        <Text style={styles.stat}>{history.tripCount} {tr(language, 'поездок', 'trips', '次旅行')}</Text>
        <Text style={styles.stat}>{history.visitCount} {tr(language, 'посещений', 'visits', '次到访')}</Text>
        <Text style={styles.stat}>{history.restaurantCount} {tr(language, 'мест питания', 'food visits', '次用餐')}</Text>
      </View>
      {history.visitCount > 0 && (
        <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language,'Показать историю посещений по всем поездкам','Toggle visit history','查看全部访问历史')}
          style={styles.action} contentStyle={styles.center} onPress={() => setExpanded(!expanded)}>
          <Text style={styles.actionText}>{expanded ? tr(language,'Свернуть','Collapse','收起') : tr(language,'Посмотреть посещения','View visits','查看到访')}</Text>
        </PhysicalPressable>
      )}
      {expanded && history.entries.slice(0, 30).map(entry => (
        <View key={entry.key} style={styles.entry}>
          <Text style={styles.entryTitle}>{entry.title}</Text>
          <Text style={styles.entryMeta}>{entry.dayDate} · {entry.tripTitle}</Text>
          <Text style={styles.entryEvidence}>{entry.evidence === 'user-confirmed'
            ? tr(language,'Отмечено вами','Marked by you','由您标记')
            : entry.evidence === 'provider-receipt'
              ? tr(language,'В записи указано подтверждение провайдера','Record references provider receipt','记录引用供应商凭证')
              : entry.evidence === 'route-completed'
                ? tr(language,'Отмечено при прохождении маршрута','Marked on walk','路线标记')
                : tr(language,'Сигнал близости — не доказательство посещения','Proximity signal, not proof of attendance','邻近信号非到访凭证')}</Text>
          {entry.note && <Text style={styles.note}>{entry.note}</Text>}
          {activeTrip?.id !== entry.tripId && (
            <PhysicalPressable accessibilityRole="button"
              accessibilityLabel={tr(language,'Открыть поездку с посещением: ','Open trip containing visit: ','打开包含到访的行程：') + entry.tripTitle}
              style={styles.tripAction} contentStyle={styles.center} onPress={() => onOpenTrip(entry.tripId)}>
              <Text style={styles.actionText}>{tr(language,'Открыть поездку','Open trip','打开行程')}</Text>
            </PhysicalPressable>
          )}
        </View>
      ))}
      {expanded && history.entries.length > 30 && (
        <Text style={styles.hint}>{tr(language,'Показаны последние 30 записей. Остальные сохранены в архиве.','Showing 30 latest visits; all remain in archive.','显示最近30条记录，其余保留在档案中。')}</Text>
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
  stat: { color: '#e6ddc8', fontSize: 12, padding: 9, borderRadius: 9, backgroundColor: '#2b4536' },
  action: { minHeight: 45, borderRadius: 12, backgroundColor: '#3b5b45' },
  center: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
  actionText: { color: '#f4e7ca', fontSize: 13, fontWeight: '700' },
  entry: { paddingTop: 12, borderTopWidth: 1, borderColor: '#435b4b', gap: 5 },
  entryTitle: { color: '#f8f1df', fontSize: 15, fontWeight: '700' },
  entryMeta: { color: '#becabd', fontSize: 12 },
  entryEvidence: { color: '#dfc496', fontSize: 11 },
  note: { color: '#e5e0d4', fontSize: 12, lineHeight: 18 },
  tripAction: { alignSelf: 'flex-start', minHeight: 39, backgroundColor: '#3b5b45', borderRadius: 9 }
});
