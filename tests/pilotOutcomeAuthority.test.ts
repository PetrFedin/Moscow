import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPilotOutcomeSnapshot } from '../src/government/pilotOutcomeAuthority.ts';

function report(overrides: Record<string, unknown> = {}) {
  return {
    studyReportVersion: 1,
    studyId: 'varvarka-001',
    protocol: 'supervised-varvarka-v1',
    routeId: 'varvarka-zaryadye-pilot',
    privacyMode: 'aggregate-app-reports-plus-nonidentifying-observer-notes',
    plannedParticipantSlots: 20,
    receivedAggregateReports: 20,
    receivedObserverNotes: 20,
    missingAggregateReportCount: 0,
    missingObserverNoteCount: 0,
    completeForFirstReview: true,
    dataQuality: { expectedContentVersion: 'v1', unexpectedContentVersions: [], mixedContentVersions: false, duplicateReportsSkipped: 0, truncatedReportCount: 0 },
    cohort: {},
    qualitative: {
      byLanguage: { ru: 20 },
      byPlatform: { ios: 10, android: 10 },
      hesitation: { none: 15, minor: 5 },
      askedWhatNext: 12,
      routeDirectionUnderstood: { yes: 18, partly: 2 },
      audioControlNoticed: { yes: 17, partly: 3 },
      phoneUse: { mixed: 20 },
      evidenceDistinctionUnderstood: { yes: 19, partly: 1 },
      voluntaryFeatures: { ar: 8, audio: 16 },
      stoppedEarly: 3,
      stopReasons: { completed: 17, time: 2, technical: 1 },
      postWalkIntent: { map: 6, saved: 4, repeat: 3, none: 5, 'not-observed': 2 },
      issues: { navigation: 2 }
    },
    interpretation: { representativeSurvey: false, uniquePeopleDerivedFromAnalytics: false, observerSlotsMustNotBeWrittenIntoAppAnalytics: true, purpose: 'usability-product-proof' },
    ...overrides
  } as any;
}

test('stays fail-closed without field evidence', () => {
  const snapshot = buildPilotOutcomeSnapshot();
  assert.equal(snapshot.status, 'awaiting-field-evidence');
  assert.deepEqual(snapshot.metrics, []);
});

test('stays fail-closed without evidence reference', () => {
  const snapshot = buildPilotOutcomeSnapshot({ report: report() });
  assert.equal(snapshot.status, 'awaiting-field-evidence');
  assert.ok(snapshot.blockers.includes('visitor-pilot-evidence-ref-missing'));
});

test('derives descriptive metrics from reviewed observer evidence', () => {
  const snapshot = buildPilotOutcomeSnapshot({
    report: report(),
    evidenceRef: 'evidence/varvarka-001/final-study-report.json'
  });
  assert.equal(snapshot.status, 'measured');
  if (snapshot.status !== 'measured') return;
  assert.equal(snapshot.metrics.find((m) => m.id === 'route-completion')?.numerator, 17);
  assert.equal(snapshot.metrics.find((m) => m.id === 'asked-what-next')?.numerator, 12);
  assert.equal(snapshot.metrics.find((m) => m.id === 'voluntary-ar')?.numerator, 8);
  assert.equal(snapshot.metrics.find((m) => m.id === 'post-walk-continuation')?.numerator, 13);
  assert.equal(snapshot.interpretation.representativeSurvey, false);
  assert.equal(snapshot.interpretation.causalImpactClaim, false);
});

test('rejects incomplete supervised evidence', () => {
  const snapshot = buildPilotOutcomeSnapshot({
    report: report({ completeForFirstReview: false, receivedObserverNotes: 19 }),
    evidenceRef: 'evidence/varvarka-001/final-study-report.json'
  });
  assert.equal(snapshot.status, 'awaiting-field-evidence');
  assert.ok(snapshot.blockers.includes('visitor-pilot-first-review-incomplete'));
  assert.ok(snapshot.blockers.includes('visitor-pilot-observer-notes-incomplete'));
});
