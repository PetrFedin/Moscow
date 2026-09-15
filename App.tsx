import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { pilotRoute, places, type Place } from './src/data/places';

type Tab = 'discover' | 'route' | 'saved' | 'profile';
type Coordinates = { latitude: number; longitude: number };

const STORAGE_KEY = 'moscow:v2:progress';
const tabLabels: Record<Tab, string> = {
  discover: 'Открыть',
  route: 'Прогулка',
  saved: 'Находки',
  profile: 'Профиль'
};

const toRad = (value: number) => (value * Math.PI) / 180;
const distanceKm = (a: Coordinates, b: Coordinates) => {
  const radiusKm = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * radiusKm * Math.asin(Math.sqrt(h));
};

const confidenceLabel = {
  documented: 'Подтверждено источником',
  reconstructed: 'Исследовательская реконструкция',
  hypothesis: 'Гипотеза'
} as const;

export default function App() {
  const [tab, setTab] = useState<Tab>('discover');
  const [selectedId, setSelectedId] = useState(places[0]?.id ?? '');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [visitedIds, setVisitedIds] = useState<string[]>([]);
  const [routeStep, setRouteStep] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationState, setLocationState] = useState<'idle' | 'loading' | 'ready' | 'denied' | 'error'>('idle');
  const [lensPlace, setLensPlace] = useState<Place | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const selected = useMemo(() => places.find((place) => place.id === selectedId) ?? places[0], [selectedId]);

  const nearbyPlaces = useMemo(() => {
    if (!location) return places.map((place) => ({ place, distance: null as number | null }));
    return places
      .map((place) => ({ place, distance: distanceKm(location, place) }))
      .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
  }, [location]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as { savedIds?: string[]; visitedIds?: string[]; routeStep?: number };
        setSavedIds(Array.isArray(parsed.savedIds) ? parsed.savedIds : []);
        setVisitedIds(Array.isArray(parsed.visitedIds) ? parsed.visitedIds : []);
        setRouteStep(Math.max(0, Math.min(pilotRoute.stopIds.length - 1, parsed.routeStep ?? 0)));
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ savedIds, visitedIds, routeStep })).catch(() => undefined);
  }, [hydrated, routeStep, savedIds, visitedIds]);

  const toggleSaved = (id: string) => {
    setSavedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const markVisited = (id: string) => {
    setVisitedIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  const findMe = async () => {
    setLocationState('loading');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationState('denied');
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });
      setLocationState('ready');
    } catch {
      setLocationState('error');
    }
  };

  const openLens = async (place: Place) => {
    if (Platform.OS === 'web' && !navigator?.mediaDevices) return;
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) return;
    }
    setLensPlace(place);
  };

  const openSource = (url: string) => {
    Linking.openURL(url).catch(() => undefined);
  };

  const routePlace = places.find((place) => place.id === pilotRoute.stopIds[routeStep]);
  const progressPct = Math.round(((routeStep + (visitedIds.includes(routePlace?.id ?? '') ? 1 : 0)) / pilotRoute.stopIds.length) * 100);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>МОСКВА ВО ВРЕМЕНИ</Text>
          <Text style={styles.title}>{tabLabels[tab]}</Text>
        </View>
        <View style={styles.liveBadge}><Text style={styles.liveText}>Пилот · Варварка</Text></View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'discover' && (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroKicker}>ГОРОД ВОКРУГ ВАС</Text>
              <Text style={styles.heroTitle}>Смотрите на Москву — и открывайте её прошлое</Text>
              <Text style={styles.heroBody}>Истории, архивные состояния и будущие пространственные сцены собраны вокруг реальных мест, а не музейного каталога.</Text>
              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.primaryButton} onPress={() => setTab('route')}>
                  <Text style={styles.primaryButtonText}>Пройти Варварку · {pilotRoute.durationMinutes} мин</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={findMe}>
                  {locationState === 'loading' ? <ActivityIndicator color="#f0d39b" /> : <Text style={styles.secondaryButtonText}>{location ? 'Обновить места рядом' : 'Что рядом со мной?'}</Text>}
                </TouchableOpacity>
              </View>
              {locationState === 'denied' && <Text style={styles.helper}>Геопозиция не разрешена. Все места и прогулки всё равно доступны вручную.</Text>}
              {locationState === 'error' && <Text style={styles.helper}>Не удалось определить позицию. Попробуйте ещё раз или выберите место вручную.</Text>}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{location ? 'Ближайшие истории' : 'Истории пилота'}</Text>
              <Text style={styles.sectionMeta}>{places.length} места</Text>
            </View>

            {nearbyPlaces.map(({ place, distance }, index) => (
              <TouchableOpacity key={place.id} style={[styles.card, selectedId === place.id && styles.cardActive]} onPress={() => setSelectedId(place.id)}>
                <View style={styles.cardTop}>
                  <View style={styles.numberBadge}><Text style={styles.numberText}>{String(index + 1).padStart(2, '0')}</Text></View>
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardTitle}>{place.title}</Text>
                    <Text style={styles.cardSubtitle}>{place.subtitle}</Text>
                    <Text style={styles.cardMeta}>{distance === null ? `${place.district} · ${place.experienceMinutes} мин` : `${distance < 1 ? Math.round(distance * 1000) + ' м' : distance.toFixed(1) + ' км'} · ${place.experienceMinutes} мин`}</Text>
                  </View>
                  <TouchableOpacity accessibilityLabel="Сохранить место" style={styles.saveButton} onPress={() => toggleSaved(place.id)}>
                    <Text style={styles.saveButtonText}>{savedIds.includes(place.id) ? '★' : '☆'}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.tagRow}>{place.tags.map((tag) => <Text key={tag} style={styles.tag}>{tag}</Text>)}</View>
              </TouchableOpacity>
            ))}

            {selected && (
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>ИСТОРИЯ МЕСТА</Text>
                <Text style={styles.detailTitle}>{selected.title}</Text>
                <Text style={styles.detailBody}>{selected.shortStory}</Text>

                <Text style={styles.detailLabel}>ЧТО ЗДЕСЬ ИСКАТЬ</Text>
                {selected.highlights.map((item, index) => (
                  <View key={item} style={styles.factRow}>
                    <Text style={styles.factIndex}>{index + 1}</Text><Text style={styles.factText}>{item}</Text>
                  </View>
                ))}

                {selected.periods.length > 0 && (
                  <>
                    <Text style={styles.detailLabel}>МАШИНА ВРЕМЕНИ</Text>
                    {selected.periods.map((period) => (
                      <View key={period.id} style={styles.periodRow}>
                        <Text style={styles.periodYear}>{period.year}</Text>
                        <View style={styles.periodCopy}>
                          <Text style={styles.periodTitle}>{period.label}</Text>
                          <Text style={styles.periodBody}>{period.summary}</Text>
                          <Text style={styles.evidence}>{confidenceLabel[period.confidence]}</Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}

                <View style={styles.modeRow}>
                  <TouchableOpacity style={styles.mode} onPress={() => openLens(selected)}><Text style={styles.modeTitle}>◉ Линза</Text><Text style={styles.modeBody}>Камера + ориентиры</Text></TouchableOpacity>
                  <View style={[styles.mode, styles.modeDisabled]}><Text style={styles.modeTitle}>3D</Text><Text style={styles.modeBody}>Модель готовится</Text></View>
                  <View style={[styles.mode, styles.modeDisabled]}><Text style={styles.modeTitle}>VR</Text><Text style={styles.modeBody}>Сцена готовится</Text></View>
                </View>
                <Text style={styles.notice}>«Линза времени» сейчас помогает осмотреть объект через камеру. Точное пространственное совмещение исторической 3D-модели включим только после реконструкции и полевой проверки.</Text>

                <Text style={styles.detailLabel}>ИСТОЧНИКИ</Text>
                {selected.sources.map((source) => (
                  <TouchableOpacity key={source.url} style={styles.sourceRow} onPress={() => openSource(source.url)}>
                    <Text style={styles.sourceText}>{source.label}</Text><Text style={styles.sourceArrow}>↗</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {tab === 'route' && (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroKicker}>ПРОГУЛКА №01</Text>
              <Text style={styles.heroTitle}>{pilotRoute.title}</Text>
              <Text style={styles.heroBody}>{pilotRoute.distanceKm} км · {pilotRoute.durationMinutes} мин · {pilotRoute.stopIds.length} остановки</Text>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progressPct}%` }]} /></View>
              <Text style={styles.progressText}>Прогресс {progressPct}%</Text>
            </View>

            {routePlace && (
              <View style={styles.activeStop}>
                <Text style={styles.detailLabel}>СЕЙЧАС · ОСТАНОВКА {routeStep + 1}</Text>
                <Text style={styles.detailTitle}>{routePlace.title}</Text>
                <Text style={styles.detailBody}>{routePlace.shortStory}</Text>
                <View style={styles.routeActions}>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => { markVisited(routePlace.id); if (routeStep < pilotRoute.stopIds.length - 1) setRouteStep(routeStep + 1); }}>
                    <Text style={styles.primaryButtonText}>{routeStep === pilotRoute.stopIds.length - 1 ? 'Завершить прогулку' : 'Открыто · следующая точка'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => { setSelectedId(routePlace.id); setTab('discover'); }}><Text style={styles.secondaryButtonText}>Изучить место</Text></TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>Все остановки</Text>
            {pilotRoute.stopIds.map((id, index) => {
              const place = places.find((item) => item.id === id);
              if (!place) return null;
              const isDone = visitedIds.includes(id);
              const isCurrent = index === routeStep;
              return (
                <TouchableOpacity key={id} style={[styles.routeRow, isCurrent && styles.routeRowActive]} onPress={() => setRouteStep(index)}>
                  <Text style={styles.routeIndex}>{isDone ? '✓' : index + 1}</Text>
                  <View style={styles.cardCopy}><Text style={styles.cardTitle}>{place.title}</Text><Text style={styles.cardSubtitle}>{place.experienceMinutes} мин · {isDone ? 'посещено' : isCurrent ? 'текущая точка' : 'впереди'}</Text></View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {tab === 'saved' && (
          <>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Моя Москва</Text><Text style={styles.sectionMeta}>{savedIds.length} сохранено</Text></View>
            {savedIds.length === 0 ? (
              <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Начните собирать свою Москву</Text><Text style={styles.emptyText}>Сохраняйте здания и истории — коллекция останется на устройстве после перезапуска приложения.</Text><TouchableOpacity style={styles.secondaryButton} onPress={() => setTab('discover')}><Text style={styles.secondaryButtonText}>Открыть места</Text></TouchableOpacity></View>
            ) : savedIds.map((id) => {
              const place = places.find((item) => item.id === id);
              return place ? <TouchableOpacity key={id} style={styles.card} onPress={() => { setSelectedId(id); setTab('discover'); }}><Text style={styles.cardTitle}>{place.title}</Text><Text style={styles.cardSubtitle}>{place.district} · {place.experienceMinutes} мин</Text></TouchableOpacity> : null;
            })}
          </>
        )}

        {tab === 'profile' && (
          <>
            <View style={styles.profileMetricRow}>
              <View style={styles.metric}><Text style={styles.metricValue}>{visitedIds.length}</Text><Text style={styles.metricLabel}>мест открыто</Text></View>
              <View style={styles.metric}><Text style={styles.metricValue}>{savedIds.length}</Text><Text style={styles.metricLabel}>сохранено</Text></View>
              <View style={styles.metric}><Text style={styles.metricValue}>{Math.round((visitedIds.length / places.length) * 100)}%</Text><Text style={styles.metricLabel}>пилота</Text></View>
            </View>
            <View style={styles.detail}>
              <Text style={styles.detailTitle}>Профиль путешественника</Text>
              <Text style={styles.detailBody}>Регистрация не нужна, чтобы начать прогулку. Следующие версии добавят русский/английский язык, скачанные маршруты, доступность, интересы и синхронизацию между устройствами.</Text>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.nav}>
        {(Object.keys(tabLabels) as Tab[]).map((item) => (
          <TouchableOpacity key={item} style={styles.navItem} onPress={() => setTab(item)}><Text style={[styles.navText, tab === item && styles.navTextActive]}>{tabLabels[item]}</Text></TouchableOpacity>
        ))}
      </View>

      <Modal visible={lensPlace !== null} animationType="slide" onRequestClose={() => setLensPlace(null)}>
        <View style={styles.lensRoot}>
          {lensPlace && <CameraView style={StyleSheet.absoluteFill} facing="back" />}
          <SafeAreaView style={styles.lensOverlay}>
            <View style={styles.lensHeader}>
              <View style={styles.lensHeaderCopy}><Text style={styles.lensKicker}>ЛИНЗА ВРЕМЕНИ · ПРОТОТИП</Text><Text style={styles.lensTitle}>{lensPlace?.title}</Text></View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setLensPlace(null)}><Text style={styles.closeText}>×</Text></TouchableOpacity>
            </View>
            <View style={styles.alignmentFrame}><View style={styles.crossHorizontal} /><View style={styles.crossVertical} /><Text style={styles.alignmentText}>Совместите центр с главным фасадом</Text></View>
            <View style={styles.lensPanel}>
              <Text style={styles.lensPanelTitle}>Что искать глазами</Text>
              <Text style={styles.lensPanelBody}>{lensPlace?.highlights[0]}</Text>
              <Text style={styles.lensDisclaimer}>Это камера с историческими ориентирами. Пространственная историческая модель пока не наложена.</Text>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0d0f' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#292c31' },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: '#92969f', fontSize: 10, letterSpacing: 1.8, fontWeight: '800' },
  title: { color: '#f6f2e8', fontSize: 28, fontWeight: '700', marginTop: 3 },
  liveBadge: { backgroundColor: '#20242a', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16, marginLeft: 12 },
  liveText: { color: '#d3d0c8', fontSize: 10, fontWeight: '700' },
  content: { padding: 18, paddingBottom: 112 },
  hero: { backgroundColor: '#16191e', borderRadius: 26, padding: 22, marginBottom: 26, borderWidth: StyleSheet.hairlineWidth, borderColor: '#30343a' },
  heroKicker: { color: '#c5a56d', fontSize: 10, letterSpacing: 1.5, fontWeight: '900', marginBottom: 10 },
  heroTitle: { color: '#fff8ea', fontSize: 31, lineHeight: 36, fontWeight: '700' },
  heroBody: { color: '#b5b7bc', fontSize: 16, lineHeight: 23, marginTop: 12 },
  heroActions: { marginTop: 3 },
  primaryButton: { backgroundColor: '#dec18b', borderRadius: 16, paddingVertical: 15, paddingHorizontal: 16, marginTop: 17 },
  primaryButtonText: { color: '#17130d', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  secondaryButton: { minHeight: 48, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 16, marginTop: 10, borderWidth: 1, borderColor: '#41464e', alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#e5d5b8', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  helper: { color: '#8e929a', fontSize: 12, lineHeight: 17, marginTop: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 13 },
  sectionTitle: { color: '#f5f1e8', fontSize: 21, fontWeight: '800', marginBottom: 14 },
  sectionMeta: { color: '#777c84', fontSize: 12 },
  card: { backgroundColor: '#14171b', borderRadius: 21, borderWidth: 1, borderColor: '#25292f', padding: 16, marginBottom: 12 },
  cardActive: { borderColor: '#b99b69' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  numberBadge: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#23272d', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  numberText: { color: '#ddb96f', fontSize: 12, fontWeight: '900' },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTitle: { color: '#f2efe8', fontSize: 17, fontWeight: '800' },
  cardSubtitle: { color: '#999da5', fontSize: 14, lineHeight: 20, marginTop: 4 },
  cardMeta: { color: '#c3a672', fontSize: 12, marginTop: 7, fontWeight: '700' },
  saveButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#dec18b', fontSize: 27 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 },
  tag: { color: '#a6a9b0', fontSize: 11, backgroundColor: '#22262c', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, marginRight: 6, marginBottom: 6 },
  detail: { backgroundColor: '#171a1f', borderRadius: 25, padding: 20, marginTop: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#30343a' },
  detailLabel: { color: '#ad9162', fontSize: 10, letterSpacing: 1.5, fontWeight: '900', marginTop: 14, marginBottom: 7 },
  detailTitle: { color: '#f8f3e8', fontSize: 24, lineHeight: 29, fontWeight: '800' },
  detailBody: { color: '#b6b8be', fontSize: 15, lineHeight: 23, marginTop: 9, marginBottom: 8 },
  factRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 9 },
  factIndex: { color: '#d5b575', fontSize: 12, fontWeight: '900', width: 26, paddingTop: 2 },
  factText: { color: '#c4c6ca', flex: 1, fontSize: 14, lineHeight: 20 },
  periodRow: { flexDirection: 'row', paddingVertical: 13, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#30343a' },
  periodYear: { color: '#dfbd7d', fontSize: 16, fontWeight: '900', width: 62 },
  periodCopy: { flex: 1 },
  periodTitle: { color: '#ece9e2', fontSize: 15, fontWeight: '800' },
  periodBody: { color: '#999da5', fontSize: 13, lineHeight: 19, marginTop: 3 },
  evidence: { color: '#a78d61', fontSize: 10, fontWeight: '800', marginTop: 6, textTransform: 'uppercase' },
  modeRow: { flexDirection: 'row', marginTop: 14, gap: 7 },
  mode: { flex: 1, backgroundColor: '#22262c', padding: 12, borderRadius: 15, minHeight: 72 },
  modeDisabled: { opacity: 0.48 },
  modeTitle: { color: '#f0d39b', fontWeight: '900', fontSize: 15 },
  modeBody: { color: '#9fa3aa', fontSize: 10, lineHeight: 14, marginTop: 4 },
  notice: { color: '#7f848d', fontSize: 11, lineHeight: 16, marginTop: 12 },
  sourceRow: { minHeight: 46, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#30343a', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sourceText: { color: '#c8c9cc', fontSize: 13, flex: 1 },
  sourceArrow: { color: '#d5b575', fontSize: 18, marginLeft: 12 },
  progressTrack: { height: 5, borderRadius: 5, backgroundColor: '#30343a', marginTop: 21, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#d8b779' },
  progressText: { color: '#8e929a', fontSize: 11, marginTop: 8 },
  activeStop: { backgroundColor: '#181b20', borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#806f52' },
  routeActions: { marginTop: 4 },
  routeRow: { flexDirection: 'row', backgroundColor: '#14171b', borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'transparent' },
  routeRowActive: { borderColor: '#786746' },
  routeIndex: { color: '#d8b779', fontSize: 25, fontWeight: '500', width: 44 },
  emptyCard: { backgroundColor: '#15181c', borderRadius: 24, padding: 21 },
  emptyTitle: { color: '#f3eee4', fontSize: 20, fontWeight: '800' },
  emptyText: { color: '#9b9fa7', fontSize: 15, lineHeight: 22, marginTop: 8 },
  profileMetricRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  metric: { flex: 1, backgroundColor: '#171a1f', borderRadius: 18, padding: 15 },
  metricValue: { color: '#e0c187', fontSize: 26, fontWeight: '800' },
  metricLabel: { color: '#8d9199', fontSize: 11, marginTop: 5 },
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#101317', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#30343a', flexDirection: 'row', paddingBottom: 12, paddingTop: 9, paddingHorizontal: 8 },
  navItem: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  navText: { color: '#70757e', fontSize: 12, fontWeight: '700' },
  navTextActive: { color: '#e5c58a' },
  lensRoot: { flex: 1, backgroundColor: '#000' },
  lensOverlay: { flex: 1, justifyContent: 'space-between' },
  lensHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 18, backgroundColor: 'rgba(9,11,14,0.72)' },
  lensHeaderCopy: { flex: 1 },
  lensKicker: { color: '#d2b579', fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  lensTitle: { color: '#fff8ec', fontSize: 22, fontWeight: '800', marginTop: 4 },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  closeText: { color: '#fff', fontSize: 30, lineHeight: 32 },
  alignmentFrame: { alignSelf: 'center', width: '78%', aspectRatio: 1.25, borderWidth: 1, borderColor: 'rgba(229,197,138,0.9)', borderRadius: 24, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  crossHorizontal: { position: 'absolute', width: 32, height: 1, backgroundColor: '#e5c58a' },
  crossVertical: { position: 'absolute', width: 1, height: 32, backgroundColor: '#e5c58a' },
  alignmentText: { position: 'absolute', bottom: 13, color: '#fff', fontSize: 12, backgroundColor: 'rgba(0,0,0,0.52)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  lensPanel: { margin: 16, backgroundColor: 'rgba(13,15,18,0.88)', borderRadius: 22, padding: 18 },
  lensPanelTitle: { color: '#f6efe3', fontSize: 17, fontWeight: '800' },
  lensPanelBody: { color: '#d0d1d3', fontSize: 14, lineHeight: 20, marginTop: 7 },
  lensDisclaimer: { color: '#8f949c', fontSize: 11, lineHeight: 16, marginTop: 10 }
});
