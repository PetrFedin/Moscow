import React, { useMemo } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import type { PersonalTrip } from '../../travel/personalTrip';
import PhysicalPressable from '../../ui/PhysicalPressable';
import { useMoscowTheme } from '../../theme/MoscowTheme';

type Props = {
  trip: PersonalTrip;
  language: AppLanguage;
};

function timeLabel(value?: string) {
  if (!value) return null;
  const match = /T(\d{2}:\d{2})/.exec(value);
  return match?.[1] ?? null;
}

export default function BookingWalletCard({ trip, language }: Props) {
  const { palette } = useMoscowTheme();
  const items = useMemo(
    () => trip.items
      .filter((item) => item.commitment && item.commitment.status !== 'cancelled')
      .sort((a, b) =>
        a.dayDate.localeCompare(b.dayDate)
        || (a.plannedStartAt ?? '').localeCompare(b.plannedStartAt ?? '')
        || a.title.localeCompare(b.title, 'ru')
      ),
    [trip]
  );

  if (items.length === 0) return null;

  return (
    <View style={[styles.root,{backgroundColor:palette.surface,borderColor:palette.border}]}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={[styles.kicker,{color:palette.accentStrong}]}>{tr(language, 'ПЛАН', 'PLAN', '计划')}</Text>
          <Text style={[styles.title,{color:palette.text}]}>{tr(language, 'Мои билеты и брони', 'My tickets & bookings', '我的门票和预订')}</Text>
          <Text style={[styles.subtitle,{color:palette.textMuted}]}>
            {tr(
              language,
              'Все билеты и брони текущего плана в одном месте.',
              'All tickets and bookings for the current plan in one place.',
              '集中查看当前计划中的门票与预订。'
            )}
          </Text>
        </View>
        <View style={[styles.count,{backgroundColor:palette.surfaceSoft}]}>
          <Text style={[styles.countValue,{color:palette.accentStrong}]}>{items.length}</Text>
          <Text style={[styles.countLabel,{color:palette.textSoft}]}>{tr(language, 'записей', 'items', '项')}</Text>
        </View>
      </View>

      <View style={styles.list}>
        {items.slice(0, 8).map((item) => {
          const commitment = item.commitment!;
          return (
            <View key={item.id} style={[styles.item,{backgroundColor:palette.surfaceRaised,borderColor:palette.border}]}>
              <View style={styles.itemTop}>
                <View style={styles.itemCopy}>
                  <Text style={[styles.itemDate,{color:palette.textSoft}]}>
                    {item.dayDate}{item.plannedStartAt ? ' · ' + timeLabel(item.plannedStartAt) : ''}
                  </Text>
                  <Text style={[styles.itemTitle,{color:palette.text}]}>{item.title}</Text>
                </View>
                <View style={[styles.kindBadge,{borderColor:palette.borderStrong}]}>
                  <Text style={[styles.kindText,{color:palette.accentStrong}]}>
                    {commitment.kind === 'ticket'
                      ? tr(language, 'БИЛЕТ', 'TICKET', '门票')
                      : tr(language, 'БРОНЬ', 'BOOKING', '预订')}
                  </Text>
                </View>
              </View>

              {commitment.provider || commitment.reference ? (
                <Text style={[styles.meta,{color:palette.textMuted}]}>
                  {commitment.provider ?? ''}
                  {commitment.reference ? (commitment.provider ? ' · ' : '') + commitment.reference : ''}
                </Text>
              ) : null}

              <View style={styles.detailWrap}>
                {commitment.partySize ? (
                  <View style={[styles.detailPill,{backgroundColor:palette.surfaceSoft}]}>
                    <Text style={[styles.detailText,{color:palette.textMuted}]}>
                      {tr(language, 'Гостей', 'Guests', '人数')} · {commitment.partySize}
                    </Text>
                  </View>
                ) : null}
                {commitment.seats ? (
                  <View style={[styles.detailPill,{backgroundColor:palette.surfaceSoft}]}>
                    <Text style={[styles.detailText,{color:palette.textMuted}]}>
                      {tr(language, 'Места', 'Seats', '座位')} · {commitment.seats}
                    </Text>
                  </View>
                ) : null}
              </View>

              {commitment.address ? (
                <Text style={[styles.address,{color:palette.textMuted}]}>
                  {tr(language, 'Адрес', 'Address', '地址')}: {commitment.address}
                </Text>
              ) : null}

              <Text style={[styles.truth,{color:palette.accentStrong}]}>
                {commitment.verification === 'provider-confirmed'
                  ? tr(language, 'Подтверждено провайдером', 'Provider confirmed', '供应商已确认')
                  : tr(language, 'Добавлено вами · провайдер не проверен', 'Added by you · provider not verified', '由你添加 · 供应商未核验')}
              </Text>

              {commitment.externalUrl ? (
                <PhysicalPressable
                  style={[styles.openButton,{borderColor:palette.borderStrong}]}
                  contentStyle={styles.center}
                  onPress={() => { void Linking.openURL(commitment.externalUrl!); }}
                >
                  <Text style={[styles.openText,{color:palette.accentStrong}]}>
                    {tr(language, 'Открыть подтверждение', 'Open confirmation', '打开确认信息')}
                  </Text>
                </PhysicalPressable>
              ) : null}
            </View>
          );
        })}
      </View>

      <Text style={[styles.privacy,{color:palette.textSoft}]}>
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
  root: { borderRadius: 22, borderWidth: 1, borderColor: '#393544', backgroundColor: '#14131a', padding: 14, marginBottom: 16 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headingCopy: { flex: 1, minWidth: 0 },
  kicker: { color: '#aa9bc6', fontSize: 8, letterSpacing: 1.1, fontWeight: '900' },
  title: { color: '#f0ebf7', fontSize: 17, lineHeight: 22, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#86818e', fontSize: 9, lineHeight: 13, marginTop: 3 },
  count: { minWidth: 52, borderRadius: 14, backgroundColor: '#201d28', alignItems: 'center', padding: 8 },
  countValue: { color: '#c7b4e5', fontSize: 18, fontWeight: '900' },
  countLabel: { color: '#746e7b', fontSize: 7, marginTop: 1 },
  list: { gap: 8, marginTop: 12 },
  item: { borderRadius: 16, borderWidth: 1, borderColor: '#302d38', backgroundColor: '#19171f', padding: 11 },
  itemTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  itemCopy: { flex: 1, minWidth: 0 },
  itemDate: { color: '#8d829f', fontSize: 8, fontWeight: '800' },
  itemTitle: { color: '#e7e1ed', fontSize: 12, fontWeight: '900', marginTop: 3 },
  kindBadge: { borderRadius: 999, borderWidth: 1, borderColor: '#574967', paddingVertical: 4, paddingHorizontal: 7 },
  kindText: { color: '#bda7d5', fontSize: 7, fontWeight: '900', letterSpacing: 0.7 },
  meta: { color: '#97919e', fontSize: 8.5, lineHeight: 12, marginTop: 6 },
  detailWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 },
  detailPill: { borderRadius: 999, backgroundColor: '#24202c', paddingVertical: 4, paddingHorizontal: 7 },
  detailText: { color: '#aaa1b5', fontSize: 8 },
  address: { color: '#85808b', fontSize: 8.5, lineHeight: 12, marginTop: 7 },
  truth: { color: '#a58cbd', fontSize: 8, lineHeight: 12, marginTop: 6 },
  openButton: { minHeight: 36, borderRadius: 11, borderWidth: 1, borderColor: '#584b66', marginTop: 8 },
  openText: { color: '#cbb3df', fontSize: 8.5, fontWeight: '900' },
  privacy: { color: '#69646e', fontSize: 7.5, lineHeight: 11, marginTop: 10 }
});
