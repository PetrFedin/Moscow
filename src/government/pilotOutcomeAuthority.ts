import type { PilotStudyReport } from '../analytics/pilotStudy.ts';

export const PILOT_OUTCOME_AUTHORITY_VERSION = 1 as const;

export type PilotOutcomeMetricId =
  | 'route-completion'
  | 'asked-what-next'
  | 'voluntary-ar'
  | 'post-walk-continuation';

export type PilotOutcomeMetric = {
  id: PilotOutcomeMetricId;
  label: string;
  numerator: number;
  denominator: number;
  rate: number;
  basis: string;
};

export type PilotOutcomeSnapshot =
  | {
      version: typeof PILOT_OUTCOME_AUTHORITY_VERSION;
      status: 'awaiting-field-evidence';
      studyId: null;
      evidenceRef: null;
      participantSlots: null;
      metrics: [];
      blockers: string[];
      interpretation: {
        representativeSurvey: false;
        causalImpactClaim: false;
        citywideExtrapolation: false;
      };
    }
  | {
      version: typeof PILOT_OUTCOME_AUTHORITY_VERSION;
      status: 'measured';
      studyId: string;
      evidenceRef: string;
      participantSlots: number;
      metrics: PilotOutcomeMetric[];
      blockers: [];
      interpretation: {
        representativeSurvey: false;
        causalImpactClaim: false;
        citywideExtrapolation: false;
      };
    };

function safeRate(numerator: number, denominator: number) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    throw new Error('Pilot outcome metric requires a positive denominator and finite values');
  }
  if (numerator < 0 || numerator > denominator) {
    throw new Error('Pilot outcome metric numerator must be within denominator');
  }
  return numerator / denominator;
}

function countContinuationSignals(report: PilotStudyReport) {
  const intents = report.qualitative.postWalkIntent;
  return (intents.map ?? 0) + (intents.saved ?? 0) + (intents.repeat ?? 0);
}

export function buildPilotOutcomeSnapshot(input?: {
  report: PilotStudyReport | null;
  evidenceRef?: string | null;
}): PilotOutcomeSnapshot {
  const report = input?.report ?? null;
  const evidenceRef = input?.evidenceRef?.trim() ?? '';

  if (!report) {
    return {
      version: PILOT_OUTCOME_AUTHORITY_VERSION,
      status: 'awaiting-field-evidence',
      studyId: null,
      evidenceRef: null,
      participantSlots: null,
      metrics: [],
      blockers: ['visitor-pilot-report-missing', 'visitor-pilot-evidence-ref-missing'],
      interpretation: {
        representativeSurvey: false,
        causalImpactClaim: false,
        citywideExtrapolation: false
      }
    };
  }

  const blockers: string[] = [];
  if (!report.completeForFirstReview) blockers.push('visitor-pilot-first-review-incomplete');
  if (report.plannedParticipantSlots < 20 || report.plannedParticipantSlots > 50) {
    blockers.push('visitor-pilot-slot-count-out-of-range');
  }
  if (report.receivedObserverNotes !== report.plannedParticipantSlots) {
    blockers.push('visitor-pilot-observer-notes-incomplete');
  }
  if (!evidenceRef) blockers.push('visitor-pilot-evidence-ref-missing');
  if (report.interpretation.representativeSurvey !== false) {
    blockers.push('visitor-pilot-representative-survey-flag-invalid');
  }

  if (blockers.length > 0) {
    return {
      version: PILOT_OUTCOME_AUTHORITY_VERSION,
      status: 'awaiting-field-evidence',
      studyId: null,
      evidenceRef: null,
      participantSlots: null,
      metrics: [],
      blockers,
      interpretation: {
        representativeSurvey: false,
        causalImpactClaim: false,
        citywideExtrapolation: false
      }
    };
  }

  const denominator = report.receivedObserverNotes;
  const completion = denominator - report.qualitative.stoppedEarly;
  const askedWhatNext = report.qualitative.askedWhatNext;
  const voluntaryAr = report.qualitative.voluntaryFeatures.ar ?? 0;
  const continuation = countContinuationSignals(report);

  const metrics: PilotOutcomeMetric[] = [
    { id: 'route-completion', label: 'Завершили маршрут', numerator: completion, denominator, rate: safeRate(completion, denominator), basis: 'observer note: stoppedEarly=false' },
    { id: 'asked-what-next', label: 'Самостоятельно спросили «что дальше»', numerator: askedWhatNext, denominator, rate: safeRate(askedWhatNext, denominator), basis: 'observer note: askedWhatNext=true' },
    { id: 'voluntary-ar', label: 'Добровольно использовали AR', numerator: voluntaryAr, denominator, rate: safeRate(voluntaryAr, denominator), basis: 'observer note: voluntaryFeatures includes ar' },
    { id: 'post-walk-continuation', label: 'Есть наблюдаемый сигнал продолжения после прогулки', numerator: continuation, denominator, rate: safeRate(continuation, denominator), basis: 'observer note: postWalkIntent is map, saved or repeat' }
  ];

  return {
    version: PILOT_OUTCOME_AUTHORITY_VERSION,
    status: 'measured',
    studyId: report.studyId,
    evidenceRef,
    participantSlots: report.plannedParticipantSlots,
    metrics,
    blockers: [],
    interpretation: { representativeSurvey: false, causalImpactClaim: false, citywideExtrapolation: false }
  };
}

export const currentPilotOutcomeSnapshot = buildPilotOutcomeSnapshot();
