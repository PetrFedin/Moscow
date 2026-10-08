import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyLiveCityDisruptionsToJourneyRuntime,
  runLiveCityRefreshRuntime
} from '../src/travel/liveCityRefreshRuntime.ts';
import type {
  LiveProviderAdapter,
  LiveProviderSnapshot
} from '../src/travel/liveProviderIngestion.ts';
import {
  createDestinationJourneyRuntime
} from '../src/travel/destinationJourneyRuntime.ts';

function adapter(input: {
  id: string;
  providerId: string;
  entityId: string;
  status: 'open' | 'closed' | 'scheduled' | 'cancelled' | 'rescheduled';
}) : LiveProviderAdapter<{ ok: true }> {
  return {
    id: input.id,
    destinationId: 'moscow',
    provider: {
      id: input.providerId,
      name: input.providerId,
      relationship: 'official',
      capabilities: ['inventory', 'operational-status', 'event-schedule'],
      sourceUrl: `https://example.org/${input.providerId}`,
      attributionRu: 'Источник',
      attributionEn: 'Source',
      attributionZh: '来源'
    },
    refreshPolicy: {
      expectedRefreshSeconds: 900,
      hardMaxSnapshotAgeSeconds: 3600,
      retryAfterSeconds: 300
    },
    normalize: (_payload, snapshot) => [{
      id: input.entityId,
      providerEntityId: input.entityId,
      providerId: input.providerId,
      canonicalDestinationNodeId: input.entityId,
      kind: input.status === 'scheduled' || input.status === 'cancelled' || input.status === 'rescheduled'
        ? 'event'
        : 'museum',
      titleRu: input.entityId,
      titleEn: input.entityId,
      titleZh: input.entityId,
      tags: ['test'],
      sourceUrl: snapshot.sourceUrl,
      observedAt: snapshot.fetchedAt,
      expiresAt: '2026-10-08T16:30:00.000Z',
      operationalStatus: input.status,
      ...(input.status === 'scheduled' || input.status === 'cancelled' || input.status === 'rescheduled'
        ? {
            startsAt: '2026-10-08T18:00:00+03:00',
            endsAt: '2026-10-08T20:00:00+03:00'
          }
        : {})
    }]
  };
}

function snapshot(providerId: string): LiveProviderSnapshot<{ ok: true }> {
  return {
    schemaVersion: 1,
    providerId,
    snapshotId: `${providerId}:2026-10-08T15:30:00Z`,
    sourceUrl: `https://example.org/${providerId}`,
    fetchedAt: '2026-10-08T15:30:00.000Z',
    payloadSha256: providerId === 'venue' ? 'a'.repeat(64) : 'b'.repeat(64),
    payload: { ok: true }
  };
}

test('current refresh merges provider feeds and keeps non-disruptive entities eligible', () => {
  const result = runLiveCityRefreshRuntime({
    refreshedAt: '2026-10-08T15:35:00.000Z',
    sources: [
      {
        adapter: adapter({ id: 'venue-adapter', providerId: 'venue', entityId: 'museum-1', status: 'open' }),
        snapshot: snapshot('venue')
      },
      {
        adapter: adapter({ id: 'event-adapter', providerId: 'programme', entityId: 'event-1', status: 'scheduled' }),
        snapshot: snapshot('programme')
      }
    ]
  });

  assert.equal(result.projection.entities.length, 2);
  assert.equal(result.projection.entities.find((item) => item.id === 'museum-1')?.journeyEligible, true);
  assert.equal(result.projection.entities.find((item) => item.id === 'event-1')?.operationalStatus, 'scheduled');
  assert.deepEqual(result.disruptions, []);
  assert.equal(result.ingestionRecords.length, 2);
});

test('closed, cancelled and rescheduled source truth becomes explicit disruption evidence', () => {
  const result = runLiveCityRefreshRuntime({
    refreshedAt: '2026-10-08T15:35:00.000Z',
    sources: [
      {
        adapter: adapter({ id: 'closed-adapter', providerId: 'venue', entityId: 'museum-1', status: 'closed' }),
        snapshot: snapshot('venue')
      },
      {
        adapter: adapter({ id: 'rescheduled-adapter', providerId: 'programme', entityId: 'event-1', status: 'rescheduled' }),
        snapshot: snapshot('programme')
      }
    ]
  });

  assert.equal(result.disruptions.length, 2);
  assert.equal(result.disruptions.find((item) => item.entityId === 'museum-1')?.reason, 'closed');
  assert.equal(result.disruptions.find((item) => item.entityId === 'event-1')?.reason, 'rescheduled');
  assert.match(result.disruptions[0]!.evidenceRef, /^live-provider:/);
});

test('refresh disruption drives existing Journey Runtime into replan-required', () => {
  const runtime = createDestinationJourneyRuntime({
    journeyId: 'journey-1',
    destinationId: 'moscow',
    createdAt: '2026-10-08T15:00:00.000Z',
    blocks: [{
      id: 'event-block',
      kind: 'event',
      title: 'Event',
      plannedStartAt: '2026-10-08T18:00:00.000Z',
      plannedEndAt: '2026-10-08T20:00:00.000Z',
      authority: {
        kind: 'live-destination',
        entityId: 'event-1',
        providerId: 'programme',
        evidenceRef: 'initial-evidence'
      },
      status: 'planned'
    }]
  });

  const refresh = runLiveCityRefreshRuntime({
    refreshedAt: '2026-10-08T15:35:00.000Z',
    sources: [{
      adapter: adapter({
        id: 'rescheduled-adapter',
        providerId: 'programme',
        entityId: 'event-1',
        status: 'rescheduled'
      }),
      snapshot: snapshot('programme')
    }]
  });

  const next = applyLiveCityDisruptionsToJourneyRuntime({ runtime, refresh });
  assert.equal(next.state, 'replan-required');
  assert.equal(next.blocks[0]?.status, 'blocked');
  assert.equal(next.replanReason, 'event-block:rescheduled');
  assert.ok(next.audit.some((item) => item.action === 'replan-required:event-block:rescheduled'));
});
