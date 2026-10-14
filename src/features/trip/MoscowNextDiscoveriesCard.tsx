import React, { useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { tr, type AppLanguage } from '../../i18n';
import type { CuratedMoscowPlace } from '../../travel/curatedMoscowPlaces';
import {
  buildMoscowNextDiscoveries,
  type MoscowDiscoveryInterest
} from '../../travel/moscowNextDiscoveries';
import type { PersonalTrip } from '../../travel/personalTrip';
import type { PersonalTripArchive } from '../../travel/personalTripArchive';
import PhysicalPressable from '../../ui/PhysicalPressable';

type Props = {
  trip: PersonalTrip;
  archive: PersonalTripArchive;
  archiveReady: boolean;
  dayDate: string;
  language: AppLanguage;
  onAddPlace: (place: CuratedMoscowPlace) => void;
  addError: string;
};

const interestOptions: MoscowDiscoveryInterest[] = ['all', 'culture', 'food', 'parks'];

function interestLabel(language: AppLanguage, interest: MoscowDiscoveryInterest): string {
  switch (interest) {
    case 'all': return tr(language, 'Разное', 'All', '全部');
    case 'culture': return tr(language, 'Культура', 'Culture', '文化');
    case 'food': return tr(language, 'Рестораны', 'Restaurants', '餐厅');
    case 'parks': return tr(language, 'Парки', 'Parks', '公园');
  }
}

export default function MoscowNextDiscoveriesCard({
  trip, archive, archiveReady, dayDate, language, onAddPlace, addError
}: Props) {
  const [interest, setInterest] = useState<MoscowDiscoveryInterest>('all');
  const [expanded, setExpanded] = useState(false);
  const [sourceError, setSourceError] = useState('');

  const projection = useMemo(() => archiveReady
    ? buildMoscowNextDiscoveries({
        activeTrip: trip, archive, dayDate, interest, limit: expanded ? 20 : 4
      })
    : null, [trip, archive, archiveReady, dayDate, interest, expanded]);

  return (
    <View testID="moscow-next-discoveries" style={styles.root}>
      <Text style={styles.kicker}>{tr(language, 'ИДЕИ ДЛЯ НОВЫХ ОТКРЫТИЙ', 'DISCOVER MORE OF MOSCOW', '更多莫斯科发现')}</Text>
      <Text style={styles.title}>{tr(language, 'Что добавить в поездку?', 'Where to go next?', '下一站去哪里？')}</Text>
      <Text style={styles.hint}>{tr(language,
        'Показываем места, для которых в вашем дневнике нет записи о посещении и которые ещё не стоят в активном плане. Это не подтверждение, что вы никогда здесь не были.',
        'Places without a recorded visit in your diary and not in your current plan. This does not prove you have never been there.',
        '显示日记中没有到访记录且未列入当前计划的地点，并不代表您以前从未去过。')}</Text>
      <Text style={styles.dayLabel}>{tr(language, 'Добавление в день: ', 'Add to day: ', '添加到日期：')}{dayDate}</Text>

      <View style={styles.filters}>
        {interestOptions.map((item) => (
          <PhysicalPressable
            key={item}
            accessibilityRole="button"
            accessibilityLabel={tr(language, 'Идеи: ', 'Discoveries: ', '发现：') + interestLabel(language, item)}
            accessibilityState={{ selected: interest === item }}
            style={[styles.chip, interest === item && styles.chipActive]}
            contentStyle={styles.center}
            onPress={() => { setInterest(item); setExpanded(false); }}
          >
            <Text style={[styles.chipText, interest === item && styles.chipTextActive]}>
              {interestLabel(language, item)}
            </Text>
          </PhysicalPressable>
        ))}
      </View>

      {!projection ? (
        <Text style={styles.hint}>{tr(language,
          'История поездок ещё загружается — рекомендации недоступны до её проверки.',
          'Trip history is loading; suggestions will be available once it is validated.',
          '正在加载行程历史，验证后才能显示建议。')}</Text>
      ) : (
        <>
          {projection.unknownIdentityVisits > 0 && (
            <Text style={styles.disclosure}>{tr(language,
              `В архиве есть ${projection.unknownIdentityVisits} записей без точного ID места. Они не используются для исключения совпадений по названию.`,
              `${projection.unknownIdentityVisits} past visits have no canonical venue ID; they cannot be safely matched by name.`,
              `有 ${projection.unknownIdentityVisits} 条没有准确地点 ID 的记录，因此不会按名称匹配。`)}</Text>
          )}
          {projection.totalEligible === 0 && (
            <Text style={styles.hint}>{tr(language,
              'В этой категории больше нет подходящих мест из текущей небольшой подборки. Попробуйте другую категорию.',
              'No remaining places from this small curated list. Try another category.',
              '当前精选列表中没有更多地点，请尝试其他类别。')}</Text>
          )}
          {projection.suggestions.map((item) => (
            <View key={item.place.id} style={styles.place}>
              <View style={styles.placeHead}>
                <Text style={styles.placeTitle}>{language === 'en' ? item.place.titleEn : item.place.titleRu}</Text>
                <Text style={styles.category}>{interestLabel(language, item.interest)}</Text>
              </View>
              <Text style={styles.address}>{item.place.districtRu} · {item.place.addressRu}</Text>
              <Text style={styles.reason}>{item.reason === 'similar-history-category'
                ? tr(language,
                    'Похожая категория встречалась в вашей истории посещений.',
                    'Similar categories appear in your saved visits.',
                    '类似类别曾出现在您的旅行记录中。')
                : tr(language,
                    'Ещё один вариант из городского справочника.',
                    'Another option from the city directory.',
                    '城市目录中的另一个选项。')}</Text>
              <Text style={styles.source}>{tr(language,
                'Адрес по справочному источнику от ',
                'Directory address checked ',
                '目录地址核对日期：')}{item.place.addressCheckedAt}</Text>
              <Text style={styles.disclosure}>{tr(language,
                'Текущие часы работы, билетная доступность, цены и маршрут не проверены.',
                'Current hours, tickets, prices and route are not verified.',
                '当前开放时间、门票、价格与路线均未核验。')}</Text>
              <View style={styles.actions}>
                <PhysicalPressable
                  accessibilityRole="button"
                  accessibilityLabel={tr(language, 'Добавить место в выбранный день: ', 'Add place to selected day: ', '添加到选定日期：') + item.place.titleRu}
                  style={styles.add}
                  contentStyle={styles.center}
                  onPress={() => onAddPlace(item.place)}
                >
                  <Text style={styles.addLabel}>{tr(language, '+ В план дня', '+ Add to day', '+ 加入日程')}</Text>
                </PhysicalPressable>
                <PhysicalPressable
                  accessibilityRole="link"
                  accessibilityLabel={tr(language, 'Официальный источник: ', 'Official source: ', '官方来源：') + item.place.titleRu}
                  style={styles.link}
                  contentStyle={styles.center}
                  onPress={() => {
                    setSourceError('');
                    void Linking.openURL(item.place.officialUrl).catch(() => setSourceError(
                      tr(language, 'Не удалось открыть источник. Проверьте соединение.',
                        'Could not open source. Check your connection.',
                        '无法打开来源，请检查网络。')
                    ));
                  }}
                >
                  <Text style={styles.linkLabel}>{tr(language, 'Источник ↗', 'Official source ↗', '官方来源 ↗')}</Text>
                </PhysicalPressable>
              </View>
            </View>
          ))}
          {!expanded && projection.totalEligible > projection.suggestions.length && (
            <PhysicalPressable accessibilityRole="button"
              accessibilityLabel={tr(language, 'Показать больше идей Москвы', 'Show more Moscow discoveries', '显示更多莫斯科推荐')}
              style={styles.more} contentStyle={styles.center} onPress={() => setExpanded(true)}>
              <Text style={styles.moreLabel}>{tr(language, 'Показать ещё', 'See more', '显示更多')}</Text>
            </PhysicalPressable>
          )}
          {addError ? <Text style={styles.error}>{addError}</Text> : null}
          {sourceError ? <Text style={styles.error}>{sourceError}</Text> : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderRadius: 20, borderWidth: 1, borderColor: '#64613e', backgroundColor: '#262a22', padding: 16, marginTop: 18, marginBottom: 16, gap: 11 },
  kicker: { color: '#e3c893', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#f7f0df', fontSize: 20, fontWeight: '700' },
  hint: { color: '#cfd3c4', fontSize: 12, lineHeight: 19 },
  disclosure: { color: '#b8c0ad', fontSize: 11, lineHeight: 17 },
  dayLabel: { color: '#f0d49e', fontSize: 12, fontWeight: '700' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { minHeight: 42, borderRadius: 22, borderWidth: 1, borderColor: '#646f5b', backgroundColor: '#343d32' },
  chipActive: { backgroundColor: '#e8d1a7', borderColor: '#e8d1a7' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  chipText: { color: '#dfdfd0', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#29332a' },
  place: { padding: 13, gap: 7, borderRadius: 14, backgroundColor: '#343a2e', borderWidth: 1, borderColor: '#505b47' },
  placeHead: { gap: 4 },
  placeTitle: { fontSize: 16, color: '#fff6e2', fontWeight: '700' },
  category: { color: '#c9dba9', fontSize: 11 },
  address: { color: '#f1ddba', fontSize: 12, lineHeight: 18 },
  reason: { color: '#c6d3ba', fontSize: 12, lineHeight: 18 },
  source: { color: '#c3c7b5', fontSize: 11 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  add: { borderRadius: 11, backgroundColor: '#e9d3aa', minHeight: 46, flexGrow: 1 },
  addLabel: { color: '#2c3224', fontSize: 12, fontWeight: '700' },
  link: { borderRadius: 11, borderWidth: 1, borderColor: '#adb58a', minHeight: 46, flexGrow: 1 },
  linkLabel: { color: '#f2e4c6', fontSize: 12, fontWeight: '700' },
  more: { minHeight: 44, borderWidth: 1, borderColor: '#8b9573', borderRadius: 11 },
  moreLabel: { color: '#ebdbb6', fontSize: 12, fontWeight: '700' },
  error: { color: '#ffaba0', fontSize: 12, lineHeight: 18 }
});
