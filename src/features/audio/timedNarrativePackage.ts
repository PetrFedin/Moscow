import {
  isProductionAudioTrack,
  type VarvarkaAudioLocale,
  type VarvarkaAudioTrack
} from './varvarkaAudioCatalog.ts';

export type TimedCaptionCue = {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
};

export type TimedCaptionTrack = {
  schemaVersion: 1;
  id: string;
  version: number;
  narrationTrackId: string;
  narrationTrackVersion: number;
  locale: VarvarkaAudioLocale;
  format: 'webvtt';
  sourceRef: string;
  rightsEvidenceRef: string;
  audioMasterSha256: string;
  audioDurationSeconds: number;
  cues: TimedCaptionCue[];
};

export type CaptionSyncEvidence = {
  captionTrackId: string;
  captionTrackVersion: number;
  audioMasterSha256: string;
  evidenceRef: string;
  measuredAt: string;
  reviewer: string;
  sampledCueCount: number;
  p95AbsDriftMs: number;
  maxAbsDriftMs: number;
};

export type CaptionSyncThresholds = {
  minimumSampledCues: number;
  maximumP95AbsDriftMs: number;
  maximumAbsDriftMs: number;
};

export type TimedNarrativeReleaseDecision = {
  status: 'captioned' | 'transcript-only';
  reasons: string[];
};

export const DEFAULT_CAPTION_SYNC_THRESHOLDS: CaptionSyncThresholds = {
  minimumSampledCues: 5,
  maximumP95AbsDriftMs: 250,
  maximumAbsDriftMs: 500
};

const SHA256 = /^[a-f0-9]{64}$/i;

function nonEmpty(value: string, field: string) {
  if (!value.trim()) throw new Error(`${field} is required`);
}

function parseIso(value: string, field: string) {
  if (!Number.isFinite(Date.parse(value))) throw new Error(`Invalid ${field}: ${value}`);
}

function normalizeText(value: string) {
  return value
    .normalize('NFKC')
    .replace(/[\s\u00a0]+/g, ' ')
    .replace(/\s+([,.;:!?，。！？；：])/g, '$1')
    .trim();
}

function assertTrackIdentity(track: TimedCaptionTrack) {
  if (track.schemaVersion !== 1) throw new Error('Unsupported timed-caption schema');
  nonEmpty(track.id, 'Timed-caption id');
  if (!Number.isInteger(track.version) || track.version < 1) {
    throw new Error('Timed-caption version must be a positive integer');
  }
  nonEmpty(track.narrationTrackId, 'Narration track id');
  if (!Number.isInteger(track.narrationTrackVersion) || track.narrationTrackVersion < 1) {
    throw new Error('Narration track version must be a positive integer');
  }
  nonEmpty(track.sourceRef, 'Timed-caption source ref');
  nonEmpty(track.rightsEvidenceRef, 'Timed-caption rights evidence ref');
  if (!SHA256.test(track.audioMasterSha256)) {
    throw new Error('Timed-caption audio master checksum must be SHA-256');
  }
  if (!Number.isFinite(track.audioDurationSeconds) || track.audioDurationSeconds <= 0) {
    throw new Error('Timed-caption audio duration must be positive');
  }
  if (track.format !== 'webvtt') throw new Error('Timed-caption format must be webvtt');
  if (track.cues.length === 0) throw new Error('Timed-caption track requires at least one cue');
}

export function validateTimedCaptionTrack(
  captions: TimedCaptionTrack,
  narration: VarvarkaAudioTrack
) {
  assertTrackIdentity(captions);

  if (!isProductionAudioTrack(narration) || !narration.production) {
    throw new Error('Timed captions require a production-ready human narration master');
  }
  if (captions.narrationTrackId !== narration.id) {
    throw new Error('Timed-caption narration track id mismatch');
  }
  if (captions.narrationTrackVersion !== narration.version) {
    throw new Error('Timed-caption narration track version mismatch');
  }
  if (captions.locale !== narration.locale) {
    throw new Error('Timed-caption locale mismatch');
  }
  if (captions.audioMasterSha256.toLowerCase() !== narration.production.sha256.toLowerCase()) {
    throw new Error('Timed-caption audio master checksum mismatch');
  }
  if (Math.abs(captions.audioDurationSeconds - narration.production.durationSeconds) > 0.001) {
    throw new Error('Timed-caption audio duration mismatch');
  }

  const ids = new Set<string>();
  let previousEnd = -1;
  for (const cue of captions.cues) {
    nonEmpty(cue.id, 'Timed-caption cue id');
    if (ids.has(cue.id)) throw new Error(`Duplicate timed-caption cue id: ${cue.id}`);
    ids.add(cue.id);

    if (!Number.isInteger(cue.startMs) || cue.startMs < 0) {
      throw new Error(`Invalid timed-caption cue start: ${cue.id}`);
    }
    if (!Number.isInteger(cue.endMs) || cue.endMs <= cue.startMs) {
      throw new Error(`Invalid timed-caption cue end: ${cue.id}`);
    }
    if (cue.startMs < previousEnd) {
      throw new Error(`Timed-caption cues overlap or are out of order: ${cue.id}`);
    }
    if (cue.endMs > Math.round(narration.production.durationSeconds * 1000)) {
      throw new Error(`Timed-caption cue exceeds narration master duration: ${cue.id}`);
    }
    if (!normalizeText(cue.text)) throw new Error(`Timed-caption cue text is required: ${cue.id}`);
    if (cue.text.includes('-->')) throw new Error(`Timed-caption cue text contains reserved WebVTT token: ${cue.id}`);
    previousEnd = cue.endMs;
  }

  const cueTranscript = normalizeText(captions.cues.map((cue) => cue.text).join(' '));
  const approvedTranscript = normalizeText(narration.transcript);
  if (cueTranscript !== approvedTranscript) {
    throw new Error('Timed-caption cue text does not match approved narration transcript');
  }
}

export function validateCaptionSyncEvidence(
  evidence: CaptionSyncEvidence,
  captions: TimedCaptionTrack
) {
  nonEmpty(evidence.captionTrackId, 'Caption sync track id');
  if (evidence.captionTrackId !== captions.id) throw new Error('Caption sync track id mismatch');
  if (evidence.captionTrackVersion !== captions.version) throw new Error('Caption sync track version mismatch');
  if (evidence.audioMasterSha256.toLowerCase() !== captions.audioMasterSha256.toLowerCase()) {
    throw new Error('Caption sync audio master checksum mismatch');
  }
  nonEmpty(evidence.evidenceRef, 'Caption sync evidence ref');
  nonEmpty(evidence.reviewer, 'Caption sync reviewer');
  parseIso(evidence.measuredAt, 'caption sync measuredAt');
  if (!Number.isInteger(evidence.sampledCueCount) || evidence.sampledCueCount < 1) {
    throw new Error('Caption sync sampled cue count must be a positive integer');
  }
  if (evidence.sampledCueCount > captions.cues.length) {
    throw new Error('Caption sync sampled cue count cannot exceed caption cue count');
  }
  for (const [field, value] of [
    ['p95 drift', evidence.p95AbsDriftMs],
    ['max drift', evidence.maxAbsDriftMs]
  ] as const) {
    if (!Number.isFinite(value) || value < 0) throw new Error(`Caption sync ${field} must be non-negative`);
  }
  if (evidence.p95AbsDriftMs > evidence.maxAbsDriftMs) {
    throw new Error('Caption sync p95 drift cannot exceed max drift');
  }
}

export function validateCaptionSyncThresholds(thresholds: CaptionSyncThresholds) {
  if (!Number.isInteger(thresholds.minimumSampledCues) || thresholds.minimumSampledCues < 1) {
    throw new Error('Caption sync minimum sampled cues must be a positive integer');
  }
  if (!Number.isFinite(thresholds.maximumP95AbsDriftMs) || thresholds.maximumP95AbsDriftMs < 0) {
    throw new Error('Caption sync maximum p95 drift must be non-negative');
  }
  if (!Number.isFinite(thresholds.maximumAbsDriftMs) || thresholds.maximumAbsDriftMs < 0) {
    throw new Error('Caption sync maximum drift must be non-negative');
  }
  if (thresholds.maximumP95AbsDriftMs > thresholds.maximumAbsDriftMs) {
    throw new Error('Caption sync maximum p95 drift cannot exceed maximum drift');
  }
}

export function evaluateTimedNarrativeRelease(input: {
  narration: VarvarkaAudioTrack;
  captions?: TimedCaptionTrack;
  syncEvidence?: CaptionSyncEvidence;
  thresholds?: CaptionSyncThresholds;
}): TimedNarrativeReleaseDecision {
  const reasons: string[] = [];

  if (!isProductionAudioTrack(input.narration) || !input.narration.production) {
    return { status: 'transcript-only', reasons: ['human-master-not-production-ready'] };
  }
  if (!input.captions) {
    return { status: 'transcript-only', reasons: ['timed-captions-missing'] };
  }

  try {
    validateTimedCaptionTrack(input.captions, input.narration);
  } catch (error) {
    return {
      status: 'transcript-only',
      reasons: [error instanceof Error ? error.message : 'invalid-timed-caption-track']
    };
  }

  if (!input.syncEvidence) {
    return { status: 'transcript-only', reasons: ['caption-sync-evidence-missing'] };
  }

  try {
    validateCaptionSyncEvidence(input.syncEvidence, input.captions);
  } catch (error) {
    return {
      status: 'transcript-only',
      reasons: [error instanceof Error ? error.message : 'invalid-caption-sync-evidence']
    };
  }

  const thresholds = input.thresholds ?? DEFAULT_CAPTION_SYNC_THRESHOLDS;
  validateCaptionSyncThresholds(thresholds);
  if (input.syncEvidence.sampledCueCount < thresholds.minimumSampledCues) {
    reasons.push('caption-sync-insufficient-samples');
  }
  if (input.syncEvidence.p95AbsDriftMs > thresholds.maximumP95AbsDriftMs) {
    reasons.push('caption-sync-p95-drift-above-threshold');
  }
  if (input.syncEvidence.maxAbsDriftMs > thresholds.maximumAbsDriftMs) {
    reasons.push('caption-sync-max-drift-above-threshold');
  }

  return {
    status: reasons.length === 0 ? 'captioned' : 'transcript-only',
    reasons
  };
}

function vttTimestamp(ms: number) {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  const millis = ms % 1000;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':') + '.' + String(millis).padStart(3, '0');
}

export function renderWebVtt(captions: TimedCaptionTrack, narration: VarvarkaAudioTrack) {
  validateTimedCaptionTrack(captions, narration);
  const body = captions.cues.map((cue) => [
    cue.id,
    `${vttTimestamp(cue.startMs)} --> ${vttTimestamp(cue.endMs)}`,
    cue.text
  ].join('\n')).join('\n\n');
  return `WEBVTT\n\n${body}\n`;
}
