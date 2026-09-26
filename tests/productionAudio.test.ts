import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

test('Varvarka has a versioned RU EN and ZH narration script for every pilot stop', () => {
  assert.equal(varvarkaAudioCatalog.length, pilotRoute.stopIds.length * 3);

  for (const placeId of pilotRoute.stopIds) {
    for (const locale of ['ru', 'en', 'zh'] as const) {
      const track = getVarvarkaAudioTrack(placeId, locale);
      assert.ok(track, `missing audio script: ${placeId}/${locale}`);
      assert.equal(track.version, 1);
      assert.equal(track.status, 'recording-pending');
      assert.ok(track.transcript.length > (locale === 'zh' ? 120 : 180));
      assert.ok(track.sourceUrls.length > 0);
      assert.ok(track.sourceUrls.every((url) => url.startsWith('https://')));
    }
  }
});

test('recording-pending scripts can never masquerade as production audio', () => {
  const readiness = getVarvarkaAudioReadiness();
  assert.deepEqual(readiness, {
    expectedTracks: 15,
    productionReady: 0,
    recordingPending: 15,
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


test('background playback native config is explicit and does not request recording permissions', () => {
  const appConfig = JSON.parse(readFileSync('app.json', 'utf8')) as {
    expo?: { plugins?: unknown[] };
  };
  const plugins = appConfig.expo?.plugins ?? [];
  const audioPlugin = plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-audio') as [string, Record<string, unknown>] | undefined;

  assert.ok(audioPlugin, 'expo-audio config plugin is required for sustained background playback');
  assert.equal(audioPlugin[1].enableBackgroundPlayback, true);
  assert.equal(audioPlugin[1].enableBackgroundRecording, false);
  assert.equal(audioPlugin[1].microphonePermission, false);
  assert.equal(audioPlugin[1].recordAudioAndroid, false);
});
