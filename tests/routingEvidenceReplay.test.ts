import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDayComposerProjection } from '../src/travel/dayComposer.ts';
import {
  projectValhallaRealSmokeAt,
  projectValhallaRealSmokeReplay,
  valhallaRealSmokeReplayContext,
  VALHALLA_REAL_SMOKE_EVIDENCE_REF
} from '../src/travel/routingEvidenceReplay.ts';
import type { PersonalTrip } from '../src/travel/personalTrip.ts';

function replayTrip(): PersonalTrip {
  return {
    schemaVersion: 1,
    id: 'routing-evidence-replay:valhalla-2026-10-08',
    destinationId: 'moscow',
    title: 'Valhalla evidence replay',
    startDate: '2026-10-08',
    endDate: '2026-10-08',
    days: ['2026-10-08'],
    items: [
      {
        id: 'pushkin',
        dayDate: '2026-10-08',
        title: 'Пушкинский музей · evidence endpoint',
        kind: 'museum',
        source: 'provider',
        destinationNodeId: 'pushkin-museum',
        plannedStartAt: '2026-10-08T12:00:00+03:00',
        plannedEndAt: '2026-10-08T13:00:00+03:00',
        status: 'planned'
      },
      {
        id: 'bolshoi',
        dayDate: '2026-10-08',
        title: 'Большой театр · evidence endpoint',
        kind: 'theatre',
        source: 'provider',
        destinationNodeId: 'bolshoi-theatre',
        plannedStartAt: '2026-10-08T13:35:00+03:00',
        plannedEndAt: '2026-10-08T15:30:00+03:00',
        status: 'planned'
      }
    ],
    visits: [],
    createdAt: '2026-10-08T09:42:00.000Z',
    updatedAt: '2026-10-08T09:42:00.000Z'
  };
}

test('real Valhalla smoke evidence replays as a source-backed 25 minute walking edge', () => {
  const projection = buildDayComposerProjection({
    trip: replayTrip(),
    dayDate: '2026-10-08',
    routingProjection: projectValhallaRealSmokeReplay(),
    routingEvidenceContext: {
      mode: valhallaRealSmokeReplayContext.mode,
      evidenceRef: valhallaRealSmokeReplayContext.evidenceRef
    }
  });

  assert.equal(projection.travel.length, 1);
  const travel = projection.travel[0]!;
  assert.equal(travel.status, 'tight');
  assert.equal(travel.requiredTravelMinutes, 25);
  assert.equal(travel.mode, 'walk');
  assert.equal(travel.bufferMinutes, 10);
  assert.equal(travel.providerName, 'Valhalla');
  assert.equal(travel.evidenceMode, 'historical-evidence-replay');
  assert.equal(travel.evidenceRef, VALHALLA_REAL_SMOKE_EVIDENCE_REF);
  assert.equal(travel.routingVerified, true);
});

test('the same real observation becomes stale for current projection after its expiry', () => {
  const current = projectValhallaRealSmokeAt('2026-10-08T10:30:00.000Z');
  assert.equal(current.observations[0]?.freshness, 'stale');
  assert.equal(current.observations[0]?.verified, false);

  const projection = buildDayComposerProjection({
    trip: replayTrip(),
    dayDate: '2026-10-08',
    routingProjection: current,
    routingEvidenceContext: {
      mode: 'live',
      evidenceRef: VALHALLA_REAL_SMOKE_EVIDENCE_REF
    }
  });

  assert.equal(projection.travel[0]?.status, 'unknown');
  assert.equal(projection.travel[0]?.requiredTravelMinutes, undefined);
  assert.equal(projection.travel[0]?.routingVerified, false);
});
