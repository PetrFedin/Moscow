import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import type { PersonalTripArchive } from '../../travel/personalTripArchive';
import PhysicalPressable from '../../ui/PhysicalPressable';

type Props = {
  archive: PersonalTripArchive;
  activeTripId?: string;
  language: AppLanguage;
  onOpenArchivedTrip: (tripId: string) => void;
};

export default function TripArchivePanel({ archive, activeTripId, language, onOpenArchivedTrip }: Props) {
  const previous = archive.trips.filter((trip) => trip.id !== activeTripId);
  if (!previous.length) return null;
  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>{tr(language, 'МОЯ ИСТОРИЯ ПУТЕШЕСТВИЙ', 'MY TRAVEL HISTORY', '我的旅行记录')}</Text>
      <Text style={styles.title}>{tr(language, 'Прошлые поездки', 'Previous trips', '以往行程')}</Text>
      <Text style={styles.hint}>{tr(language,
        'Поездки сохранены только на этом устройстве. Открытие старой поездки автоматически сохранит текущую в архиве.',
        'Trips are stored only on this device. Opening a previous trip first archives the current one.',
        '行程仅保存在本设备。打开以往行程前，当前行程会先存入归档。')}</Text>
      {previous.map((trip) => (
        <View key={trip.id} style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.tripTitle}>{trip.title}</Text>
            <Text style={styles.dates}>{trip.startDate} → {trip.endDate}</Text>
            <Text style={styles.stats}>
              {trip.visits.length} {tr(language, 'посещений', 'visits', '次到访')} · {trip.items.length} {tr(language, 'пунктов', 'stops', '站点')} · {(trip.replacementReceipts ?? []).length} {tr(language, 'изменений', 'changes', '次变更')}
            </Text>
          </View>
          <PhysicalPressable
            accessibilityRole="button"
            accessibilityLabel={tr(language, 'Открыть архивную поездку: ', 'Open previous trip: ', '打开以往行程：') + trip.startDate}
            style={styles.action}
            contentStyle={styles.actionInner}
            onPress={() => onOpenArchivedTrip(trip.id)}
          >
            <Text style={styles.actionText}>{tr(language, 'Открыть', 'Open', '打开')}</Text>
          </PhysicalPressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 20, padding: 17, borderRadius: 20, borderWidth: 1, borderColor: '#526858', backgroundColor: '#1d3027', gap: 11 },
  kicker: { fontSize: 10, color: '#d7bc8b', letterSpacing: 1, fontWeight: '700' },
  title: { color: '#f6f0e2', fontSize: 20, fontWeight: '700' },
  hint: { color: '#becabe', fontSize: 12, lineHeight: 19 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderColor: '#425449' },
  copy: { flex: 1, minWidth: 0 },
  tripTitle: { color: '#f8f0dd', fontSize: 15, fontWeight: '700' },
  dates: { color: '#c9d9cc', fontSize: 12, marginTop: 5 },
  stats: { color: '#c6c4b2', fontSize: 11, marginTop: 5 },
  action: { backgroundColor: '#eedbb9', borderRadius: 12, minHeight: 46, minWidth: 78 },
  actionInner: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
  actionText: { color: '#2a3b2e', fontSize: 13, fontWeight: '700' }
});
