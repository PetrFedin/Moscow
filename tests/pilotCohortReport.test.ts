import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPilotCohortReport,
  deduplicatePilotAnalyticsReports,
  validatePilotAnalyticsReport
} from '../src/analytics/pilotCohortReport.ts';
import { buildPilotAnalyticsReport } from '../src/analytics/pilotAnalyticsReport.ts';
import {
  createTouristAnalyticsRecord,
  findForbiddenAnalyticsKeys,
  type TouristAnalyticsEvent,
  type TouristAnalyticsRecord
} from '../src/analytics/touristAnalyticsContract.ts';

function event(
  sessionId: string,
  sequence: number,
  value: TouristAnalyticsEvent,
  contentVersion = 'varvarka-pilot-v1'
): TouristAnalyticsRecord {
  return createTouristAnalyticsRecord(value, {
    sessionId,
    eventId: `${sessionId}:${sequence}`,
    occurredAt: `2026-09-25T14:${String(sequence).padStart(2, '0')}:00.000Z`,
    contentVersion
  });
}

function completedJourney(sessionId: string, complete: boolean, language: 'ru' | 'en' = 'ru') {
  const records: TouristAnalyticsRecord[] = [
    event(sessionId, 1, { event: 'app_open', language }),
    event(sessionId, 2, {
      event: 'route_start',
      origin: 'hero',
      routeId: 'varvarka-zaryadye-pilot',
      budgetMinutes: 45,
      interest: 'highlights',
      stopCount: 5,
      language
    }),
    event(sessionId, 3, {
      event: 'stop_complete',
      routeId: 'varvarka-zaryadye-pilot',
      placeId: 'church-st-barbara',
      completionMode: 'manual',
      language
    })
  ];

  if (complete) {
    records.push(
      event(sessionId, 4, {
        event: 'route_complete',
        routeId: 'varvarka-zaryadye-pilot',
        budgetMinutes: 45,
        interest: 'highlights',
        stopCount: 5,
        language
      }),
      event(sessionId, 5, {
        event: 'walk_recap_view',
        routeId: 'varvarka-zaryadye-pilot',
        stopCount: 5,
        missionCount: 1,
        savedCount: 1,
        language
      })
    );
  }
  return records;
}

test('cohort rollup recomputes conversion from summed counts instead of averaging percentages', () => {
  const reportA = buildPilotAnalyticsReport([
    ...completedJourney('a-1', true),
    ...completedJourney('a-2', false)
  ]);
  const reportB = buildPilotAnalyticsReport([
    ...completedJourney('b-1', true, 'en')
  ]);

  assert.equal(reportA.funnel.routeCompleteRateFromRouteStart, 0.5);
  assert.equal(reportB.funnel.routeCompleteRateFromRouteStart, 1);

  const cohort = buildPilotCohortReport([reportA, reportB]);
  assert.equal(cohort.sourceReportCount, 2);
  assert.equal(cohort.reportedSessionCount, 3);
  assert.equal(cohort.funnel.routeStartSessions, 3);
  assert.equal(cohort.funnel.routeCompleteSessions, 2);
  assert.equal(cohort.funnel.routeCompleteRateFromRouteStart, 0.667);
  assert.notEqual(cohort.funnel.routeCompleteRateFromRouteStart, 0.75);
  assert.equal(cohort.interpretation.unit, 'reported-sessions-not-people');
  assert.equal(cohort.interpretation.uniquePeopleKnown, false);
  assert.equal(cohort.interpretation.crossReportIdentityLinking, false);
  assert.deepEqual(findForbiddenAnalyticsKeys(cohort), []);
});

test('identical submitted aggregate report is counted once and duplicate count is explicit', () => {
  const report = buildPilotAnalyticsReport(completedJourney('duplicate-source-session', true));
  const deduplicated = deduplicatePilotAnalyticsReports([report, structuredClone(report)]);
  assert.equal(deduplicated.submittedReportCount, 2);
  assert.equal(deduplicated.uniqueReportCount, 1);
  assert.equal(deduplicated.duplicatesSkipped, 1);

  const cohort = buildPilotCohortReport([report, structuredClone(report)]);
  assert.equal(cohort.submittedReportCount, 2);
  assert.equal(cohort.sourceReportCount, 1);
  assert.equal(cohort.duplicateReportsSkipped, 1);
  assert.equal(cohort.reportedSessionCount, 1);
});

test('cohort report does not recover raw local session or event identities', () => {
  const reportA = buildPilotAnalyticsReport(completedJourney('secret-local-session-a', true));
  const reportB = buildPilotAnalyticsReport(completedJourney('secret-local-session-b', false));
  const serialized = JSON.stringify(buildPilotCohortReport([reportA, reportB]));

  assert.equal(serialized.includes('secret-local-session-a'), false);
  assert.equal(serialized.includes('secret-local-session-b'), false);
  assert.equal(serialized.includes('eventId'), false);
  assert.equal(serialized.includes('sessionId'), false);
  assert.equal(serialized.includes('occurredAt'), false);
});

test('aggregate input containing a forbidden raw identifier is rejected', () => {
  const report = buildPilotAnalyticsReport(completedJourney('valid-local-session', true));
  const unsafe = {
    ...report,
    sessionId: 'raw-session-should-never-enter-rollup'
  };

  const validation = validatePilotAnalyticsReport(unsafe);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('report-contains-forbidden-analytics-keys'));
  assert.throws(
    () => buildPilotCohortReport([unsafe]),
    /Invalid pilot analytics report/
  );
});

test('cohort explicitly reports mixed content versions and truncated source reports', () => {
  const oldReport = buildPilotAnalyticsReport([
    event('old', 1, { event: 'app_open', language: 'ru' }, 'varvarka-pilot-v1')
  ]);
  const newReport = structuredClone(buildPilotAnalyticsReport([
    event('new', 1, { event: 'app_open', language: 'ru' }, 'varvarka-pilot-v2')
  ]));
  newReport.outboxAtCapacity = true;

  const cohort = buildPilotCohortReport([oldReport, newReport]);
  assert.equal(cohort.mixedContentVersions, true);
  assert.deepEqual(cohort.contentVersions, ['varvarka-pilot-v1', 'varvarka-pilot-v2']);
  assert.equal(cohort.truncatedReportCount, 1);
});
