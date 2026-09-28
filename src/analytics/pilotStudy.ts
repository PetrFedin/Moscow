import {
  buildPilotCohortReport,
  type PilotCohortReport
} from './pilotCohortReport.ts';
import type { TouristAnalyticsLanguage } from './touristAnalyticsContract.ts';

export const PILOT_STUDY_MANIFEST_VERSION = 1 as const;
export const PILOT_OBSERVER_NOTE_VERSION = 1 as const;
export const PILOT_STUDY_REPORT_VERSION = 1 as const;

export type PilotParticipantSlotId = `P${string}`;

export type PilotStudyFileStatus = 'received' | 'missing';

export type PilotStudySlot = {
  slotId: PilotParticipantSlotId;
  reportStatus: PilotStudyFileStatus;
  reportPath?: string;
  observerStatus: PilotStudyFileStatus;
  observerPath?: string;
};

export type PilotStudyManifest = {
  kind: 'varvarka-supervised-pilot-study';
  version: typeof PILOT_STUDY_MANIFEST_VERSION;
  studyId: string;
  routeId: 'varvarka-zaryadye-pilot';
  protocol: 'supervised-varvarka-v1';
  expectedContentVersion: string;
  slots: PilotStudySlot[];
};

export type PilotObserverHesitation = 'none' | 'minor' | 'major';
export type PilotObserverUnderstanding = 'yes' | 'partly' | 'no' | 'not-observed';
export type PilotObserverPhoneUse = 'mostly-pocket' | 'mixed' | 'mostly-hand' | 'not-observed';
export type PilotObserverStopReason =
  | 'completed'
  | 'time'
  | 'navigation'
  | 'content'
  | 'fatigue'
  | 'technical'
  | 'weather'
  | 'other';
export type PilotObserverFeature =
  | 'audio'
  | 'transcript'
  | 'time-machine'
  | 'archive'
  | '3d'
  | 'ar';
export type PilotObserverIssue =
  | 'outdoor-readability'
  | 'noise'
  | 'battery'
  | 'connectivity'
  | 'location-permission'
  | 'navigation'
  | 'performance'
  | 'other';

export type PilotObserverNote = {
  kind: 'varvarka-observer-note';
  version: typeof PILOT_OBSERVER_NOTE_VERSION;
  slotId: PilotParticipantSlotId;
  language: TouristAnalyticsLanguage;
  platform: 'ios' | 'android';
  hesitation: PilotObserverHesitation;
  askedWhatNext: boolean;
  routeDirectionUnderstood: PilotObserverUnderstanding;
  audioControlNoticed: PilotObserverUnderstanding;
  phoneUse: PilotObserverPhoneUse;
  evidenceDistinctionUnderstood: PilotObserverUnderstanding;
  voluntaryFeatures: PilotObserverFeature[];
  stoppedEarly: boolean;
  stopReason: PilotObserverStopReason;
  postWalkIntent: 'map' | 'saved' | 'repeat' | 'none' | 'not-observed';
  issues: PilotObserverIssue[];
  shortNote?: string;
};

type Validation = {
  valid: boolean;
  blockers: string[];
};

const SLOT_ID = /^P(?:0[0-4][0-9]|050)$/;
const SAFE_STUDY_ID = /^[a-z0-9][a-z0-9-]{2,63}$/;
const SAFE_RELATIVE_JSON = /\.json$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isBundleRelativeJsonPath(value: unknown) {
  if (!isText(value)) return false;
  const normalized = value.replace(/\\/g, '/');
  return SAFE_RELATIVE_JSON.test(normalized)
    && !normalized.startsWith('/')
    && !/^[A-Za-z]:\//.test(normalized)
    && !normalized.split('/').includes('..');
}

function uniqueStrings(values: unknown, allowed?: Set<string>) {
  return Array.isArray(values)
    && values.every((value) => typeof value === 'string' && value.trim().length > 0)
    && new Set(values).size === values.length
    && (!allowed || values.every((value) => allowed.has(value)));
}

export function validatePilotStudyManifest(value: unknown): Validation {
  const blockers: string[] = [];
  if (!isRecord(value)) return { valid: false, blockers: ['study-manifest-not-object'] };

  if (value.kind !== 'varvarka-supervised-pilot-study') blockers.push('study-kind-invalid');
  if (value.version !== PILOT_STUDY_MANIFEST_VERSION) blockers.push('study-version-invalid');
  if (!isText(value.studyId) || !SAFE_STUDY_ID.test(String(value.studyId))) blockers.push('study-id-invalid');
  if (value.routeId !== 'varvarka-zaryadye-pilot') blockers.push('study-route-invalid');
  if (value.protocol !== 'supervised-varvarka-v1') blockers.push('study-protocol-invalid');
  if (!isText(value.expectedContentVersion)) blockers.push('study-content-version-missing');

  if (!Array.isArray(value.slots)) {
    blockers.push('study-slots-invalid');
  } else {
    if (value.slots.length < 20 || value.slots.length > 50) {
      blockers.push(`study-slot-count-out-of-range:${value.slots.length}`);
    }
    const seen = new Set<string>();
    for (const [index, raw] of value.slots.entries()) {
      if (!isRecord(raw)) {
        blockers.push(`study-slot-invalid:${index}`);
        continue;
      }
      if (!isText(raw.slotId) || !SLOT_ID.test(String(raw.slotId))) {
        blockers.push(`study-slot-id-invalid:${index}`);
      } else if (seen.has(String(raw.slotId))) {
        blockers.push(`study-slot-duplicate:${String(raw.slotId)}`);
      } else {
        seen.add(String(raw.slotId));
      }

      if (raw.reportStatus !== 'received' && raw.reportStatus !== 'missing') {
        blockers.push(`study-report-status-invalid:${index}`);
      }
      if (raw.reportStatus === 'received' && !isBundleRelativeJsonPath(raw.reportPath)) {
        blockers.push(`study-report-path-invalid:${index}`);
      }
      if (raw.reportStatus === 'missing' && raw.reportPath !== undefined) {
        blockers.push(`study-missing-report-has-path:${index}`);
      }

      if (raw.observerStatus !== 'received' && raw.observerStatus !== 'missing') {
        blockers.push(`study-observer-status-invalid:${index}`);
      }
      if (raw.observerStatus === 'received' && !isBundleRelativeJsonPath(raw.observerPath)) {
        blockers.push(`study-observer-path-invalid:${index}`);
      }
      if (raw.observerStatus === 'missing' && raw.observerPath !== undefined) {
        blockers.push(`study-missing-observer-has-path:${index}`);
      }
    }
  }

  return { valid: blockers.length === 0, blockers: [...new Set(blockers)] };
}

export function assertPilotStudyManifest(value: unknown): PilotStudyManifest {
  const validation = validatePilotStudyManifest(value);
  if (!validation.valid) {
    throw new Error(`Invalid pilot study manifest: ${validation.blockers.join('; ')}`);
  }
  return value as PilotStudyManifest;
}

export function validatePilotObserverNote(value: unknown): Validation {
  const blockers: string[] = [];
  if (!isRecord(value)) return { valid: false, blockers: ['observer-note-not-object'] };

  if (value.kind !== 'varvarka-observer-note') blockers.push('observer-kind-invalid');
  if (value.version !== PILOT_OBSERVER_NOTE_VERSION) blockers.push('observer-version-invalid');
  if (!isText(value.slotId) || !SLOT_ID.test(String(value.slotId))) blockers.push('observer-slot-id-invalid');
  if (value.language !== 'ru' && value.language !== 'en' && value.language !== 'zh') blockers.push('observer-language-invalid');
  if (value.platform !== 'ios' && value.platform !== 'android') blockers.push('observer-platform-invalid');
  if (value.hesitation !== 'none' && value.hesitation !== 'minor' && value.hesitation !== 'major') blockers.push('observer-hesitation-invalid');
  if (typeof value.askedWhatNext !== 'boolean') blockers.push('observer-asked-next-invalid');

  const understanding = new Set(['yes', 'partly', 'no', 'not-observed']);
  if (!understanding.has(String(value.routeDirectionUnderstood))) blockers.push('observer-route-understanding-invalid');
  if (!understanding.has(String(value.audioControlNoticed))) blockers.push('observer-audio-noticed-invalid');
  if (!understanding.has(String(value.evidenceDistinctionUnderstood))) blockers.push('observer-evidence-understanding-invalid');

  const phoneUse = new Set(['mostly-pocket', 'mixed', 'mostly-hand', 'not-observed']);
  if (!phoneUse.has(String(value.phoneUse))) blockers.push('observer-phone-use-invalid');

  const features = new Set(['audio', 'transcript', 'time-machine', 'archive', '3d', 'ar']);
  if (!uniqueStrings(value.voluntaryFeatures, features)) blockers.push('observer-voluntary-features-invalid');

  if (typeof value.stoppedEarly !== 'boolean') blockers.push('observer-stopped-early-invalid');
  const stopReasons = new Set(['completed', 'time', 'navigation', 'content', 'fatigue', 'technical', 'weather', 'other']);
  if (!stopReasons.has(String(value.stopReason))) blockers.push('observer-stop-reason-invalid');
  if (value.stoppedEarly === false && value.stopReason !== 'completed') blockers.push('observer-stop-reason-inconsistent');
  if (value.stoppedEarly === true && value.stopReason === 'completed') blockers.push('observer-stop-reason-inconsistent');

  const intents = new Set(['map', 'saved', 'repeat', 'none', 'not-observed']);
  if (!intents.has(String(value.postWalkIntent))) blockers.push('observer-post-walk-intent-invalid');

  const issues = new Set([
    'outdoor-readability',
    'noise',
    'battery',
    'connectivity',
    'location-permission',
    'navigation',
    'performance',
    'other'
  ]);
  if (!uniqueStrings(value.issues, issues)) blockers.push('observer-issues-invalid');

  if (value.shortNote !== undefined) {
    if (typeof value.shortNote !== 'string' || value.shortNote.trim().length > 280) {
      blockers.push('observer-short-note-invalid');
    }
  }

  for (const forbidden of ['name', 'email', 'phone', 'userId', 'deviceId', 'sessionId', 'eventId', 'latitude', 'longitude']) {
    if (forbidden in value) blockers.push(`observer-forbidden-field:${forbidden}`);
  }

  return { valid: blockers.length === 0, blockers: [...new Set(blockers)] };
}

export function assertPilotObserverNote(value: unknown): PilotObserverNote {
  const validation = validatePilotObserverNote(value);
  if (!validation.valid) {
    throw new Error(`Invalid pilot observer note: ${validation.blockers.join('; ')}`);
  }
  return value as PilotObserverNote;
}

function countBy<T extends string>(values: T[]) {
  const result: Record<string, number> = {};
  for (const value of values) result[value] = (result[value] ?? 0) + 1;
  return result;
}

function countFeatures(notes: PilotObserverNote[]) {
  const result: Record<string, number> = {};
  for (const note of notes) {
    for (const feature of note.voluntaryFeatures) {
      result[feature] = (result[feature] ?? 0) + 1;
    }
  }
  return result;
}

function countIssues(notes: PilotObserverNote[]) {
  const result: Record<string, number> = {};
  for (const note of notes) {
    for (const issue of note.issues) result[issue] = (result[issue] ?? 0) + 1;
  }
  return result;
}

export function buildPilotStudyReport(input: {
  manifest: PilotStudyManifest;
  reportsBySlot: Record<string, unknown>;
  observersBySlot: Record<string, unknown>;
}) {
  const manifest = assertPilotStudyManifest(input.manifest);
  const reports: unknown[] = [];
  const observers: PilotObserverNote[] = [];
  const missingReportSlots: string[] = [];
  const missingObserverSlots: string[] = [];

  for (const slot of manifest.slots) {
    if (slot.reportStatus === 'received') {
      if (!(slot.slotId in input.reportsBySlot)) {
        throw new Error(`Missing loaded report for ${slot.slotId}`);
      }
      reports.push(input.reportsBySlot[slot.slotId]);
    } else {
      missingReportSlots.push(slot.slotId);
    }

    if (slot.observerStatus === 'received') {
      if (!(slot.slotId in input.observersBySlot)) {
        throw new Error(`Missing loaded observer note for ${slot.slotId}`);
      }
      const observer = assertPilotObserverNote(input.observersBySlot[slot.slotId]);
      if (observer.slotId !== slot.slotId) {
        throw new Error(`Observer note slot mismatch: ${slot.slotId} vs ${observer.slotId}`);
      }
      observers.push(observer);
    } else {
      missingObserverSlots.push(slot.slotId);
    }
  }

  const cohort: PilotCohortReport = buildPilotCohortReport(reports);
  const unexpectedContentVersions = cohort.contentVersions.filter(
    (version) => version !== manifest.expectedContentVersion
  );

  return {
    studyReportVersion: PILOT_STUDY_REPORT_VERSION,
    studyId: manifest.studyId,
    protocol: manifest.protocol,
    routeId: manifest.routeId,
    privacyMode: 'aggregate-app-reports-plus-nonidentifying-observer-notes' as const,
    plannedParticipantSlots: manifest.slots.length,
    receivedAggregateReports: reports.length,
    receivedObserverNotes: observers.length,
    missingReportSlots,
    missingObserverSlots,
    completeForFirstReview:
      manifest.slots.length >= 20
      && reports.length + missingReportSlots.length === manifest.slots.length
      && observers.length + missingObserverSlots.length === manifest.slots.length
      && observers.length > 0,
    dataQuality: {
      expectedContentVersion: manifest.expectedContentVersion,
      unexpectedContentVersions,
      mixedContentVersions: cohort.mixedContentVersions,
      duplicateReportsSkipped: cohort.duplicateReportsSkipped,
      truncatedReportCount: cohort.truncatedReportCount
    },
    cohort,
    qualitative: {
      byLanguage: countBy(observers.map((note) => note.language)),
      byPlatform: countBy(observers.map((note) => note.platform)),
      hesitation: countBy(observers.map((note) => note.hesitation)),
      askedWhatNext: observers.filter((note) => note.askedWhatNext).length,
      routeDirectionUnderstood: countBy(observers.map((note) => note.routeDirectionUnderstood)),
      audioControlNoticed: countBy(observers.map((note) => note.audioControlNoticed)),
      phoneUse: countBy(observers.map((note) => note.phoneUse)),
      evidenceDistinctionUnderstood: countBy(observers.map((note) => note.evidenceDistinctionUnderstood)),
      voluntaryFeatures: countFeatures(observers),
      stoppedEarly: observers.filter((note) => note.stoppedEarly).length,
      stopReasons: countBy(observers.map((note) => note.stopReason)),
      postWalkIntent: countBy(observers.map((note) => note.postWalkIntent)),
      issues: countIssues(observers)
    },
    interpretation: {
      representativeSurvey: false,
      uniquePeopleDerivedFromAnalytics: false,
      observerSlotsMustNotBeWrittenIntoAppAnalytics: true,
      purpose: 'usability-product-proof' as const
    }
  };
}

export type PilotStudyReport = ReturnType<typeof buildPilotStudyReport>;
