import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TOURIST_ANALYTICS_COLLECTION_MODE,
  TOURIST_ANALYTICS_MAX_OUTBOX,
  createTouristAnalyticsRecord,
  createTouristAnalyticsSessionId,
  trimTouristAnalyticsOutbox,
  type TouristAnalyticsEvent,
  type TouristAnalyticsRecord
} from './touristAnalyticsContract';

export const TOURIST_ANALYTICS_STORAGE_KEY = 'moscow:v1:analytics-outbox';

let sessionId = createTouristAnalyticsSessionId();
let eventSequence = 0;
let writeChain: Promise<void> = Promise.resolve();

function nextEventId() {
  eventSequence += 1;
  return `${sessionId}:${eventSequence.toString(36)}`;
}

function parseOutbox(raw: string | null): TouristAnalyticsRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as TouristAnalyticsRecord[] : [];
  } catch {
    return [];
  }
}

export function getTouristAnalyticsCollectionMode() {
  return TOURIST_ANALYTICS_COLLECTION_MODE;
}

export function getTouristAnalyticsSessionId() {
  return sessionId;
}

export function trackTouristEvent(event: TouristAnalyticsEvent) {
  const record = createTouristAnalyticsRecord(event, {
    sessionId,
    eventId: nextEventId(),
    occurredAt: new Date().toISOString()
  });

  writeChain = writeChain
    .then(async () => {
      const existing = parseOutbox(await AsyncStorage.getItem(TOURIST_ANALYTICS_STORAGE_KEY));
      const next = trimTouristAnalyticsOutbox(
        [...existing, record],
        TOURIST_ANALYTICS_MAX_OUTBOX
      );
      await AsyncStorage.setItem(TOURIST_ANALYTICS_STORAGE_KEY, JSON.stringify(next));
    })
    .catch(() => undefined);

  return writeChain;
}

export async function getLocalTouristAnalyticsOutbox() {
  await writeChain;
  return parseOutbox(await AsyncStorage.getItem(TOURIST_ANALYTICS_STORAGE_KEY));
}

export async function clearLocalTouristAnalyticsOutbox() {
  await writeChain;
  await AsyncStorage.removeItem(TOURIST_ANALYTICS_STORAGE_KEY);
}

export function startNewTouristAnalyticsSession() {
  sessionId = createTouristAnalyticsSessionId();
  eventSequence = 0;
  return sessionId;
}
