import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPilotAnalyticsReport,
  serializePilotAnalyticsReport
} from '../src/analytics/pilotAnalyticsReport.ts';
import {
  TOURIST_ANALYTICS_MAX_OUTBOX,
  createTouristAnalyticsRecord,
  findForbiddenAnalyticsKeys,
  type TouristAnalyticsEvent,
  type TouristAnalyticsRecord
} from '../src/analytics/touristAnalyticsContract.ts';

function record(
  sessionId: string,
  sequence: number,
  event: TouristAnalyticsEvent
): TouristAnalyticsRecord {
  return createTouristAnalyticsRecord(event, {
    sessionId,
    eventId: `${sessionId}:${sequence}`,
    occurredAt: `2026-09-25T12:${String(sequence).padStart(2, '0')}:00.000Z`
  });
}

test('pilot report produces a route conversion funnel without exposing raw identifiers', () => {
  const records: TouristAnalyticsRecord[] = [
    record('session-one', 1, { event: 'app_open', language: 'ru' }),
    record('session-one', 2, {
      event: 'route_start',
      origin: 'hero',
      routeId: 'varvarka-zaryadye-pilot',
      budgetMinutes: 45,
      interest: 'highlights',
      stopCount: 5,
      language: 'ru'
    }),
    record('session-one', 3, {
      event: 'stop_arrive',
      routeId: 'varvarka-zaryadye-pilot',
      placeId: 'romanov-chambers',
      arrivalEvidence: 'foreground-proximity',
      language: 'ru'
    }),
    record('session-one', 4, {
      event: 'audio_start',
      placeId: 'romanov-chambers',
      audioMode: 'recorded',
      language: 'ru'
    }),
    record('session-one', 5, {
      event: 'audio_complete',
      placeId: 'romanov-chambers',
      audioMode: 'recorded',
      language: 'ru'
    }),
    record('session-one', 6, {
      event: 'stop_complete',
      routeId: 'varvarka-zaryadye-pilot',
      placeId: 'romanov-chambers',
      completionMode: 'audio-auto',
      language: 'ru'
    }),
    record('session-one', 7, {
      event: 'time_machine_open',
      placeId: 'romanov-chambers',
      language: 'ru'
    }),
    record('session-one', 8, {
      event: 'route_complete',
      routeId: 'varvarka-zaryadye-pilot',
      budgetMinutes: 45,
      interest: 'highlights',
      stopCount: 5,
      language: 'ru'
    }),
    record('session-one', 9, {
      event: 'walk_recap_view',
      routeId: 'varvarka-zaryadye-pilot',
      stopCount: 5,
      missionCount: 3,
      savedCount: 2,
      language: 'ru'
    }),
    record('session-one', 10, {
      event: 'continue_explore',
      routeId: 'varvarka-zaryadye-pilot',
      destination: 'map',
      language: 'ru'
    }),
    record('session-two', 1, { event: 'app_open', language: 'en' }),
    record('session-two', 2, {
      event: 'route_start',
      origin: 'planner',
      routeId: 'varvarka-zaryadye-pilot',
      budgetMinutes: 30,
      interest: 'architecture',
      stopCount: 3,
      language: 'en'
    }),
    record('session-two', 3, {
      event: 'audio_start',
      placeId: 'old-english-court',
      audioMode: 'tts-fallback',
      language: 'en'
    }),
    record('session-two', 4, {
      event: 'stop_complete',
      routeId: 'varvarka-zaryadye-pilot',
      placeId: 'old-english-court',
      completionMode: 'manual',
      language: 'en'
    })
  ];

  const report = buildPilotAnalyticsReport(records);

  assert.equal(report.collectionMode, 'local-only');
  assert.equal(report.privacyMode, 'aggregate-no-raw-identifiers');
  assert.equal(report.sessionCount, 2);
  assert.equal(report.funnel.appOpenSessions, 2);
  assert.equal(report.funnel.routeStartSessions, 2);
  assert.equal(report.funnel.firstStopCompleteSessions, 2);
  assert.equal(report.funnel.routeCompleteSessions, 1);
  assert.equal(report.funnel.routeCompleteRateFromRouteStart, 0.5);
  assert.equal(report.funnel.continueRateFromRouteComplete, 1);
  assert.equal(report.engagement.physicalArrivalSessions, 1);
  assert.equal(report.engagement.audioStartSessions, 2);
  assert.equal(report.engagement.audioCompleteSessions, 1);
  assert.equal(report.engagement.timeMachineSessions, 1);
  assert.equal(report.routeStarts.byOrigin.hero, 1);
  assert.equal(report.routeStarts.byOrigin.planner, 1);
  assert.equal(report.stopCompletions.manual, 1);
  assert.equal(report.stopCompletions.audioAuto, 1);
  assert.equal(report.audio.recordedCompletes, 1);
  assert.equal(report.audio.ttsFallbackStarts, 1);
  assert.equal(report.postWalk.map, 1);
  assert.deepEqual(findForbiddenAnalyticsKeys(report), []);

  const serialized = serializePilotAnalyticsReport(records);
  assert.equal(serialized.includes('session-one'), false);
  assert.equal(serialized.includes('session-two'), false);
  assert.equal(serialized.includes('session-one:1'), false);
  assert.equal(serialized.includes('2026-09-25T12:'), false);
});

test('place report keeps physical arrival separate from manual completion', () => {
  const records = [
    record('s1', 1, {
      event: 'stop_complete',
      routeId: 'varvarka-zaryadye-pilot',
      placeId: 'old-english-court',
      completionMode: 'manual',
      language: 'ru'
    }),
    record('s2', 1, {
      event: 'stop_arrive',
      routeId: 'varvarka-zaryadye-pilot',
      placeId: 'old-english-court',
      arrivalEvidence: 'foreground-proximity',
      language: 'ru'
    })
  ];

  const report = buildPilotAnalyticsReport(records);
  const place = report.places.find((item) => item.placeId === 'old-english-court');

  assert.ok(place);
  assert.equal(place.completions, 1);
  assert.equal(place.physicalArrivals, 1);
  assert.equal(report.stopCompletions.manual, 1);
  assert.equal(report.engagement.physicalArrivalSessions, 1);
});

test('pilot report flags a full local outbox so analysts know earlier events may be truncated', () => {
  const records = Array.from({ length: TOURIST_ANALYTICS_MAX_OUTBOX }, (_, index) =>
    record(`s-${index}`, 1, { event: 'app_open', language: 'ru' })
  );

  const report = buildPilotAnalyticsReport(records);
  assert.equal(report.recordCount, TOURIST_ANALYTICS_MAX_OUTBOX);
  assert.equal(report.outboxAtCapacity, true);
  assert.equal(report.sessionCount, TOURIST_ANALYTICS_MAX_OUTBOX);
});
