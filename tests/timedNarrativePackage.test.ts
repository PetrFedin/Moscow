import assert from 'node:assert/strict';
import test from 'node:test';

import type { VarvarkaAudioTrack } from '../src/features/audio/varvarkaAudioCatalog.ts';
import {
  evaluateTimedNarrativeRelease,
  renderWebVtt,
  validateCaptionSyncEvidence,
  validateCaptionSyncThresholds,
  validateTimedCaptionTrack,
  type CaptionSyncEvidence,
  type TimedCaptionTrack
} from '../src/features/audio/timedNarrativePackage.ts';

const sha = 'b'.repeat(64);

function narration(overrides: Partial<VarvarkaAudioTrack> = {}): VarvarkaAudioTrack {
  return {
    id: 'narration-ru-v1',
    version: 1,
    placeId: 'site-a',
    locale: 'ru',
    status: 'production-ready',
    scriptApprovedAt: '2026-10-01',
    targetDurationSeconds: 10,
    transcript: 'Первая фраза. Вторая фраза. Третья фраза. Четвёртая фраза. Пятая фраза.',
    sourceUrls: ['https://example.org/source'],
    production: {
      masterUrl: 'https://media.example.org/narration-ru-v1.m4a',
      filename: 'narration-ru-v1.m4a',
      sha256: sha,
      durationSeconds: 10,
      narratorCredit: 'Narrator',
      rightsEvidenceRef: 'rights:narration-ru-v1'
    },
    ...overrides
  };
}

function captions(overrides: Partial<TimedCaptionTrack> = {}): TimedCaptionTrack {
  return {
    schemaVersion: 1,
    id: 'captions-ru-v1',
    version: 1,
    narrationTrackId: 'narration-ru-v1',
    narrationTrackVersion: 1,
    locale: 'ru',
    format: 'webvtt',
    sourceRef: 'editorial:caption-timing-v1',
    rightsEvidenceRef: 'rights:caption-v1',
    audioMasterSha256: sha,
    audioDurationSeconds: 10,
    cues: [
      { id: 'c1', startMs: 0, endMs: 1500, text: 'Первая фраза.' },
      { id: 'c2', startMs: 1600, endMs: 3100, text: 'Вторая фраза.' },
      { id: 'c3', startMs: 3200, endMs: 4800, text: 'Третья фраза.' },
      { id: 'c4', startMs: 5000, endMs: 6800, text: 'Четвёртая фраза.' },
      { id: 'c5', startMs: 7000, endMs: 9400, text: 'Пятая фраза.' }
    ],
    ...overrides
  };
}

function evidence(overrides: Partial<CaptionSyncEvidence> = {}): CaptionSyncEvidence {
  return {
    captionTrackId: 'captions-ru-v1',
    captionTrackVersion: 1,
    audioMasterSha256: sha,
    evidenceRef: 'qa:caption-sync-001',
    measuredAt: '2026-10-02T15:00:00.000Z',
    reviewer: 'audio-editor',
    sampledCueCount: 5,
    p95AbsDriftMs: 140,
    maxAbsDriftMs: 220,
    ...overrides
  };
}

test('timed captions bind to exact production narration master', () => {
  assert.doesNotThrow(() => validateTimedCaptionTrack(captions(), narration()));

  assert.throws(
    () => validateTimedCaptionTrack(captions({ narrationTrackId: 'another-track' }), narration()),
    /track id mismatch/
  );
  assert.throws(
    () => validateTimedCaptionTrack(captions({ audioMasterSha256: 'c'.repeat(64) }), narration()),
    /checksum mismatch/
  );
  assert.throws(
    () => validateTimedCaptionTrack(captions({ audioDurationSeconds: 9.9 }), narration()),
    /duration mismatch/
  );
});

test('timed captions stay blocked while human narration master is not production-ready', () => {
  const pending = narration({
    status: 'recording-pending',
    production: undefined
  });

  assert.throws(
    () => validateTimedCaptionTrack(captions(), pending),
    /production-ready human narration master/
  );

  assert.deepEqual(
    evaluateTimedNarrativeRelease({
      narration: pending,
      captions: captions(),
      syncEvidence: evidence()
    }),
    {
      status: 'transcript-only',
      reasons: ['human-master-not-production-ready']
    }
  );
});

test('overlapping or out-of-order cues are rejected', () => {
  const value = captions();
  value.cues[1] = {
    ...value.cues[1]!,
    startMs: 1400
  };

  assert.throws(
    () => validateTimedCaptionTrack(value, narration()),
    /overlap or are out of order/
  );
});

test('caption cues cannot extend beyond the measured human master duration', () => {
  const value = captions();
  value.cues[4] = {
    ...value.cues[4]!,
    endMs: 10_001
  };

  assert.throws(
    () => validateTimedCaptionTrack(value, narration()),
    /exceeds narration master duration/
  );
});

test('caption cue text must cover the approved transcript exactly after whitespace normalization', () => {
  const value = captions();
  value.cues[2] = {
    ...value.cues[2]!,
    text: 'Другая фраза.'
  };

  assert.throws(
    () => validateTimedCaptionTrack(value, narration()),
    /does not match approved narration transcript/
  );
});

test('caption sync evidence binds to exact caption version and master checksum', () => {
  assert.doesNotThrow(() => validateCaptionSyncEvidence(evidence(), captions()));

  assert.throws(
    () => validateCaptionSyncEvidence(evidence({ captionTrackVersion: 2 }), captions()),
    /track version mismatch/
  );
  assert.throws(
    () => validateCaptionSyncEvidence(evidence({ audioMasterSha256: 'c'.repeat(64) }), captions()),
    /audio master checksum mismatch/
  );
  assert.throws(
    () => validateCaptionSyncEvidence(evidence({ sampledCueCount: 6 }), captions()),
    /cannot exceed caption cue count/
  );
});

test('caption release fails closed without measured sync evidence', () => {
  assert.deepEqual(
    evaluateTimedNarrativeRelease({
      narration: narration(),
      captions: captions()
    }),
    {
      status: 'transcript-only',
      reasons: ['caption-sync-evidence-missing']
    }
  );
});

test('caption release blocks excessive measured sync drift', () => {
  const result = evaluateTimedNarrativeRelease({
    narration: narration(),
    captions: captions(),
    syncEvidence: evidence({
      p95AbsDriftMs: 320,
      maxAbsDriftMs: 580
    })
  });

  assert.equal(result.status, 'transcript-only');
  assert.ok(result.reasons.includes('caption-sync-p95-drift-above-threshold'));
  assert.ok(result.reasons.includes('caption-sync-max-drift-above-threshold'));
});

test('caption release can pass only with production master, valid cues and measured sync evidence', () => {
  const result = evaluateTimedNarrativeRelease({
    narration: narration(),
    captions: captions(),
    syncEvidence: evidence()
  });

  assert.deepEqual(result, { status: 'captioned', reasons: [] });
});

test('caption threshold configuration is itself fail-closed', () => {
  assert.throws(
    () => validateCaptionSyncThresholds({
      minimumSampledCues: 0,
      maximumP95AbsDriftMs: 250,
      maximumAbsDriftMs: 500
    }),
    /positive integer/
  );
  assert.throws(
    () => validateCaptionSyncThresholds({
      minimumSampledCues: 1,
      maximumP95AbsDriftMs: 600,
      maximumAbsDriftMs: 500
    }),
    /cannot exceed maximum drift/
  );
});

test('WebVTT rendering is deterministic and preserves approved cue text', () => {
  const rendered = renderWebVtt(captions(), narration());

  assert.equal(rendered, [
    'WEBVTT',
    '',
    'c1',
    '00:00:00.000 --> 00:00:01.500',
    'Первая фраза.',
    '',
    'c2',
    '00:00:01.600 --> 00:00:03.100',
    'Вторая фраза.',
    '',
    'c3',
    '00:00:03.200 --> 00:00:04.800',
    'Третья фраза.',
    '',
    'c4',
    '00:00:05.000 --> 00:00:06.800',
    'Четвёртая фраза.',
    '',
    'c5',
    '00:00:07.000 --> 00:00:09.400',
    'Пятая фраза.',
    ''
  ].join('\n'));
});
