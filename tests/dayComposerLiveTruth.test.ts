import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDayComposerProjection } from '../src/travel/dayComposer.ts';
import {
  projectLiveDestinationFeed,
  type LiveDestinationFeed
} from '../src/travel/liveDestinationAuthority.ts';
import type { PersonalTrip } from '../src/travel/personalTrip.ts';

function trip(): PersonalTrip {
  return {
    schemaVersion: 1,
    id: 'live-city-truth:test',
    destinationId: 'moscow',
    title: 'Live city truth',
    startDate: '2026-10-08',
    endDate: '2026-10-08',
    days: ['2026-10-08'],
    items: [
      {
        id: 'museum-item',
        dayDate: '2026-10-08',
        title: 'Музей',
        kind: 'museum',
        source: 'provider',
        destinationNodeId: 'museum-live',
        plannedStartAt: '2026-10-08T12:00:00+03:00',
        plannedEndAt: '2026-10-08T13:30:00+03:00',
        status: 'planned'
      }
    ],
    visits: [],
    createdAt: '2026-10-08T08:00:00.000Z',
    updatedAt: '2026-10-08T08:00:00.000Z'
  };
}

function feed(): LiveDestinationFeed {
  return {
    schemaVersion: 1,
    destinationId: 'moscow',
    generatedAt: '2026-10-08T08:55:00.000Z',
    providers: [{
      id: 'museum-source',
      name: 'Museum Source',
      relationship: 'official',
      capabilities: ['inventory', 'operational-status', 'opening-hours'],
      sourceUrl: 'https://example.org/museum',
      attributionRu: 'Источник: музей',
      attributionEn: 'Source: museum',
      attributionZh: '来源：博物馆'
    }],
    entities: [{
      id: 'museum-live',
      providerEntityId: 'museum-42',
      providerId: 'museum-source',
      kind: 'museum',
      titleRu: 'Музей',
      titleEn: 'Museum',
      titleZh: '博物馆',
      latitude: 55.75,
      longitude: 37.61,
      tags: ['museum'],
      sourceUrl: 'https://example.org/museum/42',
      observedAt: '2026-10-08T08:50:00.000Z',
      expiresAt: '2026-10-08T09:30:00.000Z',
      operationalStatus: 'open',
      openingHours: {
        timezone: 'Europe/Moscow',
        windows: [{
          opensAt: '2026-10-08T08:00:00.000Z',
          closesAt: '2026-10-08T15:00:00.000Z'
        }]
      }
    }]
  };
}

test('Day Composer receives fresh opening and operational truth as projection metadata', () => {
  const live = projectLiveDestinationFeed(feed(), '2026-10-08T09:00:00.000Z');
  const projection = buildDayComposerProjection({
    trip: trip(),
    dayDate: '2026-10-08',
    liveDestinationProjection: live
  });

  const item = projection.items[0]!;
  assert.equal(item.liveTruth?.freshness, 'fresh');
  assert.equal(item.liveTruth?.operationalStatus, 'open');
  assert.equal(item.liveTruth?.openingState, 'open');
  assert.equal(item.liveTruth?.journeyEligible, true);
  assert.equal(item.liveTruth?.providerName, 'Museum Source');
  assert.equal(projection.externalTruth.openingHoursVerified, true);
});

test('stale live source degrades Day Composer status and hours to unknown', () => {
  const live = projectLiveDestinationFeed(feed(), '2026-10-08T10:00:00.000Z');
  const projection = buildDayComposerProjection({
    trip: trip(),
    dayDate: '2026-10-08',
    liveDestinationProjection: live
  });

  const item = projection.items[0]!;
  assert.equal(item.liveTruth?.freshness, 'stale');
  assert.equal(item.liveTruth?.operationalStatus, 'unknown');
  assert.equal(item.liveTruth?.openingState, 'unknown');
  assert.equal(item.liveTruth?.journeyEligible, false);
  assert.equal(projection.externalTruth.openingHoursVerified, false);
});

test('live truth remains a projection and never mutates PersonalTrip', () => {
  const sourceTrip = trip();
  const before = JSON.stringify(sourceTrip);
  const live = projectLiveDestinationFeed(feed(), '2026-10-08T09:00:00.000Z');

  buildDayComposerProjection({
    trip: sourceTrip,
    dayDate: '2026-10-08',
    liveDestinationProjection: live
  });

  assert.equal(JSON.stringify(sourceTrip), before);
  assert.equal('liveTruth' in sourceTrip.items[0]!, false);
});
