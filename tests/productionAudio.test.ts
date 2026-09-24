import assert from 'node:assert/strict';
import test from 'node:test';

import { pilotRoute } from '../src/data/places.ts';
import {
  buildWalkAudioPlan,
  getVarvarkaAudioReadiness,
  getVarvarkaAudioTrack,
  isProductionAudioTrack,
  varvarkaAudioCatalog,
  type VarvarkaAudioTrack
} from '../src/features/audio/varvarkaAudioCatalog.ts';

test('Varvarka has a versioned RU and EN narration script for every pilot stop', () => {
  assert.equal(varvarkaAudioCatalog.length, pilotRoute.stopIds.length * 2);

  for (const placeId of pilotRoute.stopIds) {
    for (const locale of ['ru', 'en'] as const) {
      const track = getVarvarkaAudioTrack(placeId, locale);
      assert.ok(track, `missing audio script: ${placeId}/${locale}`);
      assert.equal(track.version, 1);
      assert.equal(track.status, 'recording-pending');
      assert.ok(track.transcript.length > 180);
      assert.ok(track.sourceUrls.length > 0);
      assert.ok(track.sourceUrls.every((url) => url.startsWith('https://')));
    }
  }
});

test('recording-pending scripts can never masquerade as production audio', () => {
  const readiness = getVarvarkaAudioReadiness();
  assert.deepEqual(readiness, {
    expectedTracks: 10,
    productionReady: 0,
    recordingPending: 10,
    scriptApproved: 0,
    complete: false
  });

  for (const track of varvarkaAudioCatalog) {
    assert.equal(isProductionAudioTrack(track), false);
    const plan = buildWalkAudioPlan({
      placeId: track.placeId,
      locale: track.locale,
      fallbackTranscript: 'fallback',
      displayTitle: 'Test stop'
    });
    assert.equal(plan.mode, 'tts-fallback');
    assert.equal(plan.productionStatus, 'recording-pending');
    assert.equal(plan.transcript, track.transcript);
    assert.equal(plan.masterUrl, undefined);
    assert.equal(plan.displayTitle, 'Test stop');
  }
});

test('production audio requires https master, safe filename, checksum, duration, narrator and rights evidence', () => {
  const base = varvarkaAudioCatalog[0];
  assert.ok(base);

  const ready: VarvarkaAudioTrack = {
    ...base,
    status: 'production-ready',
    production: {
      masterUrl: 'https://media.example.org/varvarka/barbara-ru-v1.m4a',
      filename: 'barbara-ru-v1.m4a',
      sha256: 'a'.repeat(64),
      durationSeconds: 51.8,
      narratorCredit: 'Approved narrator',
      rightsEvidenceRef: 'rights/audio/barbara-ru-v1'
    }
  };
  assert.equal(isProductionAudioTrack(ready), true);

  assert.equal(isProductionAudioTrack({
    ...ready,
    production: { ...ready.production!, rightsEvidenceRef: '' }
  }), false);
  assert.equal(isProductionAudioTrack({
    ...ready,
    production: { ...ready.production!, filename: '../escape.m4a' }
  }), false);
  assert.equal(isProductionAudioTrack({
    ...ready,
    production: { ...ready.production!, sha256: 'not-a-checksum' }
  }), false);
});

test('unknown places fall back to grounded caller transcript instead of inventing a recording', () => {
  const plan = buildWalkAudioPlan({
    placeId: 'unknown-place',
    locale: 'ru',
    fallbackTranscript: 'Проверенный резервный текст.',
    displayTitle: 'Проверенная остановка'
  });

  assert.equal(plan.mode, 'tts-fallback');
  assert.equal(plan.productionStatus, 'script-approved');
  assert.equal(plan.transcript, 'Проверенный резервный текст.');
  assert.equal(plan.displayTitle, 'Проверенная остановка');
});
