import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeExperienceSnapshot } from '../src/persistence/experiencePersistence.ts';

test('experience persistence accepts old v4 snapshots without losing existing progress', () => {
  const restored = normalizeExperienceSnapshot({
    savedIds: ['romanov-chambers', 'missing-place'],
    visitedIds: ['old-english-court'],
    routeStep: 2,
    language: 'en',
    lensOpacity: 0.73,
    lensVisible: false,
    missionDoneIds: ['observation:old-english-court:v1', 'bad'],
    walkAutoAudio: true
  });

  assert.deepEqual(restored.savedIds, ['romanov-chambers']);
  assert.deepEqual(restored.visitedIds, ['old-english-court']);
  assert.equal(restored.routeStep, 2);
  assert.equal(restored.language, 'en');
  assert.equal(restored.lensOpacity, 0.73);
  assert.equal(restored.lensVisible, false);
  assert.equal(restored.selectedId, 'romanov-chambers');
  assert.equal(restored.timeValue, 0);
  assert.equal(restored.era, '1857');
  assert.equal(restored.trustMode, 'public');
  assert.equal(restored.routeBudgetMinutes, 45);
  assert.equal(restored.routeInterest, 'highlights');
  assert.deepEqual(restored.routeStopIds, [
    'church-st-barbara',
    'old-english-court',
    'romanov-chambers',
    'znamensky-cathedral',
    'varvarka-gates'
  ]);
  assert.deepEqual(restored.missionDoneIds, ['observation:old-english-court:v1']);
  assert.equal(restored.walkAutoAudio, true);
});

test('experience persistence restores selected place, time, era, trust and tab', () => {
  const restored = normalizeExperienceSnapshot({
    selectedId: 'romanov-chambers',
    timeValue: 1,
    era: '1859',
    trustMode: 'documented',
    tab: 'discover',
    routeBudgetMinutes: 30,
    routeInterest: 'trade',
    routeStopIds: ['old-english-court', 'romanov-chambers']
  });

  assert.equal(restored.selectedId, 'romanov-chambers');
  assert.equal(restored.timeValue, 1);
  assert.equal(restored.era, '1859');
  assert.equal(restored.trustMode, 'documented');
  assert.equal(restored.tab, 'discover');
  assert.equal(restored.routeBudgetMinutes, 30);
  assert.equal(restored.routeInterest, 'trade');
  assert.deepEqual(restored.routeStopIds, ['old-english-court', 'romanov-chambers']);
  assert.deepEqual(restored.missionDoneIds, []);
  assert.equal(restored.walkAutoAudio, false);
});

test('experience persistence derives Romanov era from time when old snapshot has no era', () => {
  const restored = normalizeExperienceSnapshot({
    selectedId: 'romanov-chambers',
    timeValue: 2
  });

  assert.equal(restored.timeValue, 2);
  assert.equal(restored.era, '1859');
});

test('experience persistence fails closed on corrupt fields and clamps numeric state', () => {
  const restored = normalizeExperienceSnapshot({
    selectedId: 'not-a-place',
    tab: 'admin',
    timeValue: 999,
    routeStep: -50,
    lensOpacity: 7,
    language: 'xx',
    era: '1900',
    trustMode: 'invented'
  });

  assert.equal(restored.selectedId, 'romanov-chambers');
  assert.equal(restored.tab, 'discover');
  assert.equal(restored.routeStep, 0);
  assert.equal(restored.lensOpacity, 0.92);
  assert.equal(restored.language, 'ru');
  assert.equal(restored.trustMode, 'public');
  assert.equal(restored.routeBudgetMinutes, 45);
  assert.equal(restored.routeInterest, 'highlights');
});
