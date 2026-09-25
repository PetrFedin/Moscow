import {
  findForbiddenAnalyticsKeys
} from './touristAnalyticsContract.ts';
import {
  PILOT_ANALYTICS_REPORT_VERSION,
  type PilotAnalyticsReport
} from './pilotAnalyticsReport.ts';

export const PILOT_COHORT_REPORT_VERSION = 1 as const;

type Validation = {
  valid: boolean;
  blockers: string[];
};

const forbiddenAggregateRawKeys = new Set([
  'sessionid',
  'eventid',
  'occurredat'
]);

function findForbiddenAggregateRawKeys(value: unknown, path = '$'): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      findForbiddenAggregateRawKeys(item, path + '[' + index + ']')
    );
  }

  const found: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const normalized = key.replace(/[_-]/g, '').toLowerCase();
    const nextPath = path + '.' + key;
    if (forbiddenAggregateRawKeys.has(normalized)) found.push(nextPath);
    found.push(...findForbiddenAggregateRawKeys(nested, nextPath));
  }
  return found;
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isRatio(value: unknown): value is number | null {
  return value === null
    || (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1);
}

function isCountMap(value: unknown) {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.values(value as Record<string, unknown>).every(isCount)
  );
}

function ratio(numerator: number, denominator: number) {
  if (denominator <= 0) return null;
  return Number((numerator / denominator).toFixed(3));
}

export function validatePilotAnalyticsReport(value: unknown): Validation {
  const blockers: string[] = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { valid: false, blockers: ['report-not-object'] };
  }

  const report = value as Partial<PilotAnalyticsReport>;
  const forbidden = findForbiddenAnalyticsKeys(value);
  const forbiddenRaw = findForbiddenAggregateRawKeys(value);
  if (forbidden.length > 0 || forbiddenRaw.length > 0) {
    blockers.push('report-contains-forbidden-analytics-keys');
  }

  if (report.reportVersion !== PILOT_ANALYTICS_REPORT_VERSION) blockers.push('report-version-unsupported');
  if (report.collectionMode !== 'local-only') blockers.push('collection-mode-not-local-only');
  if (report.privacyMode !== 'aggregate-no-raw-identifiers') blockers.push('privacy-mode-invalid');
  if (!Array.isArray(report.contentVersions) || !report.contentVersions.every((item) => typeof item === 'string' && item.trim())) {
    blockers.push('content-versions-invalid');
  }
  if (!isCount(report.recordCount)) blockers.push('record-count-invalid');
  if (!isCount(report.sessionCount)) blockers.push('session-count-invalid');
  if (typeof report.outboxAtCapacity !== 'boolean') blockers.push('outbox-capacity-flag-invalid');

  const funnel = report.funnel as PilotAnalyticsReport['funnel'] | undefined;
  if (!funnel) {
    blockers.push('funnel-missing');
  } else {
    for (const key of [
      'appOpenSessions',
      'routeStartSessions',
      'firstStopCompleteSessions',
      'routeCompleteSessions',
      'recapSessions',
      'continueSessions'
    ] as const) {
      if (!isCount(funnel[key])) blockers.push(`funnel-count-invalid:${key}`);
    }
    for (const key of [
      'routeStartRateFromAppOpen',
      'firstStopCompleteRateFromRouteStart',
      'routeCompleteRateFromRouteStart',
      'recapRateFromRouteComplete',
      'continueRateFromRouteComplete'
    ] as const) {
      if (!isRatio(funnel[key])) blockers.push(`funnel-ratio-invalid:${key}`);
    }
  }

  const engagement = report.engagement as PilotAnalyticsReport['engagement'] | undefined;
  if (!engagement) {
    blockers.push('engagement-missing');
  } else {
    for (const value of Object.values(engagement)) {
      if (!isCount(value)) {
        blockers.push('engagement-count-invalid');
        break;
      }
    }
  }

  const routeStarts = report.routeStarts as PilotAnalyticsReport['routeStarts'] | undefined;
  if (!routeStarts) {
    blockers.push('route-starts-missing');
  } else {
    if (!isCount(routeStarts.total)) blockers.push('route-start-total-invalid');
    if (!isCountMap(routeStarts.byOrigin)) blockers.push('route-start-origin-invalid');
    if (!isCountMap(routeStarts.byBudgetMinutes)) blockers.push('route-start-budget-invalid');
    if (!isCountMap(routeStarts.byInterest)) blockers.push('route-start-interest-invalid');
    if (!isCountMap(routeStarts.byLanguage)) blockers.push('route-start-language-invalid');
  }

  const stopCompletions = report.stopCompletions as PilotAnalyticsReport['stopCompletions'] | undefined;
  if (!stopCompletions
    || !isCount(stopCompletions.total)
    || !isCount(stopCompletions.manual)
    || !isCount(stopCompletions.audioAuto)) {
    blockers.push('stop-completions-invalid');
  }

  const audio = report.audio as PilotAnalyticsReport['audio'] | undefined;
  if (!audio || Object.values(audio).some((item) => !isCount(item))) blockers.push('audio-counts-invalid');

  const postWalk = report.postWalk as PilotAnalyticsReport['postWalk'] | undefined;
  if (!postWalk || Object.values(postWalk).some((item) => !isCount(item))) blockers.push('post-walk-counts-invalid');

  if (!Array.isArray(report.places)) {
    blockers.push('places-invalid');
  } else {
    const seen = new Set<string>();
    for (const place of report.places) {
      if (!place || typeof place.placeId !== 'string' || !place.placeId.trim()) {
        blockers.push('place-id-invalid');
        continue;
      }
      if (seen.has(place.placeId)) blockers.push(`duplicate-place:${place.placeId}`);
      seen.add(place.placeId);
      for (const [key, value] of Object.entries(place)) {
        if (key === 'placeId') continue;
        if (!isCount(value)) blockers.push(`place-count-invalid:${place.placeId}:${key}`);
      }
    }
  }

  return { valid: blockers.length === 0, blockers: [...new Set(blockers)] };
}

export function assertPilotAnalyticsReport(value: unknown): PilotAnalyticsReport {
  const validation = validatePilotAnalyticsReport(value);
  if (!validation.valid) {
    throw new Error(`Invalid pilot analytics report: ${validation.blockers.join('; ')}`);
  }
  return value as PilotAnalyticsReport;
}


function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => [key, stableJsonValue(nested)])
  );
}

export function deduplicatePilotAnalyticsReports(inputReports: unknown[]) {
  const unique: PilotAnalyticsReport[] = [];
  const seen = new Set<string>();
  let duplicatesSkipped = 0;

  for (const input of inputReports) {
    const report = assertPilotAnalyticsReport(input);
    const identity = JSON.stringify(stableJsonValue(report));
    if (seen.has(identity)) {
      duplicatesSkipped += 1;
      continue;
    }
    seen.add(identity);
    unique.push(report);
  }

  return {
    reports: unique,
    submittedReportCount: inputReports.length,
    uniqueReportCount: unique.length,
    duplicatesSkipped
  };
}

function sumMap(
  reports: PilotAnalyticsReport[],
  select: (report: PilotAnalyticsReport) => Record<string, number>
) {
  const result: Record<string, number> = {};
  for (const report of reports) {
    for (const [key, value] of Object.entries(select(report))) {
      result[key] = (result[key] ?? 0) + value;
    }
  }
  return result;
}

function sum(reports: PilotAnalyticsReport[], select: (report: PilotAnalyticsReport) => number) {
  return reports.reduce((total, report) => total + select(report), 0);
}

export function buildPilotCohortReport(inputReports: unknown[]) {
  const deduplicated = deduplicatePilotAnalyticsReports(inputReports);
  const reports = deduplicated.reports;
  const appOpenSessions = sum(reports, (report) => report.funnel.appOpenSessions);
  const routeStartSessions = sum(reports, (report) => report.funnel.routeStartSessions);
  const firstStopCompleteSessions = sum(reports, (report) => report.funnel.firstStopCompleteSessions);
  const routeCompleteSessions = sum(reports, (report) => report.funnel.routeCompleteSessions);
  const recapSessions = sum(reports, (report) => report.funnel.recapSessions);
  const continueSessions = sum(reports, (report) => report.funnel.continueSessions);

  const placeIds = [...new Set(reports.flatMap((report) => report.places.map((place) => place.placeId)))].sort();
  const places = placeIds.map((placeId) => {
    const matching = reports.flatMap((report) => report.places.filter((place) => place.placeId === placeId));
    const metric = (key: keyof Omit<(typeof matching)[number], 'placeId'>) =>
      matching.reduce((total, place) => total + (place[key] as number), 0);

    return {
      placeId,
      presented: metric('presented'),
      physicalArrivals: metric('physicalArrivals'),
      completions: metric('completions'),
      audioStarts: metric('audioStarts'),
      audioCompletes: metric('audioCompletes'),
      transcriptOpens: metric('transcriptOpens'),
      missions: metric('missions'),
      timeMachineOpens: metric('timeMachineOpens'),
      archiveOpens: metric('archiveOpens'),
      modelOpens: metric('modelOpens'),
      arOpens: metric('arOpens')
    };
  });

  const truncatedReportCount = reports.filter((report) => report.outboxAtCapacity).length;
  const contentVersions = [...new Set(reports.flatMap((report) => report.contentVersions))].sort();

  const cohort = {
    cohortReportVersion: PILOT_COHORT_REPORT_VERSION,
    sourceReportVersion: PILOT_ANALYTICS_REPORT_VERSION,
    privacyMode: 'aggregate-reports-only' as const,
    sourceReportCount: reports.length,
    submittedReportCount: deduplicated.submittedReportCount,
    duplicateReportsSkipped: deduplicated.duplicatesSkipped,
    reportedSessionCount: sum(reports, (report) => report.sessionCount),
    reportedRecordCount: sum(reports, (report) => report.recordCount),
    truncatedReportCount,
    contentVersions,
    mixedContentVersions: contentVersions.length > 1,
    interpretation: {
      unit: 'reported-sessions-not-people' as const,
      uniquePeopleKnown: false,
      crossReportIdentityLinking: false,
      duplicateSubmissionDetection: 'caller-or-cli-exact-content-only' as const
    },
    funnel: {
      appOpenSessions,
      routeStartSessions,
      firstStopCompleteSessions,
      routeCompleteSessions,
      recapSessions,
      continueSessions,
      routeStartRateFromAppOpen: ratio(routeStartSessions, appOpenSessions),
      firstStopCompleteRateFromRouteStart: ratio(firstStopCompleteSessions, routeStartSessions),
      routeCompleteRateFromRouteStart: ratio(routeCompleteSessions, routeStartSessions),
      recapRateFromRouteComplete: ratio(recapSessions, routeCompleteSessions),
      continueRateFromRouteComplete: ratio(continueSessions, routeCompleteSessions)
    },
    engagement: {
      physicalArrivalSessions: sum(reports, (report) => report.engagement.physicalArrivalSessions),
      audioStartSessions: sum(reports, (report) => report.engagement.audioStartSessions),
      audioCompleteSessions: sum(reports, (report) => report.engagement.audioCompleteSessions),
      transcriptSessions: sum(reports, (report) => report.engagement.transcriptSessions),
      missionSessions: sum(reports, (report) => report.engagement.missionSessions),
      timeMachineSessions: sum(reports, (report) => report.engagement.timeMachineSessions),
      archiveSessions: sum(reports, (report) => report.engagement.archiveSessions),
      modelSessions: sum(reports, (report) => report.engagement.modelSessions),
      arSessions: sum(reports, (report) => report.engagement.arSessions)
    },
    routeStarts: {
      total: sum(reports, (report) => report.routeStarts.total),
      byOrigin: sumMap(reports, (report) => report.routeStarts.byOrigin),
      byBudgetMinutes: sumMap(reports, (report) => report.routeStarts.byBudgetMinutes),
      byInterest: sumMap(reports, (report) => report.routeStarts.byInterest),
      byLanguage: sumMap(reports, (report) => report.routeStarts.byLanguage)
    },
    stopCompletions: {
      total: sum(reports, (report) => report.stopCompletions.total),
      manual: sum(reports, (report) => report.stopCompletions.manual),
      audioAuto: sum(reports, (report) => report.stopCompletions.audioAuto)
    },
    audio: {
      starts: sum(reports, (report) => report.audio.starts),
      completes: sum(reports, (report) => report.audio.completes),
      recordedStarts: sum(reports, (report) => report.audio.recordedStarts),
      ttsFallbackStarts: sum(reports, (report) => report.audio.ttsFallbackStarts),
      recordedCompletes: sum(reports, (report) => report.audio.recordedCompletes),
      ttsFallbackCompletes: sum(reports, (report) => report.audio.ttsFallbackCompletes)
    },
    postWalk: {
      map: sum(reports, (report) => report.postWalk.map),
      saved: sum(reports, (report) => report.postWalk.saved),
      repeat: sum(reports, (report) => report.postWalk.repeat)
    },
    places
  };

  const forbidden = findForbiddenAnalyticsKeys(cohort);
  if (forbidden.length > 0) {
    throw new Error(`Cohort report contains forbidden analytics keys: ${forbidden.join(', ')}`);
  }
  return cohort;
}

export function serializePilotCohortReport(reports: unknown[]) {
  return JSON.stringify(buildPilotCohortReport(reports), null, 2);
}

export type PilotCohortReport = ReturnType<typeof buildPilotCohortReport>;
