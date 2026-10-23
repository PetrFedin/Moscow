import React, { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import type { PersonalTripItem } from '../../travel/personalTrip';
import { curatedMoscowPlace } from '../../travel/curatedMoscowPlaces';
import PhysicalPressable from '../../ui/PhysicalPressable';

type Props = {
  item: PersonalTripItem;
  language: AppLanguage;
  onMarkVisited: (itemId: string) => Promise<void>;
  onOpenPlace: (placeId: string) => void;
};

/** Explicit user check-in. Neither opening a map nor this action is provider attendance proof. */
export default function TodayStopActions({ item, language, onMarkVisited, onOpenPlace }: Props) {
  const [confirmVisit, setConfirmVisit] = useState(false);
  const [savingVisit, setSavingVisit] = useState(false);
  const [visitError, setVisitError] = useState(false);
  const place = item.catalogPlaceId ? curatedMoscowPlace(item.catalogPlaceId) : undefined;
  const address = place?.addressRu || item.commitment?.address;

  return (
    <View style={styles.root}>
      {address && (
        <View style={styles.location}>
          <Text style={styles.address}>{address}</Text>
          <PhysicalPressable
            accessibilityRole="button"
            accessibilityLabel={tr(language, 'Найти адрес на карте', 'Find address on map', '在地图中查找地址')}
            style={styles.outlineButton}
            contentStyle={styles.center}
            onPress={() => { void Linking.openURL('https://yandex.ru/maps/?text=' + encodeURIComponent('Москва, ' + address)).catch(() => undefined); }}
          >
            <Text style={styles.outlineText}>{tr(language, 'Найти адрес на карте', 'Find address on map', '在地图中查找地址')} ↗</Text>
          </PhysicalPressable>
          <Text style={styles.sourceNote}>{tr(language,
            'Поиск адреса во внешней карте. Время пути и точный вход не проверены.',
            'External address search; route duration and exact entrance are unverified.',
            '在外部地图搜索地址；路线时间及入口尚未核验。')}</Text>
        </View>
      )}
      {item.destinationNodeId && (
        <PhysicalPressable
          accessibilityRole="button"
          accessibilityLabel={tr(language, 'Открыть историю места', 'Open place story', '打开地点故事')}
          style={styles.outlineButton} contentStyle={styles.center}
          onPress={() => onOpenPlace(item.destinationNodeId!)}
        >
          <Text style={styles.outlineText}>{tr(language, 'История места', 'Place story', '地点故事')} ↗</Text>
        </PhysicalPressable>
      )}
      {item.officialSourceUrl && (
        <PhysicalPressable
          accessibilityRole="button"
          accessibilityLabel={tr(language, 'Открыть официальный источник', 'Open official source', '打开官方来源')}
          style={styles.outlineButton} contentStyle={styles.center}
          onPress={() => { void Linking.openURL(item.officialSourceUrl!).catch(() => undefined); }}
        >
          <Text style={styles.outlineText}>{tr(language, 'Официальный сайт', 'Official website', '官方网站')} ↗</Text>
        </PhysicalPressable>
      )}
      {!confirmVisit ? (
        <PhysicalPressable
          accessibilityRole="button"
          accessibilityLabel={tr(language, 'Отметить, что я был здесь', 'Mark that I visited', '标记已到访')}
          style={styles.primaryButton} contentStyle={styles.center}
          onPress={() => { setVisitError(false); setConfirmVisit(true); }}
        >
          <Text style={styles.primaryText}>{tr(language, 'Я был здесь', 'I was here', '我来过这里')} ✓</Text>
        </PhysicalPressable>
      ) : (
        <View style={styles.confirmation}>
          {visitError ? (
            <Text testID="today-visit-save-error" style={styles.errorText}>{tr(language,
              'Посещение не сохранено. Проверьте память устройства и повторите попытку.',
              'Visit not saved. Check your device storage and retry.',
              '到访记录未保存，请检查设备存储后重试。')}</Text>
          ) : null}
          <Text style={styles.confirmText}>{tr(language,
            'Вы действительно посетили это место? Запись будет добавлена как ваша личная отметка, без подтверждения организатора.',
            'Have you actually visited? This creates your own check-in, not confirmation by a provider.',
            '您确实到访了吗？这只是个人记录，并非场地方确认。')}</Text>
          <PhysicalPressable
            accessibilityRole="button"
            accessibilityLabel={tr(language, 'Подтвердить личное посещение', 'Confirm my visit', '确认个人到访')}
            style={styles.primaryButton} contentStyle={styles.center}
            disabled={savingVisit}
            onPress={() => {
              if (savingVisit) return;
              setSavingVisit(true);
              setVisitError(false);
              void onMarkVisited(item.id)
                .then(() => setConfirmVisit(false))
                .catch(() => setVisitError(true))
                .finally(() => setSavingVisit(false));
            }}
          >
            <Text style={styles.primaryText}>{tr(language, 'Подтвердить посещение', 'Confirm visit', '确认到访')}</Text>
          </PhysicalPressable>
          <PhysicalPressable
            accessibilityRole="button"
            accessibilityLabel={tr(language, 'Отменить отметку посещения', 'Cancel visit check-in', '取消到访标记')}
            style={styles.outlineButton} contentStyle={styles.center}
            disabled={savingVisit}
            onPress={() => setConfirmVisit(false)}
          >
            <Text style={styles.outlineText}>{tr(language, 'Отмена', 'Cancel', '取消')}</Text>
          </PhysicalPressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 12, gap: 9 },
  location: { gap: 5 },
  address: { fontSize: 13, color: '#344d3e', lineHeight: 20, fontWeight: '700' },
  sourceNote: { fontSize: 11, color: '#516a59', lineHeight: 17 },
  outlineButton: { borderRadius: 12, borderWidth: 1, borderColor: '#9bafa0', minHeight: 45 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  outlineText: { color: '#244d3e', fontSize: 12, fontWeight: '700' },
  primaryButton: { borderRadius: 12, backgroundColor: '#244638', minHeight: 48 },
  primaryText: { color: '#fff6e4', fontSize: 13, fontWeight: '700' },
  confirmation: { backgroundColor: '#e6e9df', borderRadius: 12, padding: 12, gap: 9 },
  confirmText: { color: '#345042', fontSize: 12, lineHeight: 19 },
  errorText: { color: '#982e28', fontSize: 13, lineHeight: 20, fontWeight: '700' }
});
