import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TOURIST_ANALYTICS_COLLECTION_MODE,
  TOURIST_ANALYTICS_MAX_OUTBOX,
  assertTouristAnalyticsPrivacy,
  createTouristAnalyticsRecord,
  createTouristAnalyticsSessionId,
  findForbiddenAnalyticsKeys,
  trimTouristAnalyticsOutbox,
  type TouristAnalyticsEvent,
  type TouristAnalyticsRecord
} from '../src/analytics/touristAnalyticsContract.ts';

test('tourist analytics is local-only by authority, not an implicit third-party transport', () => {
  assert.equal(TOURIST_ANALYTICS_COLLECTION_MODE, 'local-only');
  assert.equal(TOURIST_ANALYTICS_MAX_OUTBOX, 400);
});

test('foreground proximity records arrival evidence without retaining GPS or distance', () => {
  const event: TouristAnalyticsEvent = {
    event: 'stop_arrive',
    routeId: 'varvarka-zaryadye-pilot',
    placeId: 'romanov-chambers',
    arrivalEvidence: 'foreground-proximity',
    language: 'ru'
  };

  const record = createTouristAnalyticsRecord(event, {
    sessionId: 'session-test',
    eventId: 'event-test',
    occurredAt: '2026-09-24T12:00:00.000Z'
  });

  assert.equal(record.event, 'stop_arrive');
  assert.equal(record.arrivalEvidence, 'foreground-proximity');
  assert.deepEqual(findForbiddenAnalyticsKeys(record), []);
  assert.equal('latitude' in record, false);
  assert.equal('longitude' in record, false);
  assert.equal('distanceMeters' in record, false);
});

test('analytics rejects coordinates, exact distance, PII and stable device identity keys', () => {
  const unsafe = {
    event: 'stop_arrive',
    location: {
      latitude: 55.75,
      longitude: 37.62
    },
    distanceMeters: 18,
    userId: 'person-1',
    advertisingId: 'ad-id',
    deviceId: 'device-id',
    email: 'example@example.org'
  };

  const forbidden = findForbiddenAnalyticsKeys(unsafe);
  assert.ok(forbidden.some((path) => path.endsWith('.location')));
  assert.ok(forbidden.some((path) => path.endsWith('.latitude')));
  assert.ok(forbidden.some((path) => path.endsWith('.longitude')));
  assert.ok(forbidden.some((path) => path.endsWith('.distanceMeters')));
  assert.ok(forbidden.some((path) => path.endsWith('.userId')));
  assert.ok(forbidden.some((path) => path.endsWith('.advertisingId')));
  assert.ok(forbidden.some((path) => path.endsWith('.deviceId')));
  assert.ok(forbidden.some((path) => path.endsWith('.email')));
  assert.throws(() => assertTouristAnalyticsPrivacy(unsafe), /Forbidden analytics data/);
});

test('session identity is ephemeral and event ids are supplied by the current session', () => {
  const first = createTouristAnalyticsSessionId(1_000, 0.123456);
  const second = createTouristAnalyticsSessionId(2_000, 0.654321);
  assert.notEqual(first, second);
  assert.match(first, /^s-/);

  const record = createTouristAnalyticsRecord(
    { event: 'app_open', language: 'en' },
    {
      sessionId: first,
      eventId: `${first}:1`,
      occurredAt: '2026-09-24T12:00:00.000Z'
    }
  );
  assert.equal(record.sessionId, first);
  assert.equal(record.eventId, `${first}:1`);
  assert.equal('userId' in record, false);
  assert.equal('deviceId' in record, false);
});

test('local analytics outbox is bounded and keeps the newest evidence', () => {
  const records = Array.from({ length: 405 }, (_, index) => createTouristAnalyticsRecord(
    { event: 'discover_view', language: 'ru' },
    {
      sessionId: 'session-test',
      eventId: `event-${index}`,
      occurredAt: '2026-09-24T12:00:00.000Z'
    }
  )) as TouristAnalyticsRecord[];

  const trimmed = trimTouristAnalyticsOutbox(records);
  assert.equal(trimmed.length, 400);
  assert.equal(trimmed[0]?.eventId, 'event-5');
  assert.equal(trimmed.at(-1)?.eventId, 'event-404');
});

test('manual completion and physical arrival remain different facts', () => {
  const manual = createTouristAnalyticsRecord(
    {
      event: 'stop_complete',
      routeId: 'varvarka-zaryadye-pilot',
      placeId: 'old-english-court',
      completionMode: 'manual',
      language: 'ru'
    },
    {
      sessionId: 'session-test',
      eventId: 'manual',
      occurredAt: '2026-09-24T12:00:00.000Z'
    }
  );
  const arrived = createTouristAnalyticsRecord(
    {
      event: 'stop_arrive',
      routeId: 'varvarka-zaryadye-pilot',
      placeId: 'old-english-court',
      arrivalEvidence: 'foreground-proximity',
      language: 'ru'
    },
    {
      sessionId: 'session-test',
      eventId: 'arrived',
      occurredAt: '2026-09-24T12:01:00.000Z'
    }
  );

  assert.equal(manual.event, 'stop_complete');
  assert.equal(manual.completionMode, 'manual');
  assert.equal(arrived.event, 'stop_arrive');
  assert.equal(arrived.arrivalEvidence, 'foreground-proximity');
});


test('post-walk retention events remain aggregate and privacy-safe', () => {
  const recap = createTouristAnalyticsRecord(
    {
      event: 'walk_recap_view',
      routeId: 'varvarka-zaryadye-pilot',
      stopCount: 5,
      missionCount: 3,
      savedCount: 2,
      language: 'ru'
    },
    {
      sessionId: 'session-test',
      eventId: 'recap',
      occurredAt: '2026-09-24T12:10:00.000Z'
    }
  );
  const continueEvent = createTouristAnalyticsRecord(
    {
      event: 'continue_explore',
      routeId: 'varvarka-zaryadye-pilot',
      destination: 'repeat',
      language: 'ru'
    },
    {
      sessionId: 'session-test',
      eventId: 'continue',
      occurredAt: '2026-09-24T12:11:00.000Z'
    }
  );

  assert.equal(recap.event, 'walk_recap_view');
  assert.equal(recap.stopCount, 5);
  assert.equal(continueEvent.event, 'continue_explore');
  assert.equal(continueEvent.destination, 'repeat');
  assert.deepEqual(findForbiddenAnalyticsKeys([recap, continueEvent]), []);
});
