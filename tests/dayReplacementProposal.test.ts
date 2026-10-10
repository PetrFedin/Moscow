import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDayComposerProjection } from '../src/travel/dayComposer.ts';
import { buildDayComposerDisruptionCases } from '../src/travel/dayComposerDisruption.ts';
import {
  acceptDayReplacementProposal,
  buildDayReplacementProposals
} from '../src/travel/dayReplacementProposal.ts';
import {
  addDestinationNodeToTrip,
  attachTripCommitment,
  createPersonalTrip
} from '../src/travel/personalTrip.ts';
import {
  projectLiveDestinationFeed
} from '../src/travel/liveDestinationAuthority.ts';
import {
  projectCitywideRoutingFeed
} from '../src/travel/citywideRoutingAuthority.ts';

function buildTrip() {
  let trip = createPersonalTrip({
    id: 'replacement-trip',
    destinationId: 'moscow',
    title: 'Москва',
    startDate: '2026-10-10',
    endDate: '2026-10-10',
    createdAt: '2026-10-10T06:00:00.000Z'
  });

  trip = addDestinationNodeToTrip({
    trip,
    node: {
      id: 'previous-place',
      kind: 'museum',
      titleRu: 'Предыдущее место',
      latitude: 55.74,
      longitude: 37.61,
      tags: ['museum'],
      sourceIds: ['test']
    },
    itemId: 'previous',
    dayDate: '2026-10-10',
    plannedStartAt: '2026-10-10T10:00:00+03:00',
    updatedAt: '2026-10-10T06:01:00.000Z'
  });
  trip.items.find((item) => item.id === 'previous')!.plannedEndAt =
    '2026-10-10T11:00:00+03:00';

  trip = addDestinationNodeToTrip({
    trip,
    node: {
      id: 'affected-museum',
      kind: 'museum',
      titleRu: 'Закрывшийся музей',
      latitude: 55.75,
      longitude: 37.62,
      tags: ['museum'],
      sourceIds: ['affected-source']
    },
    itemId: 'affected',
    dayDate: '2026-10-10',
    plannedStartAt: '2026-10-10T12:00:00+03:00',
    updatedAt: '2026-10-10T06:02:00.000Z'
  });
  trip.items.find((item) => item.id === 'affected')!.plannedEndAt =
    '2026-10-10T14:00:00+03:00';

  trip = addDestinationNodeToTrip({
    trip,
    node: {
      id: 'fixed-theatre',
      kind: 'theatre',
      titleRu: 'Большой театр',
      latitude: 55.76,
      longitude: 37.615,
      tags: ['theatre'],
      sourceIds: ['test']
    },
    itemId: 'fixed',
    dayDate: '2026-10-10',
    plannedStartAt: '2026-10-10T19:00:00+03:00',
    updatedAt: '2026-10-10T06:03:00.000Z'
  });
  trip.items.find((item) => item.id === 'fixed')!.plannedEndAt =
    '2026-10-10T22:00:00+03:00';

  trip = attachTripCommitment({
    trip,
    itemId: 'fixed',
    commitment: {
      kind: 'ticket',
      status: 'confirmed',
      verification: 'user-declared',
      reference: 'THEATRE-TICKET'
    },
    updatedAt: '2026-10-10T06:04:00.000Z'
  });

  return trip;
}

function liveProjection() {
  return projectLiveDestinationFeed({
    schemaVersion: 1,
    destinationId: 'moscow',
    generatedAt: '2026-10-10T06:10:00.000Z',
    providers: [{
      id: 'affected-source',
      name: 'Affected Source',
      relationship: 'official',
      capabilities: ['inventory', 'operational-status'],
      sourceUrl: 'https://example.org/affected',
      attributionRu: 'Источник',
      attributionEn: 'Source',
      attributionZh: '来源'
    }, {
      id: 'candidate-source',
      name: 'Candidate Source',
      relationship: 'official',
      capabilities: ['inventory', 'operational-status'],
      sourceUrl: 'https://example.org/candidate',
      attributionRu: 'Источник',
      attributionEn: 'Source',
      attributionZh: '来源'
    }],
    entities: [{
      id: 'affected-live',
      providerEntityId: 'affected-museum',
      providerId: 'affected-source',
      canonicalDestinationNodeId: 'affected-museum',
      kind: 'museum',
      titleRu: 'Закрывшийся музей',
      titleEn: 'Closed museum',
      titleZh: '关闭的博物馆',
      tags: ['museum'],
      sourceUrl: 'https://example.org/affected/museum',
      observedAt: '2026-10-10T06:09:00.000Z',
      expiresAt: '2026-10-10T06:39:00.000Z',
      operationalStatus: 'closed'
    }, {
      id: 'candidate-live',
      providerEntityId: 'candidate-museum',
      providerId: 'candidate-source',
      canonicalDestinationNodeId: 'candidate-museum',
      kind: 'museum',
      titleRu: 'Музей-кандидат',
      titleEn: 'Candidate museum',
      titleZh: '候选博物馆',
      tags: ['museum'],
      sourceUrl: 'https://example.org/candidate/museum',
      observedAt: '2026-10-10T06:09:30.000Z',
      expiresAt: '2026-10-10T06:39:30.000Z',
      operationalStatus: 'open'
    }]
  }, '2026-10-10T06:10:00.000Z');
}

function routingProjection() {
  return projectCitywideRoutingFeed({
    schemaVersion: 1,
    destinationId: 'moscow',
    generatedAt: '2026-10-10T06:10:00.000Z',
    providers: [{
      id: 'routing',
      name: 'Routing Provider',
      relationship: 'routing-provider',
      sourceUrl: 'https://routing.example.org'
    }],
    observations: [{
      id: 'previous-to-candidate',
      providerId: 'routing',
      from: { id: 'previous-place', latitude: 55.74, longitude: 37.61 },
      to: { id: 'candidate-museum', latitude: 55.745, longitude: 37.615 },
      mode: 'walk',
      durationMinutes: 20,
      distanceMeters: 1500,
      observedAt: '2026-10-10T06:09:00.000Z',
      expiresAt: '2026-10-10T06:39:00.000Z',
      sourceUrl: 'https://routing.example.org/routes/1'
    }, {
      id: 'candidate-to-fixed',
      providerId: 'routing',
      from: { id: 'candidate-museum', latitude: 55.745, longitude: 37.615 },
      to: { id: 'fixed-theatre', latitude: 55.76, longitude: 37.615 },
      mode: 'walk',
      durationMinutes: 35,
      distanceMeters: 2600,
      observedAt: '2026-10-10T06:09:00.000Z',
      expiresAt: '2026-10-10T06:39:00.000Z',
      sourceUrl: 'https://routing.example.org/routes/2'
    }]
  }, '2026-10-10T06:10:00.000Z');
}

function context() {
  const trip = buildTrip();
  const live = liveProjection();
  const dayProjection = buildDayComposerProjection({
    trip,
    dayDate: '2026-10-10',
    liveDestinationProjection: live,
    liveEvidenceContext: { mode: 'live' }
  });
  const disruption = buildDayComposerDisruptionCases(dayProjection)[0]!;
  assert.ok(disruption);
  return { trip, live, dayProjection, disruption };
}

test('source-backed replacement is executable only with verified routes around the fixed ticket', () => {
  const { trip, live, dayProjection, disruption } = context();
  const set = buildDayReplacementProposals({
    trip,
    dayProjection,
    disruption,
    liveProjection: live,
    routingProjection: routingProjection(),
    preferredTravelModes: ['walk']
  });

  assert.equal(set.status, 'ready');
  assert.equal(set.proposals.length, 1);
  const proposal = set.proposals[0]!;
  assert.equal(proposal.candidate.destinationNodeId, 'candidate-museum');
  assert.equal(proposal.admission, 'executable');
  assert.equal(proposal.routingVerified, true);
  assert.equal(proposal.inboundRoute?.status, 'safe');
  assert.equal(proposal.outboundRoute?.status, 'safe');
  assert.equal(proposal.preservesFixedCommitments, true);
});

test('source-backed candidate without route evidence stays visible but cannot be accepted', () => {
  const { trip, live, dayProjection, disruption } = context();
  const set = buildDayReplacementProposals({
    trip,
    dayProjection,
    disruption,
    liveProjection: live
  });

  assert.equal(set.status, 'blocked');
  assert.equal(set.blocker, 'no-executable-candidates');
  assert.equal(set.proposals[0]?.admission, 'routing-unverified');

  assert.throws(() => acceptDayReplacementProposal({
    trip,
    disruption,
    proposal: set.proposals[0]!,
    acceptedAt: '2026-10-10T06:11:00.000Z'
  }), /not executable/);
});

test('explicit acceptance replaces only the affected item and preserves the fixed ticket exactly', () => {
  const { trip, live, dayProjection, disruption } = context();
  const proposal = buildDayReplacementProposals({
    trip,
    dayProjection,
    disruption,
    liveProjection: live,
    routingProjection: routingProjection()
  }).proposals[0]!;

  const fixedBefore = structuredClone(trip.items.find((item) => item.id === 'fixed')!);
  const accepted = acceptDayReplacementProposal({
    trip,
    disruption,
    proposal,
    acceptedAt: '2026-10-10T06:11:00.000Z'
  });

  const affected = accepted.trip.items.find((item) => item.id === 'affected')!;
  const fixedAfter = accepted.trip.items.find((item) => item.id === 'fixed')!;

  assert.equal(affected.title, 'Музей-кандидат');
  assert.equal(affected.destinationNodeId, 'candidate-museum');
  assert.equal(affected.source, 'provider');
  assert.equal(affected.plannedStartAt, '2026-10-10T12:00:00+03:00');
  assert.equal(affected.plannedEndAt, '2026-10-10T14:00:00+03:00');
  assert.deepEqual(fixedAfter, fixedBefore);
  assert.equal(accepted.receipt.fixedCommitmentsPreserved, true);
  assert.deepEqual(
    accepted.receipt.routeObservationIds.sort(),
    ['candidate-to-fixed', 'previous-to-candidate']
  );
});

test('stale baseline blocks acceptance even for an executable proposal', () => {
  const { trip, live, dayProjection, disruption } = context();
  const proposal = buildDayReplacementProposals({
    trip,
    dayProjection,
    disruption,
    liveProjection: live,
    routingProjection: routingProjection()
  }).proposals[0]!;

  assert.throws(() => acceptDayReplacementProposal({
    trip: { ...trip, updatedAt: '2026-10-10T06:12:00.000Z' },
    disruption,
    proposal,
    acceptedAt: '2026-10-10T06:13:00.000Z'
  }), /baseline is stale/);
});
