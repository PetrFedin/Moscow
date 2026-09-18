import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { localizePlaces } from './data/places.en';
import { pilotRoute, places, type Place } from './data/places';
import MoscowMap from './features/map/MoscowMap';
import OfflineRoutePackControl from './features/offline/OfflineRoutePackControl';
import TouristRoutePlanner from './features/planning/TouristRoutePlanner';
import { buildTouristRoutePlan, type TouristInterest, type TouristRoutePlan, type TouristTimeBudget } from './features/planning/touristPlanner';
import ArchiveTimeLens from './features/spatial/ArchiveTimeLens';
import HistoricalModelViewer from './features/spatial/HistoricalModelViewer';
import MoscowSpatialNavigator from './features/spatial/MoscowSpatialNavigator';
import WalkCompanion from './features/walk/WalkCompanion';
import { detectLanguage, type AppLanguage } from './i18n';
import { EXPERIENCE_STORAGE_KEY, normalizeExperienceSnapshot, type PersistedExperienceState, type PersistedTab } from './persistence/experiencePersistence';
import {
  canOpenArchiveLens,
  canOpenModel3d,
  canOpenSpatial,
  getPlaceExperienceCapabilities,
  modelEraFromTimeIndex
} from './spatial/placeExperienceRegistry';
import PhysicalPressable from './ui/PhysicalPressable';
import PhysicalSheet from './ui/PhysicalSheet';
import TimeMachineSlider from './ui/TimeMachineSlider';
import type { StableSheetState } from './ui/interactionPhysics';

type Tab = PersistedTab;
type ModalMode = null | 'lens' | 'model' | 'spatial';
type RomanovEra = '1857' | '1859';
type TrustMode = 'documented' | 'public';

const SPATIAL_PLACE_STORAGE_KEY = 'moscow:p0:spatial-place:v1';
const ERA_STORAGE_KEY = 'moscow:p0:romanov-era:v1';
const TRUST_STORAGE_KEY = 'moscow:p0:romanov-trust-mode:v1';

const copy = {
  ru: {
    discover: 'Открыть', map: 'Карта', walk: 'Прогулка', savedTab: 'Моя Москва',
    cityTime: 'ГОРОД КАК МАШИНА ВРЕМЕНИ',
    hero: 'Москва раскрывается прямо вокруг вас',
    heroBody: 'Места, архивы, 3D, AR, VR и проверенные источники собраны в один непрерывный маршрут.',
    start: 'Начать Варварку · 45 мин',
    places: 'Места пилота', story: 'ИСТОРИЯ МЕСТА', time: 'МАШИНА ВРЕМЕНИ',
    today: 'Сегодня', facts: 'ЧТО ИСКАТЬ ГЛАЗАМИ', sources: 'ИСТОЧНИКИ',
    open3d: 'Открыть 3D', lens: 'Линза времени', save: 'Сохранить', savedAction: 'Сохранено',
    onlyFacts: 'Только факты', research: '+ реконструкция',
    lensPreparing: 'Линза · готовится', modelPreparing: '3D · готовится',
    mapHint: 'Тяните карточку пальцем: свернуть · preview · раскрыть',
    openStory: 'Открыть историю', next: 'Открыто · дальше', finish: 'Завершить прогулку',
    noSaved: 'Пока ничего не сохранено', back3d: '← 3D-модель', close: 'Закрыть'
  },
  en: {
    discover: 'Discover', map: 'Map', walk: 'Walk', savedTab: 'My Moscow',
    cityTime: 'THE CITY AS A TIME MACHINE',
    hero: 'Moscow reveals itself around you',
    heroBody: 'Places, archives, 3D, AR, VR and verified sources form one continuous journey.',
    start: 'Start Varvarka · 45 min',
    places: 'Pilot places', story: 'PLACE STORY', time: 'TIME MACHINE',
    today: 'Today', facts: 'WHAT TO LOOK FOR', sources: 'SOURCES',
    open3d: 'Open 3D', lens: 'Time Lens', save: 'Save', savedAction: 'Saved',
    onlyFacts: 'Facts only', research: '+ reconstruction',
    lensPreparing: 'Lens · preparing', modelPreparing: '3D · preparing',
    mapHint: 'Drag the card: collapsed · preview · expanded',
    openStory: 'Open story', next: 'Discovered · next', finish: 'Finish walk',
    noSaved: 'Nothing saved yet', back3d: '← 3D model', close: 'Close'
  }
} as const;

const evidenceLabel = {
  ru: { documented: 'Подтверждено источником', reconstructed: 'Исследовательская реконструкция', hypothesis: 'Гипотеза' },
  en: { documented: 'Documented evidence', reconstructed: 'Research reconstruction', hypothesis: 'Hypothesis' }
} as const;

export default function MoscowExperienceApp() {
  const [language, setLanguage] = useState<AppLanguage>(() => detectLanguage());
  const [tab, setTab] = useState<Tab>('discover');
  const [selectedId, setSelectedId] = useState('romanov-chambers');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [visitedIds, setVisitedIds] = useState<string[]>([]);
  const [routeStep, setRouteStep] = useState(0);
  const [routeBudgetMinutes, setRouteBudgetMinutes] = useState<TouristTimeBudget>(45);
  const [routeInterest, setRouteInterest] = useState<TouristInterest>('highlights');
  const [missionDoneIds, setMissionDoneIds] = useState<string[]>([]);
  const [walkAutoAudio, setWalkAutoAudio] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [timeValue, setTimeValue] = useState(0);
  const [era, setEra] = useState<RomanovEra>('1857');
  const [trustMode, setTrustMode] = useState<TrustMode>('public');
  const [lensOpacity, setLensOpacity] = useState(0.52);
  const [lensVisible, setLensVisible] = useState(true);
  const [mapSheetState, setMapSheetState] = useState<StableSheetState>('preview');
  const [modal, setModal] = useState<ModalMode>(null);

  const ui = copy[language];
  const tabLabels: Record<Tab, string> = {
    discover: ui.discover,
    map: ui.map,
    walk: ui.walk,
    saved: ui.savedTab
  };
  const localizedPlaces = useMemo(() => localizePlaces(places, language), [language]);
  const selected = useMemo(
    () => localizedPlaces.find((place) => place.id === selectedId) ?? localizedPlaces[0],
    [localizedPlaces, selectedId]
  );
  const selectedExperience = useMemo(() => getPlaceExperienceCapabilities(selectedId), [selectedId]);
  const activeRoutePlan = useMemo(
    () => buildTouristRoutePlan(routeBudgetMinutes, routeInterest, localizedPlaces),
    [localizedPlaces, routeBudgetMinutes, routeInterest]
  );
  const routePlace = useMemo(
    () => localizedPlaces.find((place) => place.id === activeRoutePlan.stopIds[routeStep]),
    [activeRoutePlan.stopIds, localizedPlaces, routeStep]
  );
  const archiveAvailable = Boolean(selected && canOpenArchiveLens(selected.id));
  const modelAvailable = Boolean(selected && canOpenModel3d(selected.id));

  useEffect(() => {
    AsyncStorage.getItem(EXPERIENCE_STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = normalizeExperienceSnapshot(JSON.parse(raw));
        setSavedIds(parsed.savedIds);
        setVisitedIds(parsed.visitedIds);
        setRouteStep(parsed.routeStep);
        setLanguage(parsed.language);
        setLensOpacity(parsed.lensOpacity);
        setLensVisible(parsed.lensVisible);
        setSelectedId(parsed.selectedId);
        setTab(parsed.tab);
        setTimeValue(parsed.timeValue);
        setEra(parsed.era);
        setTrustMode(parsed.trustMode);
        setRouteBudgetMinutes(parsed.routeBudgetMinutes);
        setRouteInterest(parsed.routeInterest);
        setMissionDoneIds(parsed.missionDoneIds);
        setWalkAutoAudio(parsed.walkAutoAudio);
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: PersistedExperienceState = {
      savedIds,
      visitedIds,
      routeStep,
      language,
      lensOpacity,
      lensVisible,
      selectedId,
      tab,
      timeValue,
      era,
      trustMode,
      routeBudgetMinutes,
      routeInterest,
      missionDoneIds,
      walkAutoAudio
    };
    AsyncStorage.setItem(EXPERIENCE_STORAGE_KEY, JSON.stringify(payload)).catch(() => undefined);
  }, [era, hydrated, language, lensOpacity, lensVisible, missionDoneIds, routeBudgetMinutes, routeInterest, routeStep, savedIds, selectedId, tab, timeValue, trustMode, visitedIds, walkAutoAudio]);

  const selectPlace = (id: string) => {
    if (id !== selectedId) {
      setTimeValue(0);
      const nextEra = modelEraFromTimeIndex(id, 0);
      if (nextEra) setEra(nextEra);
    }
    setSelectedId(id);
    setMapSheetState('preview');
  };

  const toggleSaved = (id: string) => {
    setSavedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const onTimeChange = (value: number) => {
    setTimeValue(value);
    const nextEra = modelEraFromTimeIndex(selectedId, value);
    if (nextEra) setEra(nextEra);
  };

  const prepareSpatial = async () => {
    if (!canOpenSpatial(selectedId)) return false;
    await Promise.all([
      AsyncStorage.setItem(SPATIAL_PLACE_STORAGE_KEY, selectedId),
      AsyncStorage.setItem(ERA_STORAGE_KEY, era),
      AsyncStorage.setItem(TRUST_STORAGE_KEY, trustMode)
    ]).catch(() => undefined);
    return true;
  };

  const openSpatial = async () => {
    if (!await prepareSpatial()) return;
    setModal('spatial');
  };

  const openModel = () => {
    if (!canOpenModel3d(selectedId)) return;
    setModal('model');
  };

  const openLens = () => {
    if (!selected || !canOpenArchiveLens(selected.id)) return;
    setModal('lens');
  };

  const roundedTime = selected ? Math.min(Math.round(timeValue), selected.periods.length) : 0;
  const todaySelected = Boolean(selected && roundedTime === selected.periods.length);
  const activePeriod = selected?.periods[roundedTime];
  const completedRouteStops = activeRoutePlan.stopIds.filter((id) => visitedIds.includes(id)).length;
  const progress = Math.round((completedRouteStops / Math.max(1, activeRoutePlan.stopIds.length)) * 100);

  const startTouristPlan = (plan: TouristRoutePlan) => {
    setRouteBudgetMinutes(plan.budgetMinutes);
    setRouteInterest(plan.interest);
    setRouteStep(0);
    setTab('walk');
  };

  const completeRouteStop = (placeId: string) => {
    setVisitedIds((current) => current.includes(placeId) ? current : [...current, placeId]);
    if (routeStep < activeRoutePlan.stopIds.length - 1) {
      setRouteStep((current) => current + 1);
    }
  };

  const completeMission = (missionId: string) => {
    setMissionDoneIds((current) => current.includes(missionId) ? current : [...current, missionId]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.brand}>MOSCOW · TIME</Text>
          <Text style={styles.headerTitle}>{tabLabels[tab]}</Text>
        </View>
        <PhysicalPressable
          style={styles.language}
          contentStyle={styles.center}
          onPress={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
          accessibilityLabel="Change language"
        >
          <Text style={styles.languageText}>{language.toUpperCase()}</Text>
        </PhysicalPressable>
      </View>

      {tab === 'map' ? (
        <View style={styles.mapPage}>
          <View style={styles.mapStage}>
            <MoscowMap selectedId={selectedId} onSelect={selectPlace} />
            {selected && (
              <PhysicalSheet
                key={selected.id}
                snapPositions={{ expanded: 72, preview: 292, collapsed: 430 }}
                initialState={mapSheetState}
                onStateChange={setMapSheetState}
                style={styles.mapSheet}
              >
                <View style={styles.sheetSurface}>
                  <View style={styles.sheetHandle} />
                  <Text style={styles.sheetHint}>{ui.mapHint}</Text>
                  <Text style={styles.sheetTitle}>{selected.title}</Text>
                  <Text style={styles.sheetSubtitle}>{selected.subtitle}</Text>
                  <Text style={styles.sheetStory} numberOfLines={mapSheetState === 'expanded' ? undefined : 2}>{selected.shortStory}</Text>
                  <View style={styles.sheetActions}>
                    <PhysicalPressable style={styles.smallSecondary} contentStyle={styles.center} onPress={() => toggleSaved(selected.id)}>
                      <Text style={styles.smallSecondaryText}>{savedIds.includes(selected.id) ? ui.savedAction : ui.save}</Text>
                    </PhysicalPressable>
                    <PhysicalPressable
                      style={styles.smallPrimary}
                      contentStyle={styles.center}
                      strong
                      onPress={() => setTab('discover')}
                    >
                      <Text style={styles.smallPrimaryText}>{ui.openStory}</Text>
                    </PhysicalPressable>
                  </View>
                </View>
              </PhysicalSheet>
            )}
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {tab === 'discover' && (
            <>
              <View style={styles.hero}>
                <Text style={styles.kicker}>{ui.cityTime}</Text>
                <Text style={styles.heroTitle}>{ui.hero}</Text>
                <Text style={styles.heroBody}>{ui.heroBody}</Text>
                <PhysicalPressable style={styles.primary} contentStyle={styles.center} strong onPress={() => setTab('walk')}>
                  <Text style={styles.primaryText}>{ui.start}</Text>
                </PhysicalPressable>
              </View>

              <TouristRoutePlanner language={language} onStart={startTouristPlan} />

              <Text style={styles.sectionTitle}>{ui.places}</Text>
              {localizedPlaces.map((place, index) => (
                <PhysicalPressable
                  key={place.id}
                  style={[styles.placeCard, place.id === selectedId && styles.placeCardActive]}
                  contentStyle={styles.placeCardContent}
                  onPress={() => selectPlace(place.id)}
                  accessibilityLabel={place.title}
                >
                  <View style={styles.placeNumber}><Text style={styles.placeNumberText}>{String(index + 1).padStart(2, '0')}</Text></View>
                  <View style={styles.placeCopy}>
                    <Text style={styles.placeTitle}>{place.title}</Text>
                    <Text style={styles.placeSubtitle}>{place.subtitle}</Text>
                    <Text style={styles.placeMeta}>{place.district} · {place.experienceMinutes} min</Text>
                  </View>
                </PhysicalPressable>
              ))}

              {selected && (
                <View style={styles.storyCard}>
                  <View style={styles.storyHeader}>
                    <View style={styles.storyHeaderCopy}>
                      <Text style={styles.kicker}>{ui.story}</Text>
                      <Text style={styles.storyTitle}>{selected.title}</Text>
                    </View>
                    <PhysicalPressable style={styles.saveIcon} contentStyle={styles.center} onPress={() => toggleSaved(selected.id)} accessibilityLabel={ui.save}>
                      <Text style={styles.saveIconText}>{savedIds.includes(selected.id) ? '★' : '☆'}</Text>
                    </PhysicalPressable>
                  </View>
                  <Text style={styles.storyBody}>{selected.shortStory}</Text>

                  {selected.periods.length > 0 && selectedExperience.timeMachine === 'ready' && (
                    <View style={styles.timeCard}>
                      <View style={styles.timeTop}>
                        <Text style={styles.kicker}>{ui.time}</Text>
                        <Text style={styles.timeYear}>{todaySelected ? ui.today : activePeriod?.year}</Text>
                      </View>
                      <TimeMachineSlider
                        minimumValue={0}
                        maximumValue={selected.periods.length}
                        step={1}
                        value={timeValue}
                        onValueChange={onTimeChange}
                        startLabel={selected.periods[0]?.year}
                        endLabel={ui.today}
                        accessibilityLabel={language === 'ru' ? 'Выберите историческую эпоху' : 'Choose historical period'}
                      />
                      <Text style={styles.periodTitle}>{todaySelected ? selected.subtitle : activePeriod?.label}</Text>
                      <Text style={styles.periodBody}>{todaySelected ? (language === 'ru' ? 'Современное состояние — точка сравнения с историческими слоями.' : 'The current state is the comparison point for historical layers.') : activePeriod?.summary}</Text>
                      {!todaySelected && activePeriod && <Text style={styles.evidence}>{evidenceLabel[language][activePeriod.confidence]}</Text>}

                      {selectedExperience.modelEraMap && (
                        <View style={styles.trustRow}>
                          <PhysicalPressable
                            style={[styles.trustButton, trustMode === 'documented' && styles.trustButtonActive]}
                            contentStyle={styles.center}
                            onPress={() => setTrustMode('documented')}
                          >
                            <Text style={[styles.trustText, trustMode === 'documented' && styles.trustTextActive]}>{ui.onlyFacts}</Text>
                          </PhysicalPressable>
                          <PhysicalPressable
                            style={[styles.trustButton, trustMode === 'public' && styles.trustButtonActive]}
                            contentStyle={styles.center}
                            onPress={() => setTrustMode('public')}
                          >
                            <Text style={[styles.trustText, trustMode === 'public' && styles.trustTextActive]}>{ui.research}</Text>
                          </PhysicalPressable>
                        </View>
                      )}
                    </View>
                  )}

                  <Text style={styles.kicker}>{ui.facts}</Text>
                  {selected.highlights.map((item, index) => (
                    <View key={item} style={styles.factRow}>
                      <Text style={styles.factNumber}>{index + 1}</Text>
                      <Text style={styles.factText}>{item}</Text>
                    </View>
                  ))}

                  <View style={styles.experienceActions}>
                    <PhysicalPressable
                      style={[styles.secondary, !archiveAvailable && styles.disabled]}
                      contentStyle={styles.center}
                      disabled={!archiveAvailable}
                      accessibilityLabel={archiveAvailable ? ui.lens : ui.lensPreparing}
                      onPress={openLens}
                    >
                      <Text style={styles.secondaryText}>{archiveAvailable ? ui.lens : ui.lensPreparing}</Text>
                    </PhysicalPressable>
                    <PhysicalPressable
                      style={[styles.primary, !modelAvailable && styles.disabled]}
                      contentStyle={styles.center}
                      strong
                      hapticEvent="spatial-enter"
                      disabled={!modelAvailable}
                      accessibilityLabel={modelAvailable ? ui.open3d : ui.modelPreparing}
                      onPress={openModel}
                    >
                      <Text style={styles.primaryText}>{modelAvailable ? ui.open3d : ui.modelPreparing}</Text>
                    </PhysicalPressable>
                  </View>

                  <Text style={styles.kicker}>{ui.sources}</Text>
                  {selected.sources.map((source) => (
                    <PhysicalPressable key={source.url} style={styles.source} contentStyle={styles.sourceContent} onPress={() => Linking.openURL(source.url)}>
                      <Text style={styles.sourceText}>{source.label}</Text><Text style={styles.sourceArrow}>↗</Text>
                    </PhysicalPressable>
                  ))}
                </View>
              )}
            </>
          )}

          {tab === 'walk' && (
            <>
              <View style={styles.hero}>
                <Text style={styles.kicker}>WALK · 01</Text>
                <Text style={styles.heroTitle}>{language === 'ru' ? pilotRoute.title : 'Varvarka: a street that remembers several Moscows'}</Text>
                <Text style={styles.heroBody}>
                  {activeRoutePlan.estimatedMinutes} min · {activeRoutePlan.stopIds.length} {language === 'ru' ? 'ост.' : 'stops'} · {routeInterest === 'highlights' ? (language === 'ru' ? 'главное' : 'highlights') : routeInterest}
                </Text>
                <View style={styles.progress}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
              </View>
              <OfflineRoutePackControl language={language} />
              {routePlace && (
                <View style={styles.storyCard}>
                  <Text style={styles.kicker}>{language === 'ru' ? `СЕЙЧАС · ОСТАНОВКА ${routeStep + 1}` : `NOW · STOP ${routeStep + 1}`}</Text>
                  <Text style={styles.storyTitle}>{routePlace.title}</Text>
                  <Text style={styles.storyBody}>{routePlace.shortStory}</Text>
                  <WalkCompanion
                    key={routePlace.id}
                    place={routePlace}
                    language={language}
                    missionDone={missionDoneIds.includes(`observation:${routePlace.id}:v1`)}
                    autoEnabled={walkAutoAudio}
                    onAutoEnabledChange={setWalkAutoAudio}
                    onMissionComplete={completeMission}
                    onAutoStopCompleted={completeRouteStop}
                  />
                  <PhysicalPressable
                    style={styles.primary}
                    contentStyle={styles.center}
                    strong
                    onPress={() => completeRouteStop(routePlace.id)}
                  >
                    <Text style={styles.primaryText}>{routeStep === activeRoutePlan.stopIds.length - 1 ? ui.finish : ui.next}</Text>
                  </PhysicalPressable>
                  <PhysicalPressable style={styles.secondary} contentStyle={styles.center} onPress={() => { selectPlace(routePlace.id); setTab('discover'); }}>
                    <Text style={styles.secondaryText}>{ui.openStory}</Text>
                  </PhysicalPressable>
                </View>
              )}
            </>
          )}

          {tab === 'saved' && (
            <>
              <Text style={styles.sectionTitle}>{ui.savedTab}</Text>
              <View style={styles.myMoscowStats}>
                <Text style={styles.kicker}>{language === 'ru' ? 'МОЯ ИСТОРИЯ МОСКВЫ' : 'MY MOSCOW HISTORY'}</Text>
                <View style={styles.statsRow}>
                  <View style={styles.stat}><Text style={styles.statValue}>{visitedIds.length}</Text><Text style={styles.statLabel}>{language === 'ru' ? 'мест открыто' : 'places seen'}</Text></View>
                  <View style={styles.stat}><Text style={styles.statValue}>{missionDoneIds.length}</Text><Text style={styles.statLabel}>{language === 'ru' ? 'наблюдений' : 'missions'}</Text></View>
                  <View style={styles.stat}><Text style={styles.statValue}>{savedIds.length}</Text><Text style={styles.statLabel}>{language === 'ru' ? 'сохранено' : 'saved'}</Text></View>
                </View>
              </View>
              {savedIds.length === 0 ? (
                <View style={styles.empty}><Text style={styles.emptyText}>{ui.noSaved}</Text></View>
              ) : savedIds.map((id) => {
                const place = localizedPlaces.find((item) => item.id === id);
                if (!place) return null;
                return (
                  <PhysicalPressable key={id} style={styles.placeCard} contentStyle={styles.placeCardContent} onPress={() => { selectPlace(id); setTab('discover'); }}>
                    <View style={styles.placeCopy}><Text style={styles.placeTitle}>{place.title}</Text><Text style={styles.placeSubtitle}>{place.district}</Text></View>
                  </PhysicalPressable>
                );
              })}
            </>
          )}
        </ScrollView>
      )}

      <View style={styles.nav}>
        {(['discover', 'map', 'walk', 'saved'] as Tab[]).map((item) => (
          <PhysicalPressable key={item} style={styles.navItem} contentStyle={styles.center} hapticEvent="none" onPress={() => setTab(item)}>
            <Text style={[styles.navText, tab === item && styles.navTextActive]}>{tabLabels[item]}</Text>
          </PhysicalPressable>
        ))}
      </View>

      <Modal visible={modal === 'lens'} animationType="fade" onRequestClose={() => setModal(null)}>
        {selected && archiveAvailable && (
          <ArchiveTimeLens
            place={selected as Place}
            language={language}
            initialOpacity={lensOpacity}
            initialVisible={lensVisible}
            onStateChange={(state) => { setLensOpacity(state.opacity); setLensVisible(state.visible); }}
            onClose={() => setModal(null)}
            onOpenSpatial={() => setModal('model')}
          />
        )}
      </Modal>

      <Modal visible={modal === 'model'} animationType="fade" onRequestClose={() => setModal(null)}>
        <HistoricalModelViewer
          initialEra={era}
          initialTrustMode={trustMode}
          onStateChange={(state) => { setEra(state.era); setTrustMode(state.trustMode); }}
          onClose={() => setModal(null)}
          onBackToArchive={() => setModal('lens')}
          onOpenSpatial={openSpatial}
        />
      </Modal>

      <Modal visible={modal === 'spatial'} animationType="fade" onRequestClose={() => setModal('model')}>
        <View style={styles.spatialRoot}>
          <MoscowSpatialNavigator key={`${selectedId}-${era}-${trustMode}`} />
          <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            <PhysicalPressable style={styles.back3d} contentStyle={styles.center} hapticEvent="none" onPress={() => setModal('model')}>
              <Text style={styles.back3dText}>{ui.back3d}</Text>
            </PhysicalPressable>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090b0d' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  header: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#292d33' },
  headerCopy: { flex: 1 },
  brand: { color: '#979aa2', fontSize: 9, letterSpacing: 2, fontWeight: '900' },
  headerTitle: { color: '#f7f3eb', fontSize: 27, fontWeight: '900', marginTop: 2 },
  language: { width: 48, height: 44, borderRadius: 22, backgroundColor: '#20242a' },
  languageText: { color: '#e7c98f', fontSize: 11, fontWeight: '900' },
  content: { padding: 18, paddingBottom: 120 },
  hero: { borderRadius: 27, padding: 22, backgroundColor: '#15191e', borderWidth: 1, borderColor: '#31353b', marginBottom: 22 },
  kicker: { color: '#b99b69', fontSize: 9, letterSpacing: 1.4, fontWeight: '900', marginBottom: 7 },
  heroTitle: { color: '#fff8ea', fontSize: 29, lineHeight: 35, fontWeight: '900' },
  heroBody: { color: '#acb0b7', fontSize: 14, lineHeight: 21, marginTop: 10 },
  primary: { minHeight: 50, borderRadius: 16, backgroundColor: '#d7bb84', marginTop: 12 },
  primaryText: { color: '#17130d', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  secondary: { minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: '#454b53', marginTop: 10 },
  secondaryText: { color: '#e0c793', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  disabled: { opacity: 0.42 },
  sectionTitle: { color: '#f4efe6', fontSize: 21, fontWeight: '900', marginBottom: 12 },
  placeCard: { minHeight: 82, borderRadius: 20, borderWidth: 1, borderColor: '#292e34', backgroundColor: '#14171b', marginBottom: 10 },
  placeCardActive: { borderColor: '#9f855a', backgroundColor: '#181713' },
  placeCardContent: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  placeNumber: { width: 39, height: 39, borderRadius: 20, backgroundColor: '#24282e', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  placeNumberText: { color: '#d7bb84', fontSize: 10, fontWeight: '900' },
  placeCopy: { flex: 1, minWidth: 0 },
  placeTitle: { color: '#f3efe8', fontSize: 16, fontWeight: '900' },
  placeSubtitle: { color: '#989da5', fontSize: 12, lineHeight: 17, marginTop: 3 },
  placeMeta: { color: '#b99b69', fontSize: 10, fontWeight: '800', marginTop: 5 },
  storyCard: { borderRadius: 25, backgroundColor: '#171a1f', borderWidth: 1, borderColor: '#32373e', padding: 18, marginTop: 16 },
  storyHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  storyHeaderCopy: { flex: 1 },
  storyTitle: { color: '#fff8ea', fontSize: 24, lineHeight: 29, fontWeight: '900' },
  storyBody: { color: '#b1b4ba', fontSize: 14, lineHeight: 21, marginTop: 9, marginBottom: 16 },
  saveIcon: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: '#484e56' },
  saveIconText: { color: '#e3c17d', fontSize: 25 },
  timeCard: { borderRadius: 19, backgroundColor: '#101318', borderWidth: 1, borderColor: '#333840', padding: 14, marginBottom: 18 },
  timeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeYear: { color: '#f0d39b', fontSize: 15, fontWeight: '900' },
  periodTitle: { color: '#f0ece4', fontSize: 15, fontWeight: '900', marginTop: 9 },
  periodBody: { color: '#989da5', fontSize: 12, lineHeight: 18, marginTop: 5 },
  evidence: { color: '#7eb48c', fontSize: 9, letterSpacing: 0.7, fontWeight: '900', marginTop: 8 },
  trustRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  trustButton: { flex: 1, minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: '#41464d' },
  trustButtonActive: { backgroundColor: '#211b13', borderColor: '#a78b5e' },
  trustText: { color: '#999ea6', fontSize: 10, fontWeight: '900' },
  trustTextActive: { color: '#ebcc91' },
  factRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  factNumber: { color: '#d7bb84', fontSize: 10, fontWeight: '900', width: 18 },
  factText: { color: '#c0c3c8', fontSize: 12, lineHeight: 18, flex: 1 },
  experienceActions: { marginTop: 6, marginBottom: 20 },
  source: { minHeight: 48, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#353a41' },
  sourceContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  sourceText: { color: '#c8cbd0', fontSize: 11, flex: 1 },
  sourceArrow: { color: '#d7bb84', fontSize: 16 },
  mapPage: { flex: 1, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 86 },
  mapStage: { flex: 1, minHeight: 520, borderRadius: 25, overflow: 'hidden', position: 'relative', backgroundColor: '#111418' },
  mapSheet: { top: 0, zIndex: 20 },
  sheetSurface: { minHeight: 250, borderTopLeftRadius: 25, borderTopRightRadius: 25, backgroundColor: '#15191e', borderWidth: 1, borderColor: '#3b4149', padding: 16, shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 16, shadowOffset: { width: 0, height: -4 } },
  sheetHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#697079', alignSelf: 'center', marginBottom: 9 },
  sheetHint: { color: '#787e87', fontSize: 8, letterSpacing: 0.7, textAlign: 'center', marginBottom: 9 },
  sheetTitle: { color: '#fff8ea', fontSize: 20, fontWeight: '900' },
  sheetSubtitle: { color: '#b1b5bc', fontSize: 12, marginTop: 3 },
  sheetStory: { color: '#90959d', fontSize: 11, lineHeight: 16, marginTop: 8 },
  sheetActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  smallSecondary: { flex: 1, minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: '#464c54' },
  smallSecondaryText: { color: '#d6c49f', fontSize: 10, fontWeight: '900' },
  smallPrimary: { flex: 1.4, minHeight: 44, borderRadius: 13, backgroundColor: '#d7bb84' },
  smallPrimaryText: { color: '#17130d', fontSize: 10, fontWeight: '900' },
  progress: { height: 6, borderRadius: 3, backgroundColor: '#2f3339', overflow: 'hidden', marginTop: 16 },
  progressFill: { height: '100%', backgroundColor: '#d7bb84' },
  myMoscowStats: { borderRadius: 20, borderWidth: 1, borderColor: '#343941', backgroundColor: '#111418', padding: 15, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  stat: { flex: 1, borderRadius: 14, backgroundColor: '#181b20', paddingVertical: 10, paddingHorizontal: 8 },
  statValue: { color: '#e7c98f', fontSize: 20, fontWeight: '900' },
  statLabel: { color: '#858b93', fontSize: 8, lineHeight: 11, marginTop: 2 },
  empty: { borderRadius: 20, borderWidth: 1, borderColor: '#30353b', backgroundColor: '#14171b', padding: 20 },
  emptyText: { color: '#999ea6', textAlign: 'center' },
  nav: { position: 'absolute', left: 10, right: 10, bottom: 8, minHeight: 67, borderRadius: 23, backgroundColor: 'rgba(18,21,25,0.97)', borderWidth: 1, borderColor: '#343941', flexDirection: 'row', padding: 6 },
  navItem: { flex: 1, borderRadius: 17 },
  navText: { color: '#7d828a', fontSize: 9, fontWeight: '900', textAlign: 'center' },
  navTextActive: { color: '#e9cb91' },
  spatialRoot: { flex: 1, backgroundColor: '#000' },
  back3d: { position: 'absolute', left: 16, bottom: 24, minHeight: 44, borderRadius: 14, backgroundColor: 'rgba(8,10,12,0.88)', borderWidth: 1, borderColor: '#5b5140', paddingHorizontal: 14 },
  back3dText: { color: '#e5c78d', fontSize: 10, fontWeight: '900' }
});
