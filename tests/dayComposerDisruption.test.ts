import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDayComposerProjection } from '../src/travel/dayComposer.ts';
import { buildDayComposerDisruptionCases } from '../src/travel/dayComposerDisruption.ts';
import {
  addDestinationNodeToTrip,
  addManualTripItem,
  createPersonalTrip
} from '../src/travel/personalTrip.ts';
import { projectLiveDestinationFeed } from '../src/travel/liveDestinationAuthority.ts';

function buildTrip() {
  let trip = createPersonalTrip({
    id: 'live-disruption-trip',
    destinationId: 'moscow',
    title: 'Москва',
    startDate: '2026-10-10',
    endDate: '2026-10-10',
    createdAt: '2026-10-10T06:00:00.000Z'
  });

  trip = addDestinationNodeToTrip({
    trip,
    node: {
      id: 'new-tretyakov',
      kind: 'museum',
      titleRu: 'Новая Третьяковка',
      latitude: 55.735,
      longitude: 37.605,
      tags: ['museum'],
      sourceIds: ['tretyakov-official']
    },
    itemId: 'tretyakov',
    dayDate: '2026-10-10',
    plannedStartAt: '2026-10-10T12:00:00+03:00',
    updatedAt: '2026-10-10T06:01:00.000Z'
  });

  trip.items[0]!.plannedEndAt = '2026-10-10T14:00:00+03:00';

  trip = addManualTripItem({
    trip,
    itemId: 'fixed-theatre',
    dayDate: '2026-10-10',
    title: 'Большой театр',
    kind: 'theatre',
    plannedStartAt: '2026-10-10T19:00:00+03:00',
    plannedEndAt: '2026-10-10T22:00:00+03:00',
    commitment: {
      kind: 'ticket',
      status: 'confirmed',
      verification: 'user-declared',
      reference: 'USER-TICKET'
    },
    updatedAt: '2026-10-10T06:02:00.000Z'
  });

  return trip;
}

function liveProjection(status: 'closed' | 'open' | 'rescheduled') {
  return projectLiveDestinationFeed({
    schemaVersion: 1,
    destinationId: 'moscow',
    generatedAt: '2026-10-10T06:10:00.000Z',
    providers: [{
      id: 'tretyakov-official',
      name: 'Государственная Третьяковская галерея',
      relationship: 'official',
      capabilities: ['inventory', 'operational-status', 'opening-hours', 'event-schedule'],
      sourceUrl: 'https://www.tretyakovgallery.ru/for-visitors/museums/novaya-tretyakovka/',
      attributionRu: 'Источник',
      attributionEn: 'Source',
      attributionZh: '来源'
    }],
    entities: [{
      id: 'new-tretyakov-live',
      providerEntityId: 'new-tretyakov',
      providerId: 'tretyakov-official',
      canonicalDestinationNodeId: 'new-tretyakov',
      kind: status === 'rescheduled' ? 'exhibition' : 'museum',
      titleRu: 'Новая Третьяковка',
      titleEn: 'New Tretyakov',
      titleZh: '新特列季亚科夫画廊',
      tags: ['museum'],
      sourceUrl: 'https://www.tretyakovgallery.ru/for-visitors/museums/novaya-tretyakovka/',
      observedAt: '2026-10-10T06:09:00.000Z',
      expiresAt: '2026-10-10T06:39:00.000Z',
      operationalStatus: status,
      ...(status === 'rescheduled'
        ? {
            startsAt: '2026-10-10T12:30:00+03:00',
            endsAt: '2026-10-10T14:30:00+03:00'
          }
        : {})
    }]
  }, '2026-10-10T06:10:00.000Z');
}

test('closed current live truth turns affected Day Composer item into replan-required case', () => {
  const projection = buildDayComposerProjection({
    trip: buildTrip(),
    dayDate: '2026-10-10',
    liveDestinationProjection: liveProjection('closed'),
    liveEvidenceContext: { mode: 'live' }
  });

  const disruptions = buildDayComposerDisruptionCases(projection);
  assert.equal(disruptions.length, 1);

  const disruption = disruptions[0]!;
  assert.equal(disruption.affectedItem.itemId, 'tretyakov');
  assert.equal(disruption.disruption.reason, 'closed');
  assert.equal(disruption.runtime.state, 'replan-required');
  assert.match(disruption.runtime.replanReason ?? '', /tretyakov:closed/);
  assert.deepEqual(disruption.preservedFixedCommitments, [{
    itemId: 'fixed-theatre',
    title: 'Большой театр',
    startsAt: '2026-10-10T19:00:00+03:00',
    endsAt: '2026-10-10T22:00:00+03:00',
    commitment: 'ticketed',
    verification: 'user-declared'
  }]);
});

test('rescheduled live truth also enters replan-required and keeps evidence source', () => {
  const projection = buildDayComposerProjection({
    trip: buildTrip(),
    dayDate: '2026-10-10',
    liveDestinationProjection: liveProjection('rescheduled'),
    liveEvidenceContext: {
      mode: 'live',
      evidenceRef: 'published-current:run-1'
    }
  });

  const disruption = buildDayComposerDisruptionCases(projection)[0]!;
  assert.equal(disruption.disruption.reason, 'rescheduled');
  assert.equal(disruption.disruption.evidenceRef, 'published-current:run-1');
  assert.equal(disruption.runtime.audit.at(-1)?.ref, 'published-current:run-1');
});

test('healthy current live truth does not create a disruption case', () => {
  const projection = buildDayComposerProjection({
    trip: buildTrip(),
    dayDate: '2026-10-10',
    liveDestinationProjection: liveProjection('open'),
    liveEvidenceContext: { mode: 'live' }
  });

  assert.deepEqual(buildDayComposerDisruptionCases(projection), []);
});
