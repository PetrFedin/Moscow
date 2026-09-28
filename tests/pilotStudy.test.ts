import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPilotStudyReport,
  validatePilotObserverNote,
  validatePilotStudyManifest,
  type PilotObserverNote,
  type PilotStudyManifest
} from '../src/analytics/pilotStudy.ts';
import { buildPilotAnalyticsReport } from '../src/analytics/pilotAnalyticsReport.ts';
import {
  createTouristAnalyticsRecord,
  type TouristAnalyticsEvent
} from '../src/analytics/touristAnalyticsContract.ts';

function aggregateReport(
  slot: number,
  language: 'ru' | 'en' | 'zh' = 'ru',
  contentVersion = 'varvarka-pilot-v1'
) {
  const sessionId = `private-session-${slot}`;
  const events: TouristAnalyticsEvent[] = [
    { event: 'app_open', language },
    {
      event: 'route_start',
      origin: 'hero',
      routeId: 'varvarka-zaryadye-pilot',
      budgetMinutes: 45,
      interest: 'highlights',
      stopCount: 5,
      language
    },
    {
      event: 'stop_complete',
      routeId: 'varvarka-zaryadye-pilot',
      placeId: 'church-st-barbara',
      completionMode: 'manual',
      language
    },
    {
      event: 'route_complete',
      routeId: 'varvarka-zaryadye-pilot',
      budgetMinutes: 45,
      interest: 'highlights',
      stopCount: 5,
      language
    }
  ];

  return buildPilotAnalyticsReport(events.map((event, index) =>
    createTouristAnalyticsRecord(event, {
      sessionId,
      eventId: `${sessionId}:${index + 1}`,
      occurredAt: `2026-09-28T12:0${index}:00.000Z`,
      contentVersion
    })
  ));
}

function observer(slotId: `P${string}`, overrides: Partial<PilotObserverNote> = {}): PilotObserverNote {
  return {
    kind: 'varvarka-observer-note',
    version: 1,
    slotId,
    language: 'ru',
    platform: 'ios',
    hesitation: 'minor',
    askedWhatNext: false,
    routeDirectionUnderstood: 'yes',
    audioControlNoticed: 'yes',
    phoneUse: 'mixed',
    evidenceDistinctionUnderstood: 'partly',
    voluntaryFeatures: ['audio', 'time-machine'],
    stoppedEarly: false,
    stopReason: 'completed',
    postWalkIntent: 'map',
    issues: [],
    shortNote: 'Участник один раз задержался у выбора следующей точки.',
    ...overrides
  };
}

function manifest(): PilotStudyManifest {
  return {
    kind: 'varvarka-supervised-pilot-study',
    version: 1,
    studyId: 'varvarka-supervised-wave-01',
    routeId: 'varvarka-zaryadye-pilot',
    protocol: 'supervised-varvarka-v1',
    expectedContentVersion: 'varvarka-pilot-v1',
    slots: Array.from({ length: 20 }, (_, index) => {
      const slotId = `P${String(index + 1).padStart(3, '0')}` as `P${string}`;
      return {
        slotId,
        reportStatus: index < 2 ? 'received' as const : 'missing' as const,
        ...(index < 2 ? { reportPath: `reports/${slotId}.json` } : {}),
        observerStatus: 'received' as const,
        observerPath: `observers/${slotId}.json`
      };
    })
  };
}

test('study manifest requires 20-50 non-identifying participant slots', () => {
  assert.deepEqual(validatePilotStudyManifest(manifest()), { valid: true, blockers: [] });

  const tooSmall = manifest();
  tooSmall.slots = tooSmall.slots.slice(0, 19);
  const tooSmallValidation = validatePilotStudyManifest(tooSmall);
  assert.equal(tooSmallValidation.valid, false);
  assert.ok(tooSmallValidation.blockers.includes('study-slot-count-out-of-range:19'));

  const badSlot = manifest();
  badSlot.slots[0]!.slotId = 'P000';
  const badSlotValidation = validatePilotStudyManifest(badSlot);
  assert.equal(badSlotValidation.valid, false);
  assert.ok(badSlotValidation.blockers.includes('study-slot-id-invalid:0'));
});

test('study manifest rejects report paths that escape the study bundle', () => {
  const value = manifest();
  value.slots[0]!.reportPath = '../outside.json';

  const validation = validatePilotStudyManifest(value);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('study-report-path-invalid:0'));
});

test('observer note rejects analytics identities and obvious contact data', () => {
  const unsafe = {
    ...observer('P001'),
    sessionId: 'must-not-enter-observer-note',
    shortNote: 'Написать участнику: test@example.com, +7 999 123 45 67'
  };

  const validation = validatePilotObserverNote(unsafe);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('observer-forbidden-field:sessionId'));
  assert.ok(validation.blockers.includes('observer-short-note-personal-data'));
});

test('observer note keeps stop reason logically consistent', () => {
  const validation = validatePilotObserverNote(
    observer('P001', { stoppedEarly: true, stopReason: 'completed' })
  );
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('observer-stop-reason-inconsistent'));
});

test('final study report combines aggregate analytics and qualitative counts without slot IDs or notes', () => {
  const study = manifest();
  const observersBySlot: Record<string, unknown> = {};
  for (const slot of study.slots) {
    observersBySlot[slot.slotId] = observer(slot.slotId, {
      language: slot.slotId === 'P002' ? 'zh' : 'ru',
      platform: slot.slotId === 'P002' ? 'android' : 'ios'
    });
  }

  const final = buildPilotStudyReport({
    manifest: study,
    reportsBySlot: {
      P001: aggregateReport(1, 'ru'),
      P002: aggregateReport(2, 'zh')
    },
    observersBySlot
  });

  assert.equal(final.completeForFirstReview, true);
  assert.equal(final.plannedParticipantSlots, 20);
  assert.equal(final.receivedAggregateReports, 2);
  assert.equal(final.missingAggregateReportCount, 18);
  assert.equal(final.receivedObserverNotes, 20);
  assert.equal(final.missingObserverNoteCount, 0);
  assert.equal(final.qualitative.byLanguage.ru, 19);
  assert.equal(final.qualitative.byLanguage.zh, 1);
  assert.equal(final.cohort.funnel.routeCompleteSessions, 2);
  assert.equal(final.interpretation.representativeSurvey, false);

  const serialized = JSON.stringify(final);
  assert.equal(serialized.includes('P001'), false);
  assert.equal(serialized.includes('P020'), false);
  assert.equal(serialized.includes('private-session-1'), false);
  assert.equal(serialized.includes('задержался у выбора'), false);
});

test('unexpected content version is surfaced as a data-quality caveat', () => {
  const study = manifest();
  const observersBySlot = Object.fromEntries(
    study.slots.map((slot) => [slot.slotId, observer(slot.slotId)])
  );

  const final = buildPilotStudyReport({
    manifest: study,
    reportsBySlot: {
      P001: aggregateReport(1, 'ru'),
      P002: aggregateReport(2, 'en', 'varvarka-pilot-v2')
    },
    observersBySlot
  });

  assert.deepEqual(final.dataQuality.unexpectedContentVersions, ['varvarka-pilot-v2']);
  assert.equal(final.dataQuality.mixedContentVersions, true);
});
