import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDayComposerProjection } from '../src/travel/dayComposer.ts';
import {
  projectTretyakovLiveCityAt,
  projectTretyakovLiveCityReplay,
  tretyakovLiveCityReplayContext,
  TRETYAKOV_LIVE_CITY_EVIDENCE_REF
} from '../src/travel/liveCityTruthEvidenceReplay.ts';
import type { PersonalTrip } from '../src/travel/personalTrip.ts';

function replayTrip(): PersonalTrip {
  return {
    schemaVersion: 1,
    id: 'live-city-evidence-replay:tretyakov-2026-10-08',
    destinationId: 'moscow',
    title: 'Tretyakov live city evidence replay',
    startDate: '2026-10-08',
    endDate: '2026-10-08',
    days: ['2026-10-08'],
    items: [{
      id: 'tretyakov',
      dayDate: '2026-10-08',
      title: 'Новая Третьяковка',
      kind: 'museum',
      source: 'provider',
      destinationNodeId: 'new-tretyakov',
      plannedStartAt: '2026-10-08T17:00:00+03:00',
      plannedEndAt: '2026-10-08T19:00:00+03:00',
      status: 'planned'
    }],
    visits: [],
    createdAt: '2026-10-08T13:26:00.000Z',
    updatedAt: '2026-10-08T13:26:00.000Z'
  };
}

test('real Tretyakov live evidence replays as source-backed OPEN truth', () => {
  const projection = buildDayComposerProjection({
    trip: replayTrip(),
    dayDate: '2026-10-08',
    liveDestinationProjection: projectTretyakovLiveCityReplay(),
    liveEvidenceContext: {
      mode: tretyakovLiveCityReplayContext.mode,
      evidenceRef: tretyakovLiveCityReplayContext.evidenceRef
    }
  });

  const item = projection.items[0]!;
  assert.equal(item.liveTruth?.freshness, 'fresh');
  assert.equal(item.liveTruth?.operationalStatus, 'open');
  assert.equal(item.liveTruth?.openingState, 'open');
  assert.equal(item.liveTruth?.nextOpeningChangeAt, '2026-10-08T21:00:00+03:00');
  assert.equal(item.liveTruth?.providerName, 'Государственная Третьяковская галерея');
  assert.equal(item.liveTruth?.evidenceMode, 'historical-evidence-replay');
  assert.equal(item.liveTruth?.evidenceRef, TRETYAKOV_LIVE_CITY_EVIDENCE_REF);
  assert.equal(projection.externalTruth.openingHoursVerified, true);
});

test('the same real Tretyakov evidence expires and degrades to UNKNOWN', () => {
  const stale = projectTretyakovLiveCityAt('2026-10-08T14:00:00.000Z');
  assert.equal(stale.entities[0]?.freshness, 'stale');
  assert.equal(stale.entities[0]?.operationalStatus, 'unknown');
  assert.equal(stale.entities[0]?.openingState, 'unknown');

  const projection = buildDayComposerProjection({
    trip: replayTrip(),
    dayDate: '2026-10-08',
    liveDestinationProjection: stale,
    liveEvidenceContext: {
      mode: 'live',
      evidenceRef: TRETYAKOV_LIVE_CITY_EVIDENCE_REF
    }
  });

  assert.equal(projection.items[0]?.liveTruth?.journeyEligible, false);
  assert.equal(projection.externalTruth.openingHoursVerified, false);
});
