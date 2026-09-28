import {
  validateDestinationPackage,
  type DestinationPackage,
  type ExperienceNode
} from './destinationPackage.ts';
import type {
  LiveDestinationProjectionEntity
} from './liveDestinationAuthority.ts';
import {
  projectLiveDestinationFeed
} from './liveDestinationAuthority.ts';
import type {
  LiveProviderIngestionRecord
} from './liveProviderIngestion.ts';
import {
  validatePublishedSpatialPackage,
  type PublishedSpatialPackage
} from '../spatial/publishedSpatialPackage.ts';
import type { PilotStudyReport } from '../analytics/pilotStudy.ts';

export type LiveDestinationProjection =
  ReturnType<typeof projectLiveDestinationFeed>;

export type VisitorPilotReviewEvidence = {
  studyId: string;
  evidenceRef: string;
  reviewedAt: string;
  participantSlots: number;
  aggregateReports: number;
  observerNotes: number;
  representativeSurvey: false;
};

export type DestinationDayJourneyRef =
  | {
      authority: 'destination-route';
      id: string;
    }
  | {
      authority: 'live-destination';
      id: string;
    };

export type DestinationDayRoutingBlock = {
  ref: DestinationDayJourneyRef;
  plannedStartAt: string;
  plannedEndAt: string;
};

export type DestinationDayRoutingProof = {
  schemaVersion: 1;
  id: string;
  provider: string;
  sourceUrl: string;
  generatedAt: string;
  expiresAt: string;
  journeyStartsAt: string;
  journeyEndsAt: string;
  orderedBlocks: DestinationDayRoutingBlock[];
};

export type DestinationDayJourneyInput = {
  destinationPackage: DestinationPackage;
  heritageRouteId: string;
  spatialPackages: PublishedSpatialPackage[];
  pilotReview?: VisitorPilotReviewEvidence;
  liveProjection?: LiveDestinationProjection;
  liveIngestionRecords?: LiveProviderIngestionRecord[];
  selectedEventId?: string;
  selectedFoodId?: string;
  routingProof?: DestinationDayRoutingProof;
  now: string;
};

export type DestinationDayJourneyProof = {
  status: 'ready';
  destinationId: string;
  heritageRouteId: string;
  heritageSpatialPackageIds: string[];
  pilotStudyId: string;
  pilotEvidenceRef: string;
  liveProviderIds: string[];
  selectedEventId: string;
  selectedFoodId: string;
  bookingHandoffs: Array<{
    liveEntityId: string;
    providerId: string;
    provider: string;
    action: string;
    url: string;
    expiresAt: string;
  }>;
  routingProofId: string;
  routingProvider: string;
  routingProofExpiresAt: string;
  journeyStartsAt: string;
  journeyEndsAt: string;
  languages: ['ru', 'en', 'zh'];
  offlineHeritage: true;
  interpretation: {
    representativeSurvey: false;
    livePriceAuthority: false;
    inventoryCountAuthority: false;
  };
};

export type DestinationDayJourneyReadiness =
  | {
      status: 'blocked';
      destinationId: string;
      blockers: string[];
      warnings: string[];
    }
  | {
      status: 'ready';
      destinationId: string;
      blockers: [];
      warnings: string[];
      proof: DestinationDayJourneyProof;
    };

function isText(value: string | undefined) {
  return Boolean(value?.trim());
}

function iso(value: string | undefined) {
  if (!value?.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isHttps(value: string) {
  return /^https:\/\//i.test(value);
}

function refKey(ref: DestinationDayJourneyRef) {
  return `${ref.authority}:${ref.id}`;
}

export function createVisitorPilotReviewEvidence(input: {
  report: PilotStudyReport;
  evidenceRef: string;
  reviewedAt: string;
}): VisitorPilotReviewEvidence {
  const { report } = input;
  if (!report.completeForFirstReview) {
    throw new Error('Visitor pilot report is not complete for first review');
  }
  if (report.plannedParticipantSlots < 20 || report.plannedParticipantSlots > 50) {
    throw new Error('Visitor pilot participant slots must remain within the supervised 20-50 protocol');
  }
  if (report.receivedAggregateReports < 1) {
    throw new Error('Visitor pilot requires at least one aggregate app report');
  }
  if (report.receivedObserverNotes !== report.plannedParticipantSlots) {
    throw new Error('Visitor pilot requires one observer note per planned participant slot');
  }
  if (report.interpretation.representativeSurvey !== false) {
    throw new Error('Visitor pilot must not be promoted to a representative survey');
  }
  if (!input.evidenceRef.trim()) throw new Error('Visitor pilot evidence reference is required');
  if (iso(input.reviewedAt) === null) throw new Error('Visitor pilot reviewedAt must be a valid ISO timestamp');

  return {
    studyId: report.studyId,
    evidenceRef: input.evidenceRef.trim(),
    reviewedAt: input.reviewedAt,
    participantSlots: report.plannedParticipantSlots,
    aggregateReports: report.receivedAggregateReports,
    observerNotes: report.receivedObserverNotes,
    representativeSurvey: false
  };
}

export function validateDestinationDayRoutingProof(
  proof: DestinationDayRoutingProof
) {
  const blockers: string[] = [];
  if (proof.schemaVersion !== 1) blockers.push('routing-proof-version-invalid');
  if (!proof.id.trim()) blockers.push('routing-proof-id-missing');
  if (!proof.provider.trim()) blockers.push('routing-provider-missing');
  if (!isHttps(proof.sourceUrl)) blockers.push('routing-source-url-invalid');

  const generatedAt = iso(proof.generatedAt);
  const expiresAt = iso(proof.expiresAt);
  const journeyStartsAt = iso(proof.journeyStartsAt);
  const journeyEndsAt = iso(proof.journeyEndsAt);

  if (generatedAt === null) blockers.push('routing-generated-at-invalid');
  if (expiresAt === null) blockers.push('routing-expires-at-invalid');
  if (generatedAt !== null && expiresAt !== null && expiresAt <= generatedAt) {
    blockers.push('routing-validity-window-invalid');
  }
  if (journeyStartsAt === null) blockers.push('journey-start-invalid');
  if (journeyEndsAt === null) blockers.push('journey-end-invalid');
  if (journeyStartsAt !== null && journeyEndsAt !== null && journeyEndsAt <= journeyStartsAt) {
    blockers.push('journey-window-invalid');
  }
  if (proof.orderedBlocks.length < 3) blockers.push('journey-blocks-insufficient');

  const refs = new Set<string>();
  let previousEnd = -Infinity;
  for (const [index, block] of proof.orderedBlocks.entries()) {
    if (
      block.ref.authority !== 'destination-route'
      && block.ref.authority !== 'live-destination'
    ) {
      blockers.push(`journey-block-authority-invalid:${index}`);
    }
    if (!block.ref.id.trim()) blockers.push(`journey-block-id-missing:${index}`);
    const key = refKey(block.ref);
    if (refs.has(key)) blockers.push(`journey-block-duplicate:${key}`);
    refs.add(key);

    const starts = iso(block.plannedStartAt);
    const ends = iso(block.plannedEndAt);
    if (starts === null || ends === null) {
      blockers.push(`journey-block-time-invalid:${index}`);
      continue;
    }
    if (ends <= starts) blockers.push(`journey-block-window-invalid:${index}`);
    if (starts < previousEnd) blockers.push(`journey-block-overlap:${index}`);
    previousEnd = Math.max(previousEnd, ends);

    if (
      journeyStartsAt !== null
      && journeyEndsAt !== null
      && (starts < journeyStartsAt || ends > journeyEndsAt)
    ) {
      blockers.push(`journey-block-outside-window:${index}`);
    }
  }

  return { valid: blockers.length === 0, blockers: [...new Set(blockers)] };
}

function liveEntity(
  projection: LiveDestinationProjection | undefined,
  id: string | undefined
) {
  if (!projection || !id) return undefined;
  return projection.entities.find((entity) => entity.id === id);
}

function validLiveProviderRecords(
  projection: LiveDestinationProjection | undefined,
  records: LiveProviderIngestionRecord[] | undefined,
  nowMs: number
) {
  if (!projection || !records) return new Map<string, LiveProviderIngestionRecord>();
  const map = new Map<string, LiveProviderIngestionRecord>();
  for (const record of records) {
    const normalizedAt = Date.parse(record.normalizedAt);
    if (
      record.destinationId === projection.destinationId
      && Number.isFinite(normalizedAt)
      && normalizedAt <= nowMs
      && (record.snapshotFreshness === 'fresh' || record.snapshotFreshness === 'refresh-due')
    ) {
      map.set(record.providerId, record);
    }
  }
  return map;
}

function fieldVerifiedSpatialById(packages: PublishedSpatialPackage[]) {
  const result = new Map<string, PublishedSpatialPackage>();
  for (const pkg of packages) {
    const validation = validatePublishedSpatialPackage(pkg);
    if (
      validation.valid
      && validation.publishable
      && pkg.releaseState === 'field-verified'
      && pkg.languages.includes('ru')
      && pkg.languages.includes('en')
      && pkg.languages.includes('zh')
      && pkg.offlineEligible
    ) {
      result.set(pkg.id, pkg);
    }
  }
  return result;
}

function findBlock(
  proof: DestinationDayRoutingProof | undefined,
  ref: DestinationDayJourneyRef
) {
  return proof?.orderedBlocks.find((block) =>
    block.ref.authority === ref.authority && block.ref.id === ref.id
  );
}

function liveEntityValidAtPlannedBlock(
  entity: LiveDestinationProjectionEntity,
  block: DestinationDayRoutingBlock | undefined
) {
  if (!block) return false;
  const plannedStart = Date.parse(block.plannedStartAt);
  const observedAt = Date.parse(entity.observedAt);
  const expiresAt = Date.parse(entity.expiresAt);
  return Number.isFinite(plannedStart)
    && plannedStart >= observedAt
    && plannedStart < expiresAt;
}

export function evaluateDestinationDayJourney(
  input: DestinationDayJourneyInput
): DestinationDayJourneyReadiness {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const destinationValidation = validateDestinationPackage(input.destinationPackage);

  if (!destinationValidation.valid) blockers.push('destination-package-invalid');
  if (!destinationValidation.publishable) blockers.push('destination-package-not-publishable');
  if (
    !input.destinationPackage.languages.includes('ru')
    || !input.destinationPackage.languages.includes('en')
    || !input.destinationPackage.languages.includes('zh')
  ) {
    blockers.push('destination-languages-incomplete');
  }
  if (!input.destinationPackage.offlineEligible) blockers.push('heritage-offline-not-supported');

  const route = input.destinationPackage.routes.find(
    (candidate) => candidate.id === input.heritageRouteId
  );
  if (!route) blockers.push('heritage-route-not-found');

  const nodesById = new Map(
    input.destinationPackage.nodes.map((node) => [node.id, node])
  );
  const routeNodes = route
    ? route.nodeIds
        .map((id) => nodesById.get(id))
        .filter((node): node is ExperienceNode => Boolean(node))
    : [];

  if (route && routeNodes.length !== route.nodeIds.length) {
    blockers.push('heritage-route-node-missing');
  }
  if (!routeNodes.some((node) => node.kind === 'heritage' || node.kind === 'museum')) {
    blockers.push('heritage-route-has-no-heritage');
  }

  const verifiedSpatial = fieldVerifiedSpatialById(input.spatialPackages);
  const boundSpatialIds = routeNodes
    .map((node) => node.heritagePackageId)
    .filter((id): id is string => Boolean(id));

  if (boundSpatialIds.length === 0) {
    blockers.push('heritage-route-has-no-spatial-package');
  }
  for (const packageId of boundSpatialIds) {
    if (!verifiedSpatial.has(packageId)) {
      blockers.push(`heritage-package-not-field-verified:${packageId}`);
    }
  }

  const nowMs = Date.parse(input.now);
  if (!Number.isFinite(nowMs)) blockers.push('journey-now-invalid');

  if (!input.pilotReview) {
    blockers.push('visitor-pilot-review-missing');
  } else if (
    input.pilotReview.participantSlots < 20
    || input.pilotReview.participantSlots > 50
    || input.pilotReview.aggregateReports < 1
    || input.pilotReview.observerNotes !== input.pilotReview.participantSlots
    || input.pilotReview.representativeSurvey !== false
    || !isText(input.pilotReview.evidenceRef)
    || iso(input.pilotReview.reviewedAt) === null
  ) {
    blockers.push('visitor-pilot-review-invalid');
  } else if (
    Number.isFinite(nowMs)
    && Date.parse(input.pilotReview.reviewedAt) > nowMs
  ) {
    blockers.push('visitor-pilot-review-from-future');
  }

  if (!input.liveProjection) {
    blockers.push('live-destination-projection-missing');
  } else if (input.liveProjection.destinationId !== input.destinationPackage.destination.id) {
    blockers.push('live-destination-mismatch');
  }

  const event = liveEntity(input.liveProjection, input.selectedEventId);
  const food = liveEntity(input.liveProjection, input.selectedFoodId);

  if (!input.selectedEventId) blockers.push('live-event-selection-missing');
  else if (!event || event.kind !== 'event') blockers.push('live-event-not-found');
  else if (!event.journeyEligible || event.freshness !== 'fresh') blockers.push('live-event-not-eligible');

  if (!input.selectedFoodId) blockers.push('live-food-selection-missing');
  else if (!food || food.kind !== 'food') blockers.push('live-food-not-found');
  else if (!food.journeyEligible || food.freshness !== 'fresh') blockers.push('live-food-not-eligible');

  const providerRecords = validLiveProviderRecords(
    input.liveProjection,
    input.liveIngestionRecords,
    nowMs
  );
  for (const entity of [event, food].filter(
    (value): value is LiveDestinationProjectionEntity => Boolean(value)
  )) {
    if (!providerRecords.has(entity.providerId)) {
      blockers.push(`live-provider-ingestion-evidence-missing:${entity.providerId}`);
    }
    if (entity.booking && !providerRecords.has(entity.booking.providerId)) {
      blockers.push(`booking-provider-ingestion-evidence-missing:${entity.booking.providerId}`);
    }
  }

  const bookings = [event, food]
    .filter((value): value is LiveDestinationProjectionEntity => Boolean(value))
    .filter((entity) => Boolean(entity.booking))
    .map((entity) => ({ entity, booking: entity.booking! }));

  if (bookings.length === 0) blockers.push('booking-handoff-missing');

  if (!input.routingProof) {
    blockers.push('routing-authority-missing');
  } else {
    const routingValidation = validateDestinationDayRoutingProof(input.routingProof);
    for (const blocker of routingValidation.blockers) blockers.push(blocker);

    const generatedAt = Date.parse(input.routingProof.generatedAt);
    const expiresAt = Date.parse(input.routingProof.expiresAt);
    if (Number.isFinite(nowMs)) {
      if (generatedAt > nowMs) blockers.push('routing-proof-from-future');
      if (expiresAt <= nowMs) blockers.push('routing-proof-stale');
    }

    if (
      !findBlock(input.routingProof, {
        authority: 'destination-route',
        id: input.heritageRouteId
      })
    ) {
      blockers.push('routing-proof-missing-heritage-route');
    }

    if (event) {
      const block = findBlock(input.routingProof, {
        authority: 'live-destination',
        id: event.id
      });
      if (!block) {
        blockers.push('routing-proof-missing-event');
      } else {
        if (!liveEntityValidAtPlannedBlock(event, block)) {
          blockers.push('event-live-evidence-expires-before-visit');
        }
        if (event.startsAt) {
          const eventStartsAt = Date.parse(event.startsAt);
          const blockStart = Date.parse(block.plannedStartAt);
          const blockEnd = Date.parse(block.plannedEndAt);
          if (
            !Number.isFinite(eventStartsAt)
            || eventStartsAt < blockStart
            || eventStartsAt >= blockEnd
          ) {
            blockers.push('event-start-outside-routing-block');
          }
        }
      }
    }

    if (food) {
      const block = findBlock(input.routingProof, {
        authority: 'live-destination',
        id: food.id
      });
      if (!block) {
        blockers.push('routing-proof-missing-food');
      } else if (!liveEntityValidAtPlannedBlock(food, block)) {
        blockers.push('food-live-evidence-expires-before-visit');
      }
    }
  }

  if (blockers.length > 0) {
    return {
      status: 'blocked',
      destinationId: input.destinationPackage.destination.id,
      blockers: [...new Set(blockers)],
      warnings
    };
  }

  const proof = input.routingProof!;
  const eventReady = event!;
  const foodReady = food!;
  const pilot = input.pilotReview!;

  return {
    status: 'ready',
    destinationId: input.destinationPackage.destination.id,
    blockers: [],
    warnings,
    proof: {
      status: 'ready',
      destinationId: input.destinationPackage.destination.id,
      heritageRouteId: input.heritageRouteId,
      heritageSpatialPackageIds: boundSpatialIds,
      pilotStudyId: pilot.studyId,
      pilotEvidenceRef: pilot.evidenceRef,
      liveProviderIds: [...new Set(
        [eventReady.providerId, foodReady.providerId, ...bookings.map((item) => item.booking.providerId)]
      )],
      selectedEventId: eventReady.id,
      selectedFoodId: foodReady.id,
      bookingHandoffs: bookings.map(({ entity, booking }) => ({
        liveEntityId: entity.id,
        providerId: booking.providerId,
        provider: booking.provider,
        action: booking.action,
        url: booking.url,
        expiresAt: booking.expiresAt
      })),
      routingProofId: proof.id,
      routingProvider: proof.provider,
      routingProofExpiresAt: proof.expiresAt,
      journeyStartsAt: proof.journeyStartsAt,
      journeyEndsAt: proof.journeyEndsAt,
      languages: ['ru', 'en', 'zh'],
      offlineHeritage: true,
      interpretation: {
        representativeSurvey: false,
        livePriceAuthority: false,
        inventoryCountAuthority: false
      }
    }
  };
}
