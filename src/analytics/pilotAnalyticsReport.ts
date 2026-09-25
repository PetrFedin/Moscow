import {
  TOURIST_ANALYTICS_COLLECTION_MODE,
  TOURIST_ANALYTICS_MAX_OUTBOX,
  assertTouristAnalyticsPrivacy,
  type TouristAnalyticsRecord
} from './touristAnalyticsContract.ts';

export const PILOT_ANALYTICS_REPORT_VERSION = 1 as const;

type Ratio = number | null;

function ratio(numerator: number, denominator: number): Ratio {
  if (denominator <= 0) return null;
  return Number((numerator / denominator).toFixed(3));
}

function sessionsMatching(
  records: TouristAnalyticsRecord[],
  predicate: (record: TouristAnalyticsRecord) => boolean
) {
  return new Set(records.filter(predicate).map((record) => record.sessionId)).size;
}

function countBy<T extends string>(values: T[]) {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return counts as Record<T, number>;
}

function placeMetric(records: TouristAnalyticsRecord[], placeId: string) {
  const placeRecords = records.filter((record) => 'placeId' in record && record.placeId === placeId);
  return {
    placeId,
    presented: placeRecords.filter((record) => record.event === 'stop_presented').length,
    physicalArrivals: placeRecords.filter((record) => record.event === 'stop_arrive').length,
    completions: placeRecords.filter((record) => record.event === 'stop_complete').length,
    audioStarts: placeRecords.filter((record) => record.event === 'audio_start').length,
    audioCompletes: placeRecords.filter((record) => record.event === 'audio_complete').length,
    transcriptOpens: placeRecords.filter((record) => record.event === 'transcript_open').length,
    missions: placeRecords.filter((record) => record.event === 'mission_complete').length,
    timeMachineOpens: placeRecords.filter((record) => record.event === 'time_machine_open').length,
    archiveOpens: placeRecords.filter((record) => record.event === 'archive_open').length,
    modelOpens: placeRecords.filter((record) => record.event === 'model_open').length,
    arOpens: placeRecords.filter((record) => record.event === 'ar_open').length
  };
}

export function buildPilotAnalyticsReport(records: TouristAnalyticsRecord[]) {
  const sessionCount = new Set(records.map((record) => record.sessionId)).size;
  const contentVersions = [...new Set(records.map((record) => record.contentVersion))].sort();

  const appOpenSessions = sessionsMatching(records, (record) => record.event === 'app_open');
  const routeStartSessions = sessionsMatching(records, (record) => record.event === 'route_start');
  const firstStopCompleteSessions = sessionsMatching(records, (record) => record.event === 'stop_complete');
  const routeCompleteSessions = sessionsMatching(records, (record) => record.event === 'route_complete');
  const recapSessions = sessionsMatching(records, (record) => record.event === 'walk_recap_view');
  const continueSessions = sessionsMatching(records, (record) => record.event === 'continue_explore');

  const routeStarts = records.filter((record) => record.event === 'route_start');
  const stopCompletions = records.filter((record) => record.event === 'stop_complete');
  const audioStarts = records.filter((record) => record.event === 'audio_start');
  const audioCompletes = records.filter((record) => record.event === 'audio_complete');
  const continuations = records.filter((record) => record.event === 'continue_explore');

  const placeIds = [...new Set(
    records.flatMap((record) => 'placeId' in record ? [record.placeId] : [])
  )].sort();

  const report = {
    reportVersion: PILOT_ANALYTICS_REPORT_VERSION,
    collectionMode: TOURIST_ANALYTICS_COLLECTION_MODE,
    privacyMode: 'aggregate-no-raw-identifiers' as const,
    contentVersions,
    recordCount: records.length,
    sessionCount,
    outboxAtCapacity: records.length >= TOURIST_ANALYTICS_MAX_OUTBOX,
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
      physicalArrivalSessions: sessionsMatching(records, (record) => record.event === 'stop_arrive'),
      audioStartSessions: sessionsMatching(records, (record) => record.event === 'audio_start'),
      audioCompleteSessions: sessionsMatching(records, (record) => record.event === 'audio_complete'),
      transcriptSessions: sessionsMatching(records, (record) => record.event === 'transcript_open'),
      missionSessions: sessionsMatching(records, (record) => record.event === 'mission_complete'),
      timeMachineSessions: sessionsMatching(records, (record) => record.event === 'time_machine_open'),
      archiveSessions: sessionsMatching(records, (record) => record.event === 'archive_open'),
      modelSessions: sessionsMatching(records, (record) => record.event === 'model_open'),
      arSessions: sessionsMatching(records, (record) => record.event === 'ar_open')
    },
    routeStarts: {
      total: routeStarts.length,
      byOrigin: countBy(routeStarts.map((record) => record.origin)),
      byBudgetMinutes: countBy(routeStarts.map((record) => String(record.budgetMinutes))),
      byInterest: countBy(routeStarts.map((record) => record.interest)),
      byLanguage: countBy(routeStarts.map((record) => record.language))
    },
    stopCompletions: {
      total: stopCompletions.length,
      manual: stopCompletions.filter((record) => record.completionMode === 'manual').length,
      audioAuto: stopCompletions.filter((record) => record.completionMode === 'audio-auto').length
    },
    audio: {
      starts: audioStarts.length,
      completes: audioCompletes.length,
      recordedStarts: audioStarts.filter((record) => record.audioMode === 'recorded').length,
      ttsFallbackStarts: audioStarts.filter((record) => record.audioMode === 'tts-fallback').length,
      recordedCompletes: audioCompletes.filter((record) => record.audioMode === 'recorded').length,
      ttsFallbackCompletes: audioCompletes.filter((record) => record.audioMode === 'tts-fallback').length
    },
    postWalk: {
      map: continuations.filter((record) => record.destination === 'map').length,
      saved: continuations.filter((record) => record.destination === 'saved').length,
      repeat: continuations.filter((record) => record.destination === 'repeat').length
    },
    places: placeIds.map((placeId) => placeMetric(records, placeId))
  };

  assertTouristAnalyticsPrivacy(report);
  return report;
}

export function serializePilotAnalyticsReport(records: TouristAnalyticsRecord[]) {
  return JSON.stringify(buildPilotAnalyticsReport(records), null, 2);
}

export type PilotAnalyticsReport = ReturnType<typeof buildPilotAnalyticsReport>;
