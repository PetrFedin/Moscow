import React, { useMemo } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import type { PersonalTrip } from '../../travel/personalTrip';
import { displayedUpcomingCommitments } from '../../travel/tripDayPresentation';
import { formatDestinationTime } from '../../product/travelProductIdentity';
import PhysicalPressable from '../../ui/PhysicalPressable';

type Props = {
  trip: PersonalTrip;
  language: AppLanguage;
};

export default function BookingWalletCard({ trip, language }: Props) {
  const items = useMemo(
    () => displayedUpcomingCommitments(trip.items)
      .sort((a, b) =>
        a.dayDate.localeCompare(b.dayDate)
        || (a.plannedStartAt ?? '').localeCompare(b.plannedStartAt ?? '')
        || a.title.localeCompare(b.title, 'ru')
      ),
    [trip]
  );

  if (items.length === 0) return null;

  return (
    <View testID="travel-booking-wallet" style={styles.root}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.kicker}>{tr(language, 'ПОЕЗДКА', 'TRIP', '行程')}</Text>
          <Text style={styles.title}>{tr(language, 'Мои билеты и брони', 'My tickets & bookings', '我的门票和预订')}</Text>
          <Text style={styles.subtitle}>
            {tr(
              language,
              'Сведения о билетах и бронях, внесённые в поездку. Статус каждой записи указан отдельно.',
              'Tickets and reservations saved in your trip. Each record has its own status.',
              '行程中保存的门票与预订，每条记录单独显示状态。'
            )}
          </Text>
        </View>
        <View style={styles.count}>
          <Text style={styles.countValue}>{items.length}</Text>
          <Text style={styles.countLabel}>{tr(language, 'записей', 'items', '项')}</Text>
        </View>
      </View>

      <View style={styles.list}>
        {items.slice(0, 8).map((item) => {
          const commitment = item.commitment!;
          return (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemTop}>
                <View style={styles.itemCopy}>
                  <Text style={styles.itemDate}>
                    {item.dayDate}{item.plannedStartAt ? ' · ' + formatDestinationTime(item.plannedStartAt, trip.destinationId) : ''}
                  </Text>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                </View>
                <View style={styles.kindBadge}>
                  <Text style={styles.kindText}>
                    {commitment.kind === 'ticket'
                      ? tr(language, 'БИЛЕТ', 'TICKET', '门票')
                      : tr(language, 'БРОНЬ', 'BOOKING', '预订')}
                  </Text>
                </View>
              </View>

              {commitment.provider || commitment.reference ? (
                <Text style={styles.meta}>
                  {commitment.provider ?? ''}
                  {commitment.reference ? (commitment.provider ? ' · ' : '') + commitment.reference : ''}
                </Text>
              ) : null}

              <View style={styles.detailWrap}>
                {commitment.partySize ? (
                  <View style={styles.detailPill}>
                    <Text style={styles.detailText}>
                      {tr(language, 'Гостей', 'Guests', '人数')} · {commitment.partySize}
                    </Text>
                  </View>
                ) : null}
                {commitment.seats ? (
                  <View style={styles.detailPill}>
                    <Text style={styles.detailText}>
                      {tr(language, 'Места', 'Seats', '座位')} · {commitment.seats}
                    </Text>
                  </View>
                ) : null}
              </View>

              {commitment.address ? (
                <Text style={styles.address}>
                  {tr(language, 'Адрес', 'Address', '地址')}: {commitment.address}
                </Text>
              ) : null}

              <Text style={styles.truth}>
                {commitment.status === 'held'
                  ? tr(language,
                      'Предварительная бронь · окончательное подтверждение не проверено',
                      'Provisional hold · final confirmation is not verified',
                      '临时预留，最终确认未核验')
                  : commitment.verification === 'provider-confirmed'
                    ? tr(language,
                        'В записи указано подтверждение поставщика · проверьте оригинал',
                        'Provider confirmation recorded · check original receipt',
                        '记录中注明供应商已确认，请核对原始凭证')
                    : tr(language,
                        'Добавлено вами · поставщик не проверен',
                        'Added by you · provider not verified',
                        '由您添加，供应商未验证')}
              </Text>

              {commitment.externalUrl ? (
                <PhysicalPressable
                  accessibilityRole="link"
                  accessibilityLabel={tr(language, 'Открыть сохранённую ссылку на подтверждение: ', 'Open saved confirmation link: ', '打开已保存的确认链接：') + item.title}
                  style={styles.openButton}
                  contentStyle={styles.center}
                  onPress={() => { void Linking.openURL(commitment.externalUrl!); }}
                >
                  <Text style={styles.openText}>
                    {tr(language, 'Открыть подтверждение', 'Open confirmation', '打开确认信息')}
                  </Text>
                </PhysicalPressable>
              ) : null}
            </View>
          );
        })}
      </View>

      <Text style={styles.privacy}>
        {tr(
          language,
          'QR/штрихкоды не публикуются и не выводятся в социальных поверхностях.',
          'QR/barcodes are not exposed on public or social surfaces.',
          '二维码 / 条形码不会显示在公开或社交页面。'
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderRadius: 23, borderWidth: 1, borderColor: '#536E61', backgroundColor: '#1B362D', padding: 17, marginBottom: 18 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  headingCopy: { flex: 1, minWidth: 0 },
  kicker: { color: '#EACD98', fontSize: 12, letterSpacing: 0.7, fontWeight: '800' },
  title: { color: '#FFF7EA', fontSize: 21, lineHeight: 28, fontWeight: '700', marginTop: 5 },
  subtitle: { color: '#D0DDCE', fontSize: 13, lineHeight: 20, marginTop: 7 },
  count: { minWidth: 60, borderRadius: 14, backgroundColor: '#365449', alignItems: 'center', padding: 9 },
  countValue: { color: '#FFF3D8', fontSize: 22, fontWeight: '800' },
  countLabel: { color: '#D7E0D8', fontSize: 12, marginTop: 2 },
  list: { gap: 12, marginTop: 16 },
  item: { borderRadius: 17, borderWidth: 1, borderColor: '#E6DECD', backgroundColor: '#FFF9ED', padding: 15 },
  itemTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  itemCopy: { flex: 1, minWidth: 0 },
  itemDate: { color: '#425E50', fontSize: 13, fontWeight: '700' },
  itemTitle: { color: '#1B332A', fontSize: 18, lineHeight: 24, fontWeight: '700', marginTop: 6 },
  kindBadge: { borderRadius: 999, borderWidth: 1, borderColor: '#B5A479', backgroundColor: '#EDE4CB', paddingVertical: 6, paddingHorizontal: 9 },
  kindText: { color: '#243B30', fontSize: 12, fontWeight: '800' },
  meta: { color: '#4D6258', fontSize: 13, lineHeight: 19, marginTop: 8 },
  detailWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  detailPill: { borderRadius: 999, backgroundColor: '#EDE8DB', paddingVertical: 7, paddingHorizontal: 10 },
  detailText: { color: '#334B3F', fontSize: 12 },
  address: { color: '#435A4D', fontSize: 13, lineHeight: 19, marginTop: 9 },
  truth: { color: '#4A5E50', fontSize: 13, lineHeight: 19, marginTop: 10 },
  openButton: { minHeight: 52, borderRadius: 12, backgroundColor: '#204338', marginTop: 12 },
  openText: { color: '#FFF7E8', fontSize: 14, fontWeight: '700' },
  privacy: { color: '#D5DECF', fontSize: 12, lineHeight: 18, marginTop: 14 }
});
