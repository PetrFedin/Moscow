import assert from 'node:assert/strict';
import test from 'node:test';

import type { DayReplacementProposal } from '../src/travel/dayReplacementProposal.ts';
import {
  verifyDayReplacementProposalRouting
} from '../src/travel/replacementRoutingVerification.ts';

function proposal(): DayReplacementProposal {
  return {
    schemaVersion: 1,
    id: 'replacement:test:candidate',
    disruptionId: 'disruption:test',
    baselineUpdatedAt: '2026-10-10T08:00:00.000Z',
    affectedItemId: 'affected',
    proposedStartAt: '2026-10-10T12:00:00+03:00',
    proposedEndAt: '2026-10-10T14:00:00+03:00',
    candidate: {
      entityId: 'candidate-live',
      destinationNodeId: 'tretyakov-aleksey-bogolyubov-neva-bosporus',
      title: 'Алексей Боголюбов. От Невы до Босфора',
      kind: 'exhibition',
      providerId: 'tretyakov-programme-official',
      providerName: 'Государственная Третьяковская галерея · выставки',
      sourceUrl: 'https://www.tretyakovgallery.ru/exhibitions/o/aleksey-bogolyubov-ot-nevy-do-bosfora/',
      observedAt: '2026-10-10T08:55:00.000Z',
      expiresAt: '2026-10-10T09:25:00.000Z',
      operationalStatus: 'scheduled',
      openingState: 'unknown',
      evidenceRef: 'current-live-candidate:test'
    },
    routeRequirements: {
      outbound: {
        direction: 'outbound',
        fromNodeId: 'tretyakov-aleksey-bogolyubov-neva-bosporus',
        toNodeId: 'bolshoi-theatre',
        departureAt: '2026-10-10T14:00:00+03:00',
        mustArriveBy: '2026-10-10T19:00:00+03:00'
      }
    },
    admission: 'routing-unverified',
    routingVerified: false,
    preservesFixedCommitments: true
  };
}

test('replacement routing verifier resolves source-backed geometry and current route', async () => {
  const result = await verifyDayReplacementProposalRouting({
    proposal: proposal(),
    authorityUrl: 'https://example.org/routing/walk',
    nowIso: '2026-10-10T09:00:00.000Z',
    fetchImpl: async (input) => {
      const url = new URL(String(input));
      assert.equal(url.searchParams.get('fromId'), 'tretyakov-aleksey-bogolyubov-neva-bosporus');
      assert.equal(url.searchParams.get('fromLat'), '55.7413613');
      assert.equal(url.searchParams.get('fromLon'), '37.6202196');
      assert.equal(url.searchParams.get('toId'), 'bolshoi-theatre');
      assert.equal(url.searchParams.get('toLat'), '55.7601296');
      assert.equal(url.searchParams.get('toLon'), '37.6186118');

      return new Response(JSON.stringify({
        schemaVersion: 1,
        kind: 'citywide-routing-current-snapshot',
        destinationId: 'moscow',
        fetchedAt: '2026-10-10T09:00:00.000Z',
        rawResponseSha256: 'c'.repeat(64),
        request: {
          mode: 'walk',
          from: {
            id: 'tretyakov-aleksey-bogolyubov-neva-bosporus',
            latitude: 55.7413613,
            longitude: 37.6202196
          },
          to: {
            id: 'bolshoi-theatre',
            latitude: 55.7601296,
            longitude: 37.6186118
          }
        },
        feed: {
          schemaVersion: 1,
          destinationId: 'moscow',
          generatedAt: '2026-10-10T09:00:00.100Z',
          providers: [{
            id: 'valhalla',
            name: 'Valhalla',
            relationship: 'routing-provider',
            sourceUrl: 'https://valhalla1.openstreetmap.de'
          }],
          observations: [{
            id: 'candidate-to-bolshoi',
            providerId: 'valhalla',
            from: {
              id: 'tretyakov-aleksey-bogolyubov-neva-bosporus',
              latitude: 55.7413613,
              longitude: 37.6202196
            },
            to: {
              id: 'bolshoi-theatre',
              latitude: 55.7601296,
              longitude: 37.6186118
            },
            mode: 'walk',
            durationMinutes: 24,
            distanceMeters: 1800,
            observedAt: '2026-10-10T09:00:00.000Z',
            expiresAt: '2026-10-10T09:15:00.000Z',
            sourceUrl: 'https://valhalla1.openstreetmap.de/route'
          }]
        }
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
  });

  assert.equal(result.status, 'verified');
  if (result.status !== 'verified') return;
  assert.equal(result.projection.observations.length, 1);
  assert.equal(result.projection.observations[0]?.verified, true);
  assert.equal(result.projection.observations[0]?.durationMinutes, 24);
  assert.deepEqual(result.rawResponseSha256, ['c'.repeat(64)]);
  assert.equal(result.geometryEvidenceRefs.length, 2);
});

test('replacement routing verifier fails closed when canonical geometry is missing', async () => {
  const value = proposal();
  value.routeRequirements.outbound!.toNodeId = 'unknown-fixed-place';

  const result = await verifyDayReplacementProposalRouting({
    proposal: value,
    authorityUrl: 'https://example.org/routing/walk',
    nowIso: '2026-10-10T09:00:00.000Z',
    fetchImpl: async () => {
      throw new Error('fetch must not run without geometry');
    }
  });

  assert.deepEqual(result, {
    status: 'blocked',
    blocker: 'geometry-missing',
    missingNodeIds: ['unknown-fixed-place']
  });
});
