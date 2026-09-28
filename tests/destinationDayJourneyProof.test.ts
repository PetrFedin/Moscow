import assert from 'node:assert/strict';
import test from 'node:test';

import type { PilotStudyReport } from '../src/analytics/pilotStudy.ts';
import type { PublishedSpatialPackage } from '../src/spatial/publishedSpatialPackage.ts';
import {
  createVisitorPilotReviewEvidence,
  evaluateDestinationDayJourney,
  validateDestinationDayRoutingProof,
  type DestinationDayRoutingProof
} from '../src/travel/destinationDayJourneyProof.ts';
import {
  projectLiveDestinationFeed,
  type LiveDestinationFeed
} from '../src/travel/liveDestinationAuthority.ts';
import type { LiveProviderIngestionRecord } from '../src/travel/liveProviderIngestion.ts';
import { moscowVarvarkaDestinationPackage } from '../src/travel/moscowDestinationPackage.ts';

function fieldVerifiedPackage(
  id: string,
  placeId: string
): PublishedSpatialPackage {
  return {
    schemaVersion: 1,
    id,
    placeId,
    titleRu: placeId,
    titleEn: placeId,
    version: 1,
    releaseState: 'field-verified',
    publishedAt: '2026-09-28T09:00:00.000Z',
    publisher: 'Moscow in Time',
    eras: [{
      id: 'current-era',
      yearLabel: 'current',
      titleRu: 'Проверенное состояние',
      titleEn: 'Verified state'
    }],
    sources: [{
      id: 'source-1',
      title: 'Verified source',
      sourceUrl: 'https://example.org/source',
      rights: 'public-domain',
      accessedAt: '2026-09-28'
    }],
    elements: [{
      id: 'element-1',
      titleRu: 'Элемент',
      titleEn: 'Element',
      trust: 'documented',
      eraIds: ['current-era'],
      sourceIds: ['source-1']
    }],
    claims: [{
      id: 'claim-1',
      summary: 'Verified claim',
      trust: 'documented',
      sourceIds: ['source-1'],
      modelElementIds: ['element-1'],
      reviewer: 'test',
      reviewedAt: '2026-09-28T08:00:00.000Z'
    }],
    models: [{
      id: 'model-1',
      format: 'glb',
      version: 1,
      eraId: 'current-era',
      trustMode: 'documented',
      runtimeModes: ['model3d', 'ar'],
      sourceIds: ['source-1'],
      elementIds: ['element-1'],
      assetPath: `assets/models/${placeId}.glb`,
      repositoryBlobSha: 'a'.repeat(40),
      assetSha256: 'b'.repeat(64),
      byteSize: 1000
    }],
    authority: {
      modelPackVersion: `${placeId}-model-pack-v1`,
      metric: {
        id: `${placeId}-metric-v1`,
        version: 1,
        modelPackVersion: `${placeId}-model-pack-v1`,
        modelUnits: 'meters',
        scaleStatus: 'verified'
      },
      controlPoints: {
        id: `${placeId}-control-points-v1`,
        version: 1,
        requiredPoints: 5,
        requiredAlignmentPoints: 3
      }
    },
    fieldVerification: {
      required: true,
      minimumFieldSessions: 1,
      releaseGateState: 'field-verified-spatial-scene',
      calibrationVersion: 1,
      calibrationMetricBinding: {
        metricAuthorityId: `${placeId}-metric-v1`,
        metricAuthorityVersion: 1,
        modelPackVersion: `${placeId}-model-pack-v1`
      },
      surveyVerified: true,
      surveyPacketId: `${placeId}-survey-v1`,
      multiDeviceMatrixPassed: true,
      fieldConditionsComplete: true,
      daylightEvidence: true,
      fieldSessionIds: [`${placeId}-field-session-1`],
      persistentAnchorVerified: true,
      restartRecoveryVerified: true,
      restartRecoverySessionIds: [`${placeId}-recovery-1`],
      persistentAnchorProofIds: [`${placeId}-anchor-proof-1`],
      verifiedAt: '2026-09-28T08:30:00.000Z',
      releaseBlockers: []
    },
    languages: ['ru', 'en', 'zh'],
    offlineEligible: true
  };
}

function pilotReview() {
  const report = {
    studyId: 'varvarka-real-study-01',
    completeForFirstReview: true,
    plannedParticipantSlots: 20,
    receivedAggregateReports: 18,
    receivedObserverNotes: 20,
    interpretation: {
      representativeSurvey: false
    }
  } as PilotStudyReport;

  return createVisitorPilotReviewEvidence({
    report,
    evidenceRef: 'evidence/varvarka-real-study-01/final-study-report.json',
    reviewedAt: '2026-09-28T09:30:00.000Z'
  });
}

function liveFeed(): LiveDestinationFeed {
  return {
    schemaVersion: 1,
    destinationId: 'moscow-varvarka',
    generatedAt: '2026-09-28T10:00:00.000Z',
    providers: [
      {
        id: 'city-live',
        name: 'City Live Feed',
        relationship: 'city-service',
        capabilities: ['inventory', 'event-schedule', 'operational-status'],
        sourceUrl: 'https://live.example.org/feed',
        attributionRu: 'Источник: City Live',
        attributionEn: 'Source: City Live',
        attributionZh: '来源：City Live'
      },
      {
        id: 'tickets',
        name: 'Ticket Provider',
        relationship: 'booking-provider',
        capabilities: ['booking-handoff'],
        sourceUrl: 'https://tickets.example.org',
        attributionRu: 'Билеты: Ticket Provider',
        attributionEn: 'Tickets: Ticket Provider',
        attributionZh: '票务：Ticket Provider'
      }
    ],
    entities: [
      {
        id: 'live-event',
        providerEntityId: 'event-42',
        providerId: 'city-live',
        kind: 'event',
        titleRu: 'Вечернее событие',
        titleEn: 'Evening Event',
        titleZh: '晚间活动',
        latitude: 55.752,
        longitude: 37.63,
        tags: ['культура'],
        sourceUrl: 'https://live.example.org/events/42',
        observedAt: '2026-09-28T10:00:00.000Z',
        expiresAt: '2026-09-28T22:30:00.000Z',
        operationalStatus: 'scheduled',
        startsAt: '2026-09-28T18:00:00.000Z',
        endsAt: '2026-09-28T19:30:00.000Z',
        booking: {
          mode: 'city-service',
          provider: 'Ticket Provider',
          providerId: 'tickets',
          action: 'buy-ticket',
          url: 'https://tickets.example.org/event/42',
          verifiedAt: '2026-09-28T10:00:00.000Z',
          expiresAt: '2026-09-28T17:30:00.000Z'
        }
      },
      {
        id: 'live-food',
        providerEntityId: 'food-9',
        providerId: 'city-live',
        kind: 'food',
        titleRu: 'Ресторан',
        titleEn: 'Restaurant',
        titleZh: '餐厅',
        latitude: 55.753,
        longitude: 37.631,
        tags: ['еда'],
        sourceUrl: 'https://live.example.org/food/9',
        observedAt: '2026-09-28T10:00:00.000Z',
        expiresAt: '2026-09-28T22:30:00.000Z',
        operationalStatus: 'open'
      }
    ]
  };
}

function ingestionRecords(): LiveProviderIngestionRecord[] {
  return [
    {
      schemaVersion: 1,
      adapterId: 'city-live-adapter-v1',
      destinationId: 'moscow-varvarka',
      providerId: 'city-live',
      snapshotId: 'city-live-snapshot-1',
      sourceUrl: 'https://live.example.org/feed',
      payloadSha256: 'c'.repeat(64),
      fetchedAt: '2026-09-28T10:00:00.000Z',
      normalizedAt: '2026-09-28T10:01:00.000Z',
      snapshotFreshness: 'fresh',
      normalizedEntityCount: 2,
      warnings: []
    },
    {
      schemaVersion: 1,
      adapterId: 'ticket-adapter-v1',
      destinationId: 'moscow-varvarka',
      providerId: 'tickets',
      snapshotId: 'tickets-snapshot-1',
      sourceUrl: 'https://tickets.example.org',
      payloadSha256: 'd'.repeat(64),
      fetchedAt: '2026-09-28T10:00:00.000Z',
      normalizedAt: '2026-09-28T10:01:00.000Z',
      snapshotFreshness: 'fresh',
      normalizedEntityCount: 0,
      warnings: []
    }
  ];
}

function routingProof(): DestinationDayRoutingProof {
  return {
    schemaVersion: 1,
    id: 'moscow-day-routing-proof-v1',
    provider: 'Verified Routing Provider',
    sourceUrl: 'https://routing.example.org/proof/1',
    generatedAt: '2026-09-28T10:05:00.000Z',
    expiresAt: '2026-09-28T10:30:00.000Z',
    journeyStartsAt: '2026-09-28T11:00:00.000Z',
    journeyEndsAt: '2026-09-28T21:00:00.000Z',
    orderedBlocks: [
      {
        ref: {
          authority: 'destination-route',
          id: 'varvarka-45'
        },
        plannedStartAt: '2026-09-28T11:00:00.000Z',
        plannedEndAt: '2026-09-28T11:45:00.000Z'
      },
      {
        ref: {
          authority: 'live-destination',
          id: 'live-event'
        },
        plannedStartAt: '2026-09-28T17:45:00.000Z',
        plannedEndAt: '2026-09-28T19:30:00.000Z'
      },
      {
        ref: {
          authority: 'live-destination',
          id: 'live-food'
        },
        plannedStartAt: '2026-09-28T20:00:00.000Z',
        plannedEndAt: '2026-09-28T21:00:00.000Z'
      }
    ]
  };
}

test('current Moscow package remains blocked instead of inventing a full visitor day', () => {
  const readiness = evaluateDestinationDayJourney({
    destinationPackage: moscowVarvarkaDestinationPackage,
    heritageRouteId: 'varvarka-45',
    spatialPackages: [],
    now: '2026-09-28T10:15:00.000Z'
  });

  assert.equal(readiness.status, 'blocked');
  if (readiness.status !== 'blocked') return;

  assert.ok(
    readiness.blockers.includes(
      'heritage-package-not-field-verified:moscow-romanov-chambers-spatial-v1'
    )
  );
  assert.ok(
    readiness.blockers.includes(
      'heritage-package-not-field-verified:moscow-old-english-court-spatial-v1'
    )
  );
  assert.ok(readiness.blockers.includes('visitor-pilot-review-missing'));
  assert.ok(readiness.blockers.includes('live-destination-projection-missing'));
  assert.ok(readiness.blockers.includes('live-event-selection-missing'));
  assert.ok(readiness.blockers.includes('live-food-selection-missing'));
  assert.ok(readiness.blockers.includes('booking-handoff-missing'));
  assert.ok(readiness.blockers.includes('routing-authority-missing'));
});

test('pilot review evidence can only be created from a complete supervised study report', () => {
  const evidence = pilotReview();
  assert.equal(evidence.participantSlots, 20);
  assert.equal(evidence.aggregateReports, 18);
  assert.equal(evidence.observerNotes, 20);
  assert.equal(evidence.representativeSurvey, false);

  const incomplete = {
    studyId: 'incomplete',
    completeForFirstReview: false,
    plannedParticipantSlots: 20,
    receivedAggregateReports: 1,
    receivedObserverNotes: 20,
    interpretation: {
      representativeSurvey: false
    }
  } as PilotStudyReport;

  assert.throws(
    () => createVisitorPilotReviewEvidence({
      report: incomplete,
      evidenceRef: 'evidence/incomplete.json',
      reviewedAt: '2026-09-28T09:30:00.000Z'
    }),
    /not complete/
  );
});

test('routing proof validates explicit ordered blocks and refuses overlap', () => {
  assert.deepEqual(
    validateDestinationDayRoutingProof(routingProof()),
    { valid: true, blockers: [] }
  );

  const invalid = routingProof();
  invalid.orderedBlocks[2]!.plannedStartAt = '2026-09-28T19:00:00.000Z';
  const validation = validateDestinationDayRoutingProof(invalid);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('journey-block-overlap:2'));
});

test('full destination day becomes ready only from verified heritage pilot live ingestion and routing evidence', () => {
  const projection = projectLiveDestinationFeed(
    liveFeed(),
    '2026-09-28T10:15:00.000Z'
  );

  const readiness = evaluateDestinationDayJourney({
    destinationPackage: moscowVarvarkaDestinationPackage,
    heritageRouteId: 'varvarka-45',
    spatialPackages: [
      fieldVerifiedPackage(
        'moscow-romanov-chambers-spatial-v1',
        'romanov-chambers'
      ),
      fieldVerifiedPackage(
        'moscow-old-english-court-spatial-v1',
        'old-english-court'
      )
    ],
    pilotReview: pilotReview(),
    liveProjection: projection,
    liveIngestionRecords: ingestionRecords(),
    selectedEventId: 'live-event',
    selectedFoodId: 'live-food',
    routingProof: routingProof(),
    now: '2026-09-28T10:15:00.000Z'
  });

  assert.equal(readiness.status, 'ready');
  if (readiness.status !== 'ready') return;

  assert.deepEqual(readiness.blockers, []);
  assert.deepEqual(readiness.proof.heritageSpatialPackageIds, [
    'moscow-romanov-chambers-spatial-v1',
    'moscow-old-english-court-spatial-v1'
  ]);
  assert.equal(readiness.proof.pilotStudyId, 'varvarka-real-study-01');
  assert.equal(readiness.proof.selectedEventId, 'live-event');
  assert.equal(readiness.proof.selectedFoodId, 'live-food');
  assert.equal(readiness.proof.bookingHandoffs.length, 1);
  assert.deepEqual(readiness.proof.liveProviderIds.sort(), ['city-live', 'tickets']);
  assert.deepEqual(readiness.proof.languages, ['ru', 'en', 'zh']);
  assert.equal(readiness.proof.offlineHeritage, true);
  assert.equal(readiness.proof.interpretation.representativeSurvey, false);
  assert.equal(readiness.proof.interpretation.livePriceAuthority, false);
});

test('routing cannot schedule a live entity after its evidence expires', () => {
  const feed = liveFeed();
  feed.entities[1]!.expiresAt = '2026-09-28T19:00:00.000Z';
  const projection = projectLiveDestinationFeed(
    feed,
    '2026-09-28T10:15:00.000Z'
  );

  const readiness = evaluateDestinationDayJourney({
    destinationPackage: moscowVarvarkaDestinationPackage,
    heritageRouteId: 'varvarka-45',
    spatialPackages: [
      fieldVerifiedPackage('moscow-romanov-chambers-spatial-v1', 'romanov-chambers'),
      fieldVerifiedPackage('moscow-old-english-court-spatial-v1', 'old-english-court')
    ],
    pilotReview: pilotReview(),
    liveProjection: projection,
    liveIngestionRecords: ingestionRecords(),
    selectedEventId: 'live-event',
    selectedFoodId: 'live-food',
    routingProof: routingProof(),
    now: '2026-09-28T10:15:00.000Z'
  });

  assert.equal(readiness.status, 'blocked');
  if (readiness.status !== 'blocked') return;
  assert.ok(readiness.blockers.includes('food-live-evidence-expires-before-visit'));
});

test('selected live entity requires ingestion evidence from its provider', () => {
  const projection = projectLiveDestinationFeed(
    liveFeed(),
    '2026-09-28T10:15:00.000Z'
  );

  const readiness = evaluateDestinationDayJourney({
    destinationPackage: moscowVarvarkaDestinationPackage,
    heritageRouteId: 'varvarka-45',
    spatialPackages: [
      fieldVerifiedPackage('moscow-romanov-chambers-spatial-v1', 'romanov-chambers'),
      fieldVerifiedPackage('moscow-old-english-court-spatial-v1', 'old-english-court')
    ],
    pilotReview: pilotReview(),
    liveProjection: projection,
    liveIngestionRecords: [],
    selectedEventId: 'live-event',
    selectedFoodId: 'live-food',
    routingProof: routingProof(),
    now: '2026-09-28T10:15:00.000Z'
  });

  assert.equal(readiness.status, 'blocked');
  if (readiness.status !== 'blocked') return;
  assert.ok(readiness.blockers.includes('live-provider-ingestion-evidence-missing:city-live'));
  assert.ok(readiness.blockers.includes('booking-provider-ingestion-evidence-missing:tickets'));
});
