import { pilotRoute, places } from '../data/places.ts';
import type { AppLanguage } from '../i18n/index.ts';
import { modelEraFromTimeIndex } from '../spatial/placeExperienceRegistry.ts';
import { buildTouristRoutePlan, type TouristInterest, type TouristTimeBudget } from '../features/planning/touristPlanner.ts';

export type PersistedTab = 'discover' | 'map' | 'walk' | 'saved';
export type PersistedRomanovEra = '1857' | '1859';
export type PersistedTrustMode = 'documented' | 'public';

export type PersistedExperienceState = {
  savedIds: string[];
  visitedIds: string[];
  routeStep: number;
  language: AppLanguage;
  lensOpacity: number;
  lensVisible: boolean;
  selectedId: string;
  tab: PersistedTab;
  timeValue: number;
  era: PersistedRomanovEra;
  trustMode: PersistedTrustMode;
  routeBudgetMinutes: TouristTimeBudget;
  routeInterest: TouristInterest;
};

export const EXPERIENCE_STORAGE_KEY = 'moscow:v4:experience';

const validPlaceIds = new Set(places.map((place) => place.id));
const validTabs = new Set<PersistedTab>(['discover', 'map', 'walk', 'saved']);

const defaultState: PersistedExperienceState = {
  savedIds: [],
  visitedIds: [],
  routeStep: 0,
  language: 'ru',
  lensOpacity: 0.52,
  lensVisible: true,
  selectedId: 'romanov-chambers',
  tab: 'discover',
  timeValue: 0,
  era: '1857',
  trustMode: 'public',
  routeBudgetMinutes: 45,
  routeInterest: 'highlights'
};

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && validPlaceIds.has(item));
}

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function normalizeExperienceSnapshot(raw: unknown): PersistedExperienceState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...defaultState };

  const input = raw as Record<string, unknown>;
  const selectedId = typeof input.selectedId === 'string' && validPlaceIds.has(input.selectedId)
    ? input.selectedId
    : defaultState.selectedId;
  const selectedPlace = places.find((place) => place.id === selectedId);
  const maxTime = selectedPlace?.periods.length ?? 0;
  const timeValue = Math.max(0, Math.min(maxTime, Math.round(finiteNumber(input.timeValue, 0))));
  const fallbackEra = modelEraFromTimeIndex(selectedId, timeValue) ?? defaultState.era;

  const routeBudgetMinutes: TouristTimeBudget = input.routeBudgetMinutes === 15 || input.routeBudgetMinutes === 30 || input.routeBudgetMinutes === 45
    ? input.routeBudgetMinutes
    : defaultState.routeBudgetMinutes;
  const routeInterest: TouristInterest = input.routeInterest === 'highlights'
    || input.routeInterest === 'architecture'
    || input.routeInterest === 'trade'
    || input.routeInterest === 'lost-city'
    ? input.routeInterest
    : defaultState.routeInterest;
  const routePlan = buildTouristRoutePlan(routeBudgetMinutes, routeInterest);
  const routeStep = Math.max(
    0,
    Math.min(
      Math.max(0, routePlan.stopIds.length - 1),
      Math.round(finiteNumber(input.routeStep, defaultState.routeStep))
    )
  );

  return {
    savedIds: stringArray(input.savedIds),
    visitedIds: stringArray(input.visitedIds),
    routeStep,
    language: input.language === 'en' || input.language === 'ru' ? input.language : defaultState.language,
    lensOpacity: Math.max(0, Math.min(0.92, finiteNumber(input.lensOpacity, defaultState.lensOpacity))),
    lensVisible: typeof input.lensVisible === 'boolean' ? input.lensVisible : defaultState.lensVisible,
    selectedId,
    tab: typeof input.tab === 'string' && validTabs.has(input.tab as PersistedTab)
      ? input.tab as PersistedTab
      : defaultState.tab,
    timeValue,
    era: input.era === '1857' || input.era === '1859' ? input.era : fallbackEra,
    trustMode: input.trustMode === 'documented' || input.trustMode === 'public'
      ? input.trustMode
      : defaultState.trustMode,
    routeBudgetMinutes,
    routeInterest
  };
}
