export const TOURIST_ANALYTICS_SCHEMA_VERSION = 1 as const;
export const TOURIST_ANALYTICS_CONTENT_VERSION = 'varvarka-pilot-v1';
export const TOURIST_ANALYTICS_COLLECTION_MODE = 'local-only' as const;
export const TOURIST_ANALYTICS_MAX_OUTBOX = 400;

export type TouristAnalyticsLanguage = 'ru' | 'en';
export type TouristAnalyticsAudioMode = 'recorded' | 'tts-fallback';
export type TouristAnalyticsRouteInterest = 'highlights' | 'architecture' | 'trade' | 'lost-city' | 'nearby';
export type TouristAnalyticsRouteBudget = 15 | 30 | 45;
export type TouristAnalyticsRouteOrigin = 'hero' | 'planner' | 'nearby' | 'recap';
export type TouristAnalyticsCompletionMode = 'manual' | 'audio-auto';

type LanguageEvent = {
  language: TouristAnalyticsLanguage;
};

type RouteContext = LanguageEvent & {
  routeId: string;
  budgetMinutes: TouristAnalyticsRouteBudget;
  interest: TouristAnalyticsRouteInterest;
  stopCount: number;
};

export type TouristAnalyticsEvent =
  | ({ event: 'app_open' } & LanguageEvent)
  | ({ event: 'discover_view' } & LanguageEvent)
  | ({ event: 'nearby_open'; placeId: string } & LanguageEvent)
  | ({ event: 'route_preview'; origin: 'planner'; routeId: string; budgetMinutes: TouristAnalyticsRouteBudget; interest: TouristAnalyticsRouteInterest; stopCount: number } & LanguageEvent)
  | ({ event: 'route_start'; origin: TouristAnalyticsRouteOrigin } & RouteContext)
  | ({ event: 'route_resume'; routeId: string; stepIndex: number; stopCount: number } & LanguageEvent)
  | ({ event: 'stop_presented'; routeId: string; placeId: string; stepIndex: number; stopCount: number } & LanguageEvent)
  | ({ event: 'stop_arrive'; routeId: string; placeId: string; arrivalEvidence: 'foreground-proximity' } & LanguageEvent)
  | ({ event: 'stop_complete'; routeId: string; placeId: string; completionMode: TouristAnalyticsCompletionMode } & LanguageEvent)
  | ({ event: 'route_complete' } & RouteContext)
  | ({ event: 'walk_recap_view'; routeId: string; stopCount: number; missionCount: number; savedCount: number } & LanguageEvent)
  | ({ event: 'continue_explore'; routeId: string; destination: 'map' | 'saved' | 'repeat' } & LanguageEvent)
  | ({ event: 'audio_start'; placeId: string; audioMode: TouristAnalyticsAudioMode } & LanguageEvent)
  | ({ event: 'audio_complete'; placeId: string; audioMode: TouristAnalyticsAudioMode } & LanguageEvent)
  | ({ event: 'transcript_open'; placeId: string } & LanguageEvent)
  | ({ event: 'mission_complete'; placeId: string; missionId: string } & LanguageEvent)
  | ({ event: 'time_machine_open'; placeId: string } & LanguageEvent)
  | ({ event: 'archive_open'; placeId: string } & LanguageEvent)
  | ({ event: 'model_open'; placeId: string } & LanguageEvent)
  | ({ event: 'ar_open'; placeId: string } & LanguageEvent);

export type TouristAnalyticsRecord = TouristAnalyticsEvent & {
  schemaVersion: typeof TOURIST_ANALYTICS_SCHEMA_VERSION;
  contentVersion: string;
  eventId: string;
  sessionId: string;
  occurredAt: string;
};

const forbiddenKeys = new Set([
  'latitude',
  'longitude',
  'lat',
  'lng',
  'coords',
  'coordinates',
  'location',
  'locationaccuracy',
  'accuracy',
  'distancemeters',
  'geohash',
  'userid',
  'email',
  'phone',
  'phonenumber',
  'advertisingid',
  'idfa',
  'gaid',
  'deviceid',
  'ipaddress',
  'name'
]);

export function findForbiddenAnalyticsKeys(value: unknown, path = '$'): string[] {
  if (!value || typeof value !== 'object') return [];

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findForbiddenAnalyticsKeys(item, `${path}[${index}]`));
  }

  const found: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const normalized = key.replace(/[_-]/g, '').toLowerCase();
    const nextPath = `${path}.${key}`;
    if (forbiddenKeys.has(normalized)) found.push(nextPath);
    found.push(...findForbiddenAnalyticsKeys(nested, nextPath));
  }
  return found;
}

export function assertTouristAnalyticsPrivacy(value: unknown) {
  const forbidden = findForbiddenAnalyticsKeys(value);
  if (forbidden.length > 0) {
    throw new Error(`Forbidden analytics data: ${forbidden.join(', ')}`);
  }
}

export function createTouristAnalyticsRecord(
  event: TouristAnalyticsEvent,
  authority: {
    sessionId: string;
    eventId: string;
    occurredAt: string;
    contentVersion?: string;
  }
): TouristAnalyticsRecord {
  if (!authority.sessionId.trim()) throw new Error('analytics sessionId is required');
  if (!authority.eventId.trim()) throw new Error('analytics eventId is required');
  if (!/^\d{4}-\d{2}-\d{2}T/.test(authority.occurredAt)) throw new Error('analytics occurredAt must be ISO-like');

  assertTouristAnalyticsPrivacy(event);

  return {
    ...event,
    schemaVersion: TOURIST_ANALYTICS_SCHEMA_VERSION,
    contentVersion: authority.contentVersion ?? TOURIST_ANALYTICS_CONTENT_VERSION,
    eventId: authority.eventId,
    sessionId: authority.sessionId,
    occurredAt: authority.occurredAt
  };
}

export function trimTouristAnalyticsOutbox(
  records: TouristAnalyticsRecord[],
  max = TOURIST_ANALYTICS_MAX_OUTBOX
) {
  if (!Number.isFinite(max) || max < 1) return [];
  return records.slice(-Math.floor(max));
}

export function createTouristAnalyticsSessionId(now = Date.now(), entropy = Math.random()) {
  const safeEntropy = Number.isFinite(entropy) ? Math.abs(entropy) : 0;
  return `s-${Math.max(0, Math.floor(now)).toString(36)}-${safeEntropy.toString(36).slice(2, 10).padEnd(8, '0')}`;
}
