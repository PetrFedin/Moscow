import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { localizePlaces } from './data/places.en';
import { pilotRoute, places, type Place } from './data/places';
import { playTextGuide, stopTextGuide } from './features/audio/audioGuide';
import MoscowMap from './features/map/MoscowMap';
import MoscowSpatialNavigator from './features/spatial/MoscowSpatialNavigator';
import { detectLanguage, nextLanguage, speechLocale, t, type AppLanguage } from './i18n';
import { capabilities, statusLabels } from './integrations/capabilities';

type Tab = 'discover' | 'map' | 'route' | 'saved' | 'profile';
type Coordinates = { latitude: number; longitude: number };

const STORAGE_KEY = 'moscow:v3:progress';
const toRad = (value: number) => (value * Math.PI) / 180;
const distanceKm = (a: Coordinates, b: Coordinates) => {
  const r = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const aLat = toRad(a.latitude);
  const bLat = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat) * Math.cos(bLat) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
};

const evidenceRu = {
  documented: 'Подтверждено источником',
  reconstructed: 'Исследовательская реконструкция',
  hypothesis: 'Гипотеза'
} as const;

const evidenceEn = {
  documented: 'Documented evidence',
  reconstructed: 'Research reconstruction',
  hypothesis: 'Hypothesis'
} as const;

const evidenceZh = {
  documented: '有文献依据',
  reconstructed: '学术重建',
  hypothesis: '假设'
} as const;

const appCopy = {
  ru: {
    heroKicker: 'ГОРОД КАК МАШИНА ВРЕМЕНИ',
    heroTitle: 'Смотрите на Москву — и открывайте то, чего больше не видно',
    heroBody: 'Карта, проверенная история, прогулки, аудио и пространственные сцены соединены вокруг реальных мест.',
    startVarvarka: 'Начать Варварку · 45 мин',
    locationUnavailable: 'Геопозиция недоступна — приложение продолжает работать с ручным выбором места.',
    nearbyStories: 'Ближайшие истории',
    pilotPlaces: 'Пилотные места',
    placeStory: 'ИСТОРИЯ МЕСТА',
    today: 'Сегодня',
    now: 'сейчас',
    currentState: 'Современное состояние — точка сравнения с документированными историческими слоями.',
    whatToLookFor: 'ЧТО ИСКАТЬ ГЛАЗАМИ',
    cameraGuides: 'Камера и ориентиры',
    runtimeProbe: 'Проверить runtime',
    runtimeNotice: 'Spatial runtime подключён. Историческая 3D-модель появится здесь только после подготовки GLB и проверки точной привязки на Варварке.',
    cityLayer: 'ГОРОДСКОЙ СЛОЙ',
    cityLayerTitle: 'История прямо на карте Москвы',
    cityLayerBody: 'В нативной сборке работает Yandex MapKit: точки, маршрут, геопозиция и будущие исторические слои.',
    openStory: 'Открыть историю и машину времени →',
    walkKicker: 'ПРОГУЛКА №01',
    walkTitle: 'Варварка: улица, которая помнит несколько Москв',
    stopLabel: (index: number) => `СЕЙЧАС · ОСТАНОВКА ${index}`,
    finishWalk: 'Завершить прогулку',
    discoveredNext: 'Открыто · дальше',
    explorePlace: 'Изучить место',
    allStops: 'Все остановки',
    myMoscow: 'Моя Москва',
    myMoscowBody: 'Личная коллекция мест, которую можно продолжать собирать район за районом.',
    nothingSaved: 'Пока ничего не сохранено',
    discovered: 'открыто',
    saved: 'сохранено',
    language: 'язык',
    platformCapabilities: 'Возможности платформы',
    platformCapabilitiesBody: 'Здесь видно, какие технологические слои уже подключены и что ещё требует ключа, ассета или полевого теста.',
    alignFacade: 'Совместите центр с главным фасадом',
    visualCue: 'Что искать глазами',
    lensNotice: 'Сейчас это навигационный camera mode. Историческая 3D-геометрия будет добавлена после полевого совмещения.'
  },
  en: {
    heroKicker: 'THE CITY AS A TIME MACHINE',
    heroTitle: 'Look at Moscow — and reveal what is no longer visible',
    heroBody: 'Map, verified history, walks, audio and spatial scenes are connected around real places.',
    startVarvarka: 'Start Varvarka · 45 min',
    locationUnavailable: 'Location is unavailable — places can still be explored manually.',
    nearbyStories: 'Stories nearby',
    pilotPlaces: 'Pilot places',
    placeStory: 'PLACE STORY',
    today: 'Today',
    now: 'now',
    currentState: 'The current state is the comparison point for the documented historical layers.',
    whatToLookFor: 'WHAT TO LOOK FOR',
    cameraGuides: 'Camera + guides',
    runtimeProbe: 'Runtime probe',
    runtimeNotice: 'The spatial runtime is connected. A historical 3D model will appear here only after the GLB asset and on-site alignment are verified.',
    cityLayer: 'CITY LAYER',
    cityLayerTitle: 'History directly on the Moscow map',
    cityLayerBody: 'The native build uses Yandex MapKit for places, routes, location and future historical layers.',
    openStory: 'Open story and time machine →',
    walkKicker: 'WALK #01',
    walkTitle: 'Varvarka: a street that remembers several Moscows',
    stopLabel: (index: number) => `NOW · STOP ${index}`,
    finishWalk: 'Finish walk',
    discoveredNext: 'Discovered · next',
    explorePlace: 'Explore this place',
    allStops: 'All stops',
    myMoscow: 'My Moscow',
    myMoscowBody: 'Your personal collection of places, built district by district.',
    nothingSaved: 'Nothing saved yet',
    discovered: 'discovered',
    saved: 'saved',
    language: 'language',
    platformCapabilities: 'Platform capabilities',
    platformCapabilitiesBody: 'See which platform layers are connected and which still require a key, asset or field test.',
    alignFacade: 'Align the center with the main façade',
    visualCue: 'What to look for',
    lensNotice: 'This is currently a camera guidance mode. Historical 3D geometry comes after on-site alignment.'
  },
  zh: {
    heroKicker: '把城市变成时光机',
    heroTitle: '看见今天的莫斯科，也发现那些已经消失的城市层次',
    heroBody: '地图、经验证的历史、步行路线、音频与空间场景围绕真实地点连接在一起。',
    startVarvarka: '开始瓦尔瓦尔卡路线 · 45分钟',
    locationUnavailable: '无法获取定位，但仍可手动选择地点继续使用。',
    nearbyStories: '附近的故事',
    pilotPlaces: '试点地点',
    placeStory: '地点故事',
    today: '今天',
    now: '现在',
    currentState: '当代状态是与有文献依据的历史层进行比较的参照点。',
    whatToLookFor: '现场观察重点',
    cameraGuides: '相机与定位提示',
    runtimeProbe: '检查空间运行环境',
    runtimeNotice: '空间运行环境已连接。历史3D模型只有在GLB资产准备完成并通过瓦尔瓦尔卡现场对齐验证后才会显示。',
    cityLayer: '城市层',
    cityLayerTitle: '在莫斯科地图上直接阅读历史',
    cityLayerBody: '原生版本使用 Yandex MapKit 展示地点、路线、定位以及未来的历史图层。',
    openStory: '打开故事与时光机 →',
    walkKicker: '步行路线 #01',
    walkTitle: '瓦尔瓦尔卡：一条记住多个时代莫斯科的街道',
    stopLabel: (index: number) => `现在 · 第${index}站`,
    finishWalk: '完成路线',
    discoveredNext: '已探索 · 下一站',
    explorePlace: '深入了解',
    allStops: '全部站点',
    myMoscow: '我的莫斯科',
    myMoscowBody: '保存你发现的地点，并按街区逐步建立自己的莫斯科收藏。',
    nothingSaved: '暂时没有收藏',
    discovered: '已探索',
    saved: '已收藏',
    language: '语言',
    platformCapabilities: '平台能力',
    platformCapabilitiesBody: '这里显示已连接的技术层，以及仍需要密钥、资产或现场测试的部分。',
    alignFacade: '将画面中心与主立面对齐',
    visualCue: '现场观察重点',
    lensNotice: '当前为相机导航模式。历史3D几何将在完成现场对齐验证后加入。'
  }
} as const;

export default function MoscowApp() {
  const [language, setLanguage] = useState<AppLanguage>(() => detectLanguage());
  const ui = t(language);
  const copy = appCopy[language];
  const localizedPlaces = useMemo(() => localizePlaces(places, language), [language]);
  const [tab, setTab] = useState<Tab>('discover');
  const [selectedId, setSelectedId] = useState(localizedPlaces[0]?.id ?? '');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [visitedIds, setVisitedIds] = useState<string[]>([]);
  const [routeStep, setRouteStep] = useState(0);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationState, setLocationState] = useState<'idle' | 'loading' | 'ready' | 'denied' | 'error'>('idle');
  const [hydrated, setHydrated] = useState(false);
  const [lensPlace, setLensPlace] = useState<Place | null>(null);
  const [spatialOpen, setSpatialOpen] = useState(false);
  const [timeValue, setTimeValue] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const selected = useMemo(
    () => localizedPlaces.find((place) => place.id === selectedId) ?? localizedPlaces[0],
    [localizedPlaces, selectedId]
  );

  const nearby = useMemo(() => {
    const list = localizedPlaces.map((place) => ({
      place,
      distance: location ? distanceKm(location, place) : null
    }));
    return location ? list.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999)) : list;
  }, [localizedPlaces, location]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as {
          savedIds?: string[];
          visitedIds?: string[];
          routeStep?: number;
          language?: AppLanguage;
        };
        setSavedIds(Array.isArray(parsed.savedIds) ? parsed.savedIds : []);
        setVisitedIds(Array.isArray(parsed.visitedIds) ? parsed.visitedIds : []);
        setRouteStep(Math.max(0, Math.min(pilotRoute.stopIds.length - 1, parsed.routeStep ?? 0)));
        if (parsed.language === 'ru' || parsed.language === 'en' || parsed.language === 'zh') setLanguage(parsed.language);
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ savedIds, visitedIds, routeStep, language })).catch(() => undefined);
  }, [hydrated, language, routeStep, savedIds, visitedIds]);

  useEffect(() => {
    setTimeValue(0);
    stopTextGuide().catch(() => undefined);
    setIsSpeaking(false);
  }, [selectedId]);

  const tabLabels: Record<Tab, string> = {
    discover: ui.discover,
    map: ui.map,
    route: ui.route,
    saved: ui.saved,
    profile: ui.profile
  };

  const toggleSaved = (id: string) => {
    setSavedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
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
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) return;
    }
    setLensPlace(place);
  };

  const toggleAudio = (place: Place) => {
    if (isSpeaking) {
      stopTextGuide().catch(() => undefined);
      setIsSpeaking(false);
      return;
    }
    const text = `${place.title}. ${place.shortStory}. ${place.highlights.join('. ')}`;
    playTextGuide(text, speechLocale(language));
    setIsSpeaking(true);
  };

  const selectFromMap = (id: string) => {
    setSelectedId(id);
  };

  const routePlaceId = pilotRoute.stopIds[routeStep];
  const routePlace = localizedPlaces.find((place) => place.id === routePlaceId);
  const progressPct = Math.round((visitedIds.length / pilotRoute.stopIds.length) * 100);
  const timeMax = selected?.periods.length ?? 0;
  const roundedTime = Math.min(Math.round(timeValue), timeMax);
  const timePeriod = selected?.periods[roundedTime];
  const todaySelected = Boolean(selected && roundedTime === selected.periods.length);
  const evidence = language === 'ru' ? evidenceRu : language === 'zh' ? evidenceZh : evidenceEn;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.brand}>MOSCOW · TIME</Text>
          <Text style={styles.headerTitle}>{tabLabels[tab]}</Text>
        </View>
        <TouchableOpacity style={styles.language} onPress={() => setLanguage(nextLanguage(language))}>
          <Text style={styles.languageText}>{language.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'discover' && (
          <>
            <View style={styles.hero}>
              <Text style={styles.kicker}>{copy.heroKicker}</Text>
              <Text style={styles.heroTitle}>{copy.heroTitle}</Text>
              <Text style={styles.heroBody}>{copy.heroBody}</Text>
              <View style={styles.heroButtons}>
                <TouchableOpacity style={styles.primary} onPress={() => setTab('route')}><Text style={styles.primaryText}>{copy.startVarvarka}</Text></TouchableOpacity>
                <TouchableOpacity style={styles.secondary} onPress={findMe}>
                  {locationState === 'loading' ? <ActivityIndicator color="#e8c98c" /> : <Text style={styles.secondaryText}>{ui.nearby}</Text>}
                </TouchableOpacity>
              </View>
              {(locationState === 'denied' || locationState === 'error') && <Text style={styles.helper}>{copy.locationUnavailable}</Text>}
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>{location ? copy.nearbyStories : copy.pilotPlaces}</Text>
              <TouchableOpacity onPress={() => setTab('map')}><Text style={styles.textLink}>{ui.map} →</Text></TouchableOpacity>
            </View>

            {nearby.map(({ place, distance }, index) => (
              <TouchableOpacity key={place.id} style={[styles.card, selectedId === place.id && styles.cardActive]} onPress={() => setSelectedId(place.id)}>
                <View style={styles.cardTop}>
                  <View style={styles.number}><Text style={styles.numberText}>{String(index + 1).padStart(2, '0')}</Text></View>
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardTitle}>{place.title}</Text>
                    <Text style={styles.cardSubtitle}>{place.subtitle}</Text>
                    <Text style={styles.cardMeta}>{distance === null ? `${place.district} · ${place.experienceMinutes} min` : `${distance < 1 ? Math.round(distance * 1000) + ' m' : distance.toFixed(1) + ' km'} · ${place.experienceMinutes} min`}</Text>
                  </View>
                  <TouchableOpacity style={styles.star} onPress={() => toggleSaved(place.id)} accessibilityLabel="Save"><Text style={styles.starText}>{savedIds.includes(place.id) ? '★' : '☆'}</Text></TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}

            {selected && (
              <View style={styles.detail}>
                <View style={styles.detailTop}>
                  <View style={styles.detailTopCopy}>
                    <Text style={styles.kicker}>{copy.placeStory}</Text>
                    <Text style={styles.detailTitle}>{selected.title}</Text>
                  </View>
                  <TouchableOpacity style={styles.audioButton} onPress={() => toggleAudio(selected)}><Text style={styles.audioButtonText}>{isSpeaking ? '■' : '▶'}</Text></TouchableOpacity>
                </View>
                <Text style={styles.detailBody}>{selected.shortStory}</Text>

                {selected.periods.length > 0 && (
                  <View style={styles.timeMachine}>
                    <View style={styles.sectionHeading}>
                      <Text style={styles.kicker}>{ui.timeMachine.toUpperCase()}</Text>
                      <Text style={styles.timeYear}>{todaySelected ? copy.today : timePeriod?.year}</Text>
                    </View>
                    <Slider
                      minimumValue={0}
                      maximumValue={selected.periods.length}
                      step={1}
                      value={timeValue}
                      onValueChange={setTimeValue}
                      minimumTrackTintColor="#d7bb84"
                      maximumTrackTintColor="#43464d"
                      thumbTintColor="#f0d39b"
                    />
                    <View style={styles.timeLabels}><Text style={styles.timeSmall}>{selected.periods[0]?.year}</Text><Text style={styles.timeSmall}>{copy.now}</Text></View>
                    <Text style={styles.periodTitle}>{todaySelected ? selected.subtitle : timePeriod?.label}</Text>
                    <Text style={styles.periodBody}>{todaySelected ? copy.currentState : timePeriod?.summary}</Text>
                    {!todaySelected && timePeriod && <Text style={styles.evidence}>{evidence[timePeriod.confidence]}</Text>}
                  </View>
                )}

                <Text style={styles.kicker}>{copy.whatToLookFor}</Text>
                {selected.highlights.map((item, index) => <View key={item} style={styles.fact}><Text style={styles.factIndex}>{index + 1}</Text><Text style={styles.factText}>{item}</Text></View>)}

                <View style={styles.experienceGrid}>
                  <TouchableOpacity style={styles.experience} onPress={() => openLens(selected)}><Text style={styles.experienceIcon}>◉</Text><Text style={styles.experienceTitle}>{ui.lens}</Text><Text style={styles.experienceBody}>{copy.cameraGuides}</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.experience} onPress={() => setSpatialOpen(true)}><Text style={styles.experienceIcon}>◫</Text><Text style={styles.experienceTitle}>AR / 3D</Text><Text style={styles.experienceBody}>{copy.runtimeProbe}</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.experience} onPress={() => setSpatialOpen(true)}><Text style={styles.experienceIcon}>◌</Text><Text style={styles.experienceTitle}>VR</Text><Text style={styles.experienceBody}>Quest</Text></TouchableOpacity>
                </View>
                <Text style={styles.notice}>{copy.runtimeNotice}</Text>

                <Text style={styles.kicker}>{ui.sources.toUpperCase()}</Text>
                {selected.sources.map((source) => <TouchableOpacity key={source.url} style={styles.source} onPress={() => Linking.openURL(source.url)}><Text style={styles.sourceText}>{source.label}</Text><Text style={styles.sourceArrow}>↗</Text></TouchableOpacity>)}
              </View>
            )}
          </>
        )}

        {tab === 'map' && (
          <>
            <View style={styles.mapIntro}>
              <Text style={styles.kicker}>{copy.cityLayer}</Text>
              <Text style={styles.detailTitle}>{copy.cityLayerTitle}</Text>
              <Text style={styles.detailBody}>{copy.cityLayerBody}</Text>
            </View>
            <MoscowMap selectedId={selectedId} onSelect={selectFromMap} />
            {selected && <TouchableOpacity style={styles.mapSelection} onPress={() => setTab('discover')}><Text style={styles.cardTitle}>{selected.title}</Text><Text style={styles.cardSubtitle}>{copy.openStory}</Text></TouchableOpacity>}
          </>
        )}

        {tab === 'route' && (
          <>
            <View style={styles.hero}>
              <Text style={styles.kicker}>{copy.walkKicker}</Text>
              <Text style={styles.heroTitle}>{copy.walkTitle}</Text>
              <Text style={styles.heroBody}>{pilotRoute.distanceKm} km · {pilotRoute.durationMinutes} min · {pilotRoute.stopIds.length} stops</Text>
              <View style={styles.progress}><View style={[styles.progressFill, { width: `${progressPct}%` }]} /></View>
              <Text style={styles.helper}>{progressPct}%</Text>
            </View>
            {routePlace && <View style={styles.detail}><Text style={styles.kicker}>{copy.stopLabel(routeStep + 1)}</Text><Text style={styles.detailTitle}>{routePlace.title}</Text><Text style={styles.detailBody}>{routePlace.shortStory}</Text><TouchableOpacity style={styles.primary} onPress={() => { setVisitedIds((current) => current.includes(routePlace.id) ? current : [...current, routePlace.id]); if (routeStep < pilotRoute.stopIds.length - 1) setRouteStep(routeStep + 1); }}><Text style={styles.primaryText}>{routeStep === pilotRoute.stopIds.length - 1 ? copy.finishWalk : copy.discoveredNext}</Text></TouchableOpacity><TouchableOpacity style={styles.secondary} onPress={() => { setSelectedId(routePlace.id); setTab('discover'); }}><Text style={styles.secondaryText}>{copy.explorePlace}</Text></TouchableOpacity></View>}
            <Text style={styles.sectionTitle}>{copy.allStops}</Text>
            {pilotRoute.stopIds.map((id, index) => {
              const place = localizedPlaces.find((item) => item.id === id);
              if (!place) return null;
              return <TouchableOpacity key={id} style={[styles.routeRow, index === routeStep && styles.routeRowActive]} onPress={() => setRouteStep(index)}><Text style={styles.routeNumber}>{visitedIds.includes(id) ? '✓' : index + 1}</Text><View style={styles.cardCopy}><Text style={styles.cardTitle}>{place.title}</Text><Text style={styles.cardSubtitle}>{place.experienceMinutes} min</Text></View></TouchableOpacity>;
            })}
          </>
        )}

        {tab === 'saved' && (
          <>
            <Text style={styles.sectionTitle}>{copy.myMoscow}</Text>
            <Text style={styles.detailBody}>{copy.myMoscowBody}</Text>
            {savedIds.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>{copy.nothingSaved}</Text><TouchableOpacity style={styles.secondary} onPress={() => setTab('discover')}><Text style={styles.secondaryText}>{ui.discover}</Text></TouchableOpacity></View> : savedIds.map((id) => {
              const place = localizedPlaces.find((item) => item.id === id);
              return place ? <TouchableOpacity key={id} style={styles.card} onPress={() => { setSelectedId(id); setTab('discover'); }}><Text style={styles.cardTitle}>{place.title}</Text><Text style={styles.cardSubtitle}>{place.district}</Text></TouchableOpacity> : null;
            })}
          </>
        )}

        {tab === 'profile' && (
          <>
            <View style={styles.metricRow}><View style={styles.metric}><Text style={styles.metricValue}>{visitedIds.length}</Text><Text style={styles.metricLabel}>{copy.discovered}</Text></View><View style={styles.metric}><Text style={styles.metricValue}>{savedIds.length}</Text><Text style={styles.metricLabel}>{copy.saved}</Text></View><View style={styles.metric}><Text style={styles.metricValue}>{language.toUpperCase()}</Text><Text style={styles.metricLabel}>{copy.language}</Text></View></View>
            <View style={styles.detail}>
              <Text style={styles.detailTitle}>{copy.platformCapabilities}</Text>
              <Text style={styles.detailBody}>{copy.platformCapabilitiesBody}</Text>
              {capabilities.map((capability) => <View key={capability.id} style={styles.capability}><View style={styles.capabilityCopy}><Text style={styles.cardTitle}>{capability.title}</Text><Text style={styles.cardSubtitle}>{capability.provider}</Text></View><Text style={styles.capabilityStatus}>{statusLabels[capability.status]}</Text></View>)}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.nav}>
        {(Object.keys(tabLabels) as Tab[]).map((item) => <TouchableOpacity key={item} style={styles.navItem} onPress={() => setTab(item)}><Text style={[styles.navText, tab === item && styles.navTextActive]}>{tabLabels[item]}</Text></TouchableOpacity>)}
      </View>

      <Modal visible={lensPlace !== null} animationType="slide" onRequestClose={() => setLensPlace(null)}>
        <View style={styles.modalRoot}>
          {lensPlace && <CameraView style={StyleSheet.absoluteFill} facing="back" />}
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalHeader}><View style={styles.modalHeaderCopy}><Text style={styles.kicker}>{ui.lens.toUpperCase()}</Text><Text style={styles.modalTitle}>{lensPlace?.title}</Text></View><TouchableOpacity style={styles.close} onPress={() => setLensPlace(null)}><Text style={styles.closeText}>×</Text></TouchableOpacity></View>
            <View style={styles.alignment}><View style={styles.crossH} /><View style={styles.crossV} /><Text style={styles.alignmentText}>{copy.alignFacade}</Text></View>
            <View style={styles.lensPanel}><Text style={styles.cardTitle}>{copy.visualCue}</Text><Text style={styles.cardSubtitle}>{lensPlace?.highlights[0]}</Text><Text style={styles.notice}>{copy.lensNotice}</Text></View>
          </SafeAreaView>
        </View>
      </Modal>

      <Modal visible={spatialOpen} animationType="fade" onRequestClose={() => setSpatialOpen(false)}>
        <View style={styles.modalRoot}><MoscowSpatialNavigator /><SafeAreaView style={styles.spatialCloseWrap}><TouchableOpacity style={styles.close} onPress={() => setSpatialOpen(false)}><Text style={styles.closeText}>×</Text></TouchableOpacity></SafeAreaView></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090b0d' },
  header: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#292d33' },
  headerCopy: { flex: 1, minWidth: 0 },
  brand: { color: '#979aa2', fontSize: 10, letterSpacing: 2, fontWeight: '900' },
  headerTitle: { color: '#f7f3eb', fontSize: 28, fontWeight: '800', marginTop: 3 },
  language: { minWidth: 46, height: 42, borderRadius: 21, backgroundColor: '#20242a', alignItems: 'center', justifyContent: 'center' },
  languageText: { color: '#e7c98f', fontSize: 11, fontWeight: '900' },
  content: { padding: 18, paddingBottom: 115 },
  hero: { borderRadius: 27, padding: 22, backgroundColor: '#15191e', borderWidth: StyleSheet.hairlineWidth, borderColor: '#31353b', marginBottom: 24 },
  kicker: { color: '#b99b69', fontSize: 10, letterSpacing: 1.5, fontWeight: '900', marginBottom: 8 },
  heroTitle: { color: '#fff8ea', fontSize: 31, lineHeight: 37, fontWeight: '800' },
  heroBody: { color: '#b5b8be', fontSize: 15, lineHeight: 23, marginTop: 12 },
  heroButtons: { marginTop: 4 },
  primary: { minHeight: 50, borderRadius: 16, backgroundColor: '#ddbf86', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, marginTop: 14 },
  primaryText: { color: '#17130d', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  secondary: { minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: '#41464e', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, marginTop: 9 },
  secondaryText: { color: '#e3cfaa', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  helper: { color: '#898d96', fontSize: 12, lineHeight: 17, marginTop: 10 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: '#f3efe6', fontSize: 21, fontWeight: '800', marginBottom: 13 },
  textLink: { color: '#d8b97c', fontSize: 13, fontWeight: '800' },
  card: { borderRadius: 20, backgroundColor: '#14171b', borderWidth: 1, borderColor: '#272b31', padding: 16, marginBottom: 11 },
  cardActive: { borderColor: '#a88d60' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  number: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#24282e', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  numberText: { color: '#dfbd7d', fontSize: 11, fontWeight: '900' },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTitle: { color: '#f1eee7', fontSize: 16, fontWeight: '800' },
  cardSubtitle: { color: '#9da1a9', fontSize: 13, lineHeight: 19, marginTop: 4 },
  cardMeta: { color: '#c1a36f', fontSize: 11, fontWeight: '800', marginTop: 7 },
  star: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  starText: { color: '#e0bf80', fontSize: 27 },
  detail: { borderRadius: 25, backgroundColor: '#171a1f', borderWidth: StyleSheet.hairlineWidth, borderColor: '#31353b', padding: 20, marginTop: 10, marginBottom: 14 },
  detailTop: { flexDirection: 'row', alignItems: 'flex-start' },
  detailTopCopy: { flex: 1, minWidth: 0 },
  detailTitle: { color: '#f8f3e9', fontSize: 24, lineHeight: 30, fontWeight: '800' },
  detailBody: { color: '#b4b7be', fontSize: 15, lineHeight: 23, marginTop: 9, marginBottom: 14 },
  audioButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#dec18b', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  audioButtonText: { color: '#17130d', fontSize: 18, fontWeight: '900' },
  timeMachine: { backgroundColor: '#101318', borderRadius: 18, padding: 16, marginVertical: 13 },
  timeYear: { color: '#efd29a', fontSize: 18, fontWeight: '900' },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  timeSmall: { color: '#72767e', fontSize: 10 },
  periodTitle: { color: '#ece8de', fontSize: 17, fontWeight: '800', marginTop: 13 },
  periodBody: { color: '#a4a7ad', fontSize: 13, lineHeight: 20, marginTop: 5 },
  evidence: { color: '#af9364', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginTop: 8 },
  fact: { flexDirection: 'row', paddingVertical: 7 },
  factIndex: { color: '#d8b779', fontSize: 12, fontWeight: '900', width: 25, paddingTop: 2 },
  factText: { color: '#c2c4c8', flex: 1, fontSize: 14, lineHeight: 20 },
  experienceGrid: { flexDirection: 'row', gap: 7, marginTop: 14 },
  experience: { flex: 1, minHeight: 92, borderRadius: 16, backgroundColor: '#22262c', padding: 12 },
  experienceIcon: { color: '#e7c98f', fontSize: 20, fontWeight: '900' },
  experienceTitle: { color: '#f0e7d5', fontSize: 12, fontWeight: '900', marginTop: 7 },
  experienceBody: { color: '#90949c', fontSize: 10, lineHeight: 14, marginTop: 3 },
  notice: { color: '#7f848d', fontSize: 11, lineHeight: 16, marginTop: 11, marginBottom: 12 },
  source: { minHeight: 48, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#30343a', flexDirection: 'row', alignItems: 'center' },
  sourceText: { flex: 1, color: '#c6c8cc', fontSize: 12, lineHeight: 18 },
  sourceArrow: { color: '#d7b778', fontSize: 18, marginLeft: 10 },
  mapIntro: { marginBottom: 14 },
  mapSelection: { borderRadius: 18, backgroundColor: '#171a1f', padding: 16, marginTop: 12 },
  progress: { height: 5, borderRadius: 5, backgroundColor: '#30343a', overflow: 'hidden', marginTop: 20 },
  progressFill: { height: '100%', backgroundColor: '#d8b779' },
  routeRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, backgroundColor: '#14171b', borderWidth: 1, borderColor: 'transparent', marginBottom: 9 },
  routeRowActive: { borderColor: '#806d4d' },
  routeNumber: { color: '#dbb978', fontSize: 23, width: 42, fontWeight: '700' },
  empty: { borderRadius: 20, backgroundColor: '#15191e', padding: 20, marginTop: 10 },
  emptyTitle: { color: '#f2eee5', fontSize: 18, fontWeight: '800' },
  metricRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  metric: { flex: 1, minWidth: 0, borderRadius: 18, backgroundColor: '#171a1f', padding: 14 },
  metricValue: { color: '#e1c084', fontSize: 25, fontWeight: '900' },
  metricLabel: { color: '#858992', fontSize: 10, marginTop: 4 },
  capability: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#30343a', paddingVertical: 12 },
  capabilityCopy: { flex: 1, minWidth: 0, paddingRight: 8 },
  capabilityStatus: { color: '#bd9f68', fontSize: 10, fontWeight: '900', textAlign: 'right', maxWidth: 110 },
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 72, backgroundColor: '#101317', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#30343a', flexDirection: 'row', paddingTop: 7, paddingBottom: 11, paddingHorizontal: 4 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: 0, paddingHorizontal: 3 },
  navText: { color: '#737781', fontSize: 10, fontWeight: '800', textAlign: 'center' },
  navTextActive: { color: '#e6c98f' },
  modalRoot: { flex: 1, backgroundColor: '#050607' },
  modalOverlay: { flex: 1, justifyContent: 'space-between', padding: 18 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  modalHeaderCopy: { flex: 1, minWidth: 0, backgroundColor: 'rgba(8,10,12,0.78)', borderRadius: 18, padding: 15, marginRight: 10 },
  modalTitle: { color: '#fff8ea', fontSize: 21, fontWeight: '800' },
  close: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(12,14,17,0.82)' },
  closeText: { color: '#f7f1e6', fontSize: 27, lineHeight: 30 },
  alignment: { alignSelf: 'center', width: 250, height: 250, borderWidth: 1, borderColor: 'rgba(238,209,153,0.55)', borderRadius: 125, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 24 },
  crossH: { position: 'absolute', left: 77, right: 77, top: 124, height: 1, backgroundColor: '#efd199' },
  crossV: { position: 'absolute', top: 77, bottom: 77, left: 124, width: 1, backgroundColor: '#efd199' },
  alignmentText: { color: '#fff4df', fontSize: 11, fontWeight: '800', backgroundColor: 'rgba(8,10,12,0.7)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  lensPanel: { borderRadius: 20, backgroundColor: 'rgba(10,12,15,0.86)', padding: 17 },
  spatialCloseWrap: { position: 'absolute', right: 18, top: 0, bottom: 0, paddingTop: 18, pointerEvents: 'box-none' }
});
