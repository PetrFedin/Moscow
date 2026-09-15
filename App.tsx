import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { pilotRoute, places } from './src/data/places';

type Tab = 'discover' | 'route' | 'saved' | 'profile';

const tabLabels: Record<Tab, string> = {
  discover: 'Открыть',
  route: 'Прогулка',
  saved: 'Находки',
  profile: 'Профиль'
};

export default function App() {
  const [tab, setTab] = useState<Tab>('discover');
  const [selectedId, setSelectedId] = useState(places[0]?.id ?? '');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const selected = useMemo(() => places.find((place) => place.id === selectedId) ?? places[0], [selectedId]);

  const toggleSaved = (id: string) => {
    setSavedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>МОСКВА ВО ВРЕМЕНИ</Text>
          <Text style={styles.title}>{tabLabels[tab]}</Text>
        </View>
        <View style={styles.liveBadge}><Text style={styles.liveText}>Пилот • Варварка</Text></View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'discover' && (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroKicker}>РЯДОМ С ВАМИ</Text>
              <Text style={styles.heroTitle}>Улица, где можно увидеть несколько Москв</Text>
              <Text style={styles.heroBody}>Выберите место, переключайте исторические состояния и собирайте собственную карту открытий.</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => setTab('route')}>
                <Text style={styles.primaryButtonText}>Начать прогулку • {pilotRoute.durationMinutes} мин</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Истории рядом</Text>
            {places.map((place) => (
              <TouchableOpacity key={place.id} style={[styles.card, selectedId === place.id && styles.cardActive]} onPress={() => setSelectedId(place.id)}>
                <View style={styles.cardTop}>
                  <View style={styles.numberBadge}><Text style={styles.numberText}>{String(places.indexOf(place) + 1).padStart(2, '0')}</Text></View>
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardTitle}>{place.title}</Text>
                    <Text style={styles.cardSubtitle}>{place.subtitle}</Text>
                  </View>
                  <TouchableOpacity style={styles.saveButton} onPress={() => toggleSaved(place.id)}>
                    <Text style={styles.saveButtonText}>{savedIds.includes(place.id) ? '★' : '☆'}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.tagRow}>{place.tags.map((tag) => <Text key={tag} style={styles.tag}>{tag}</Text>)}</View>
              </TouchableOpacity>
            ))}

            {selected && (
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>ПОЧЕМУ ЭТО ВАЖНО</Text>
                <Text style={styles.detailTitle}>{selected.title}</Text>
                <Text style={styles.detailBody}>{selected.shortStory}</Text>
                {selected.periods.length > 0 && (
                  <>
                    <Text style={styles.detailLabel}>СЛОИ ВРЕМЕНИ</Text>
                    {selected.periods.map((period) => (
                      <View key={period.id} style={styles.periodRow}>
                        <Text style={styles.periodYear}>{period.year}</Text>
                        <View style={styles.periodCopy}>
                          <Text style={styles.periodTitle}>{period.label}</Text>
                          <Text style={styles.periodBody}>{period.summary}</Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}
                <View style={styles.modeRow}>
                  <View style={styles.mode}><Text style={styles.modeTitle}>AR</Text><Text style={styles.modeBody}>На месте</Text></View>
                  <View style={styles.mode}><Text style={styles.modeTitle}>3D</Text><Text style={styles.modeBody}>Изучить модель</Text></View>
                  <View style={styles.mode}><Text style={styles.modeTitle}>VR</Text><Text style={styles.modeBody}>Войти в эпоху</Text></View>
                </View>
                <Text style={styles.notice}>AR/3D/VR помечены как целевые режимы. Реальные сцены будут включаться только после подготовки моделей и полевой проверки.</Text>
              </View>
            )}
          </>
        )}

        {tab === 'route' && (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroKicker}>МАРШРУТ №01</Text>
              <Text style={styles.heroTitle}>{pilotRoute.title}</Text>
              <Text style={styles.heroBody}>{pilotRoute.distanceKm} км • {pilotRoute.durationMinutes} мин • 3 ключевые остановки</Text>
            </View>
            {pilotRoute.stopIds.map((id, index) => {
              const place = places.find((item) => item.id === id);
              if (!place) return null;
              return <View key={id} style={styles.routeRow}><Text style={styles.routeIndex}>{index + 1}</Text><View style={styles.cardCopy}><Text style={styles.cardTitle}>{place.title}</Text><Text style={styles.cardSubtitle}>{place.shortStory}</Text></View></View>;
            })}
          </>
        )}

        {tab === 'saved' && (
          <>
            <Text style={styles.sectionTitle}>Моя Москва</Text>
            {savedIds.length === 0 ? <Text style={styles.emptyText}>Сохраняйте места во время прогулки — здесь появится ваша личная коллекция города.</Text> : savedIds.map((id) => {
              const place = places.find((item) => item.id === id);
              return place ? <View key={id} style={styles.card}><Text style={styles.cardTitle}>{place.title}</Text><Text style={styles.cardSubtitle}>{place.district}</Text></View> : null;
            })}
          </>
        )}

        {tab === 'profile' && (
          <View style={styles.detail}>
            <Text style={styles.detailTitle}>Личный профиль</Text>
            <Text style={styles.detailBody}>Здесь будут языки, доступность, скачанные прогулки, история посещений и персональные интересы. Для первого публичного MVP регистрация не должна мешать начать прогулку.</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.nav}>
        {(Object.keys(tabLabels) as Tab[]).map((item) => (
          <TouchableOpacity key={item} style={styles.navItem} onPress={() => setTab(item)}><Text style={[styles.navText, tab === item && styles.navTextActive]}>{tabLabels[item]}</Text></TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0e10' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2a2c31' },
  eyebrow: { color: '#9a9da5', fontSize: 11, letterSpacing: 1.6, fontWeight: '700' },
  title: { color: '#f5f3ee', fontSize: 28, fontWeight: '700', marginTop: 3 },
  liveBadge: { backgroundColor: '#22252a', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16 },
  liveText: { color: '#d7d3ca', fontSize: 11, fontWeight: '600' },
  content: { padding: 20, paddingBottom: 110 },
  hero: { backgroundColor: '#17191d', borderRadius: 24, padding: 22, marginBottom: 26, borderWidth: StyleSheet.hairlineWidth, borderColor: '#303238' },
  heroKicker: { color: '#b99b69', fontSize: 11, letterSpacing: 1.4, fontWeight: '800', marginBottom: 10 },
  heroTitle: { color: '#fffaf0', fontSize: 30, lineHeight: 35, fontWeight: '700' },
  heroBody: { color: '#bbbcc1', fontSize: 16, lineHeight: 23, marginTop: 12 },
  primaryButton: { backgroundColor: '#d7bb84', borderRadius: 15, paddingVertical: 14, paddingHorizontal: 16, marginTop: 20 },
  primaryButtonText: { color: '#17130d', fontSize: 15, fontWeight: '800', textAlign: 'center' },
  sectionTitle: { color: '#f5f3ee', fontSize: 21, fontWeight: '700', marginBottom: 14 },
  card: { backgroundColor: '#15171a', borderRadius: 20, borderWidth: 1, borderColor: '#26292e', padding: 16, marginBottom: 12 },
  cardActive: { borderColor: '#b99b69' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  numberBadge: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#24272c', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  numberText: { color: '#d7bb84', fontSize: 12, fontWeight: '800' },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTitle: { color: '#f0eee8', fontSize: 17, fontWeight: '700' },
  cardSubtitle: { color: '#9ea0a7', fontSize: 14, lineHeight: 20, marginTop: 4 },
  saveButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#d7bb84', fontSize: 27 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 },
  tag: { color: '#a9abb0', fontSize: 11, backgroundColor: '#22252a', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, marginRight: 6, marginBottom: 6 },
  detail: { backgroundColor: '#181a1e', borderRadius: 24, padding: 20, marginTop: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#303238' },
  detailLabel: { color: '#a88d60', fontSize: 10, letterSpacing: 1.5, fontWeight: '800', marginTop: 12, marginBottom: 7 },
  detailTitle: { color: '#f7f3e9', fontSize: 24, fontWeight: '700' },
  detailBody: { color: '#b7b8bd', fontSize: 15, lineHeight: 23, marginTop: 9, marginBottom: 8 },
  periodRow: { flexDirection: 'row', paddingVertical: 13, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#303238' },
  periodYear: { color: '#d7bb84', fontSize: 16, fontWeight: '800', width: 62 },
  periodCopy: { flex: 1 },
  periodTitle: { color: '#eae7df', fontSize: 15, fontWeight: '700' },
  periodBody: { color: '#999ca3', fontSize: 13, lineHeight: 19, marginTop: 3 },
  modeRow: { flexDirection: 'row', marginTop: 14 },
  mode: { flex: 1, backgroundColor: '#22252a', padding: 12, borderRadius: 14, marginRight: 7 },
  modeTitle: { color: '#f0d39b', fontWeight: '900', fontSize: 17 },
  modeBody: { color: '#9fa1a7', fontSize: 11, marginTop: 3 },
  notice: { color: '#7f8289', fontSize: 11, lineHeight: 16, marginTop: 12 },
  routeRow: { flexDirection: 'row', backgroundColor: '#15171a', borderRadius: 18, padding: 16, marginBottom: 10 },
  routeIndex: { color: '#d7bb84', fontSize: 28, fontWeight: '300', width: 45 },
  emptyText: { color: '#9b9da3', fontSize: 15, lineHeight: 22 },
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#111316', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#303238', flexDirection: 'row', paddingBottom: 12, paddingTop: 10, paddingHorizontal: 10 },
  navItem: { flex: 1, paddingVertical: 11, alignItems: 'center' },
  navText: { color: '#70737a', fontSize: 12, fontWeight: '600' },
  navTextActive: { color: '#e5c58a' }
});
