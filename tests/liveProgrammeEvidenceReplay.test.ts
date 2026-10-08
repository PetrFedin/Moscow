import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDayComposerProjection } from '../src/travel/dayComposer.ts';
import {
  projectTretyakovProgrammeAt,
  projectTretyakovProgrammeReplay,
  tretyakovProgrammeReplayContext,
  TRETYAKOV_PROGRAMME_EVIDENCE_REF
} from '../src/travel/liveProgrammeEvidenceReplay.ts';
import type { PersonalTrip } from '../src/travel/personalTrip.ts';

function replayTrip(): PersonalTrip {
  return {
    schemaVersion: 1,
    id: 'live-programme-evidence-replay:tretyakov-2026-10-08',
    destinationId: 'moscow',
    title: 'Tretyakov programme evidence replay',
    startDate: '2026-10-08',
    endDate: '2026-10-08',
    days: ['2026-10-08'],
    items: [{
      id: 'bogolyubov',
      dayDate: '2026-10-08',
      title: 'Алексей Боголюбов. От Невы до Босфора',
      kind: 'exhibition',
      source: 'provider',
      destinationNodeId: 'tretyakov-aleksey-bogolyubov-neva-bosporus',
      plannedStartAt: '2026-10-08T18:00:00+03:00',
      plannedEndAt: '2026-10-08T20:00:00+03:00',
      status: 'planned'
    }],
    visits: [],
    createdAt: '2026-10-08T15:25:00.000Z',
    updatedAt: '2026-10-08T15:25:00.000Z'
  };
}

test('real Tretyakov programme evidence replays as source-backed scheduled truth', () => {
  const projection = buildDayComposerProjection({
    trip: replayTrip(),
    dayDate: '2026-10-08',
    liveDestinationProjection: projectTretyakovProgrammeReplay(),
    liveEvidenceContext: {
      mode: tretyakovProgrammeReplayContext.mode,
      evidenceRef: tretyakovProgrammeReplayContext.evidenceRef
    }
  });

  const item = projection.items[0]!;
  assert.equal(item.liveTruth?.freshness, 'fresh');
  assert.equal(item.liveTruth?.operationalStatus, 'scheduled');
  assert.equal(item.liveTruth?.programmeStartsAt, '2026-09-29T00:00:00+03:00');
  assert.equal(item.liveTruth?.programmeEndsAt, '2027-06-06T23:59:59+03:00');
  assert.equal(item.liveTruth?.providerName, 'Государственная Третьяковская галерея · выставки');
  assert.equal(item.liveTruth?.evidenceMode, 'historical-evidence-replay');
  assert.equal(item.liveTruth?.evidenceRef, TRETYAKOV_PROGRAMME_EVIDENCE_REF);
  assert.equal(item.liveTruth?.journeyEligible, true);
});

test('expired real programme evidence becomes unknown and ineligible', () => {
  const stale = projectTretyakovProgrammeAt('2026-10-08T16:00:00.000Z');
  assert.equal(stale.entities[0]?.freshness, 'stale');
  assert.equal(stale.entities[0]?.operationalStatus, 'unknown');

  const projection = buildDayComposerProjection({
    trip: replayTrip(),
    dayDate: '2026-10-08',
    liveDestinationProjection: stale,
    liveEvidenceContext: {
      mode: 'live',
      evidenceRef: TRETYAKOV_PROGRAMME_EVIDENCE_REF
    }
  });

  assert.equal(projection.items[0]?.liveTruth?.operationalStatus, 'unknown');
  assert.equal(projection.items[0]?.liveTruth?.journeyEligible, false);
});
