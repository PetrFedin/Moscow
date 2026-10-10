import type { DayComposerProjection } from './dayComposer.ts';
import type { DayComposerDisruptionCase } from './dayComposerDisruption.ts';
import {
  decideCitywideRouteFeasibility,
  type CitywideRouteFeasibilityDecision,
  type CitywideTravelMode,
  type projectCitywideRoutingFeed
} from './citywideRoutingAuthority.ts';
import type {
  LiveDestinationProjectionEntity,
  projectLiveDestinationFeed
} from './liveDestinationAuthority.ts';
import type { PersonalTrip, PersonalTripItem } from './personalTrip.ts';

export const DAY_REPLACEMENT_PROPOSAL_SCHEMA_VERSION = 1 as const;

export type DayReplacementAdmission =
  | 'executable'
  | 'routing-unverified'
  | 'routing-impossible';

export type DayReplacementProposal = {
  schemaVersion: typeof DAY_REPLACEMENT_PROPOSAL_SCHEMA_VERSION;
  id: string;
  disruptionId: string;
  baselineUpdatedAt: string;
  affectedItemId: string;
  proposedStartAt: string;
  proposedEndAt: string;
  candidate: {
    entityId: string;
    destinationNodeId: string;
    title: string;
    kind: LiveDestinationProjectionEntity['kind'];
    providerId: string;
    providerName: string;
    sourceUrl: string;
    observedAt: string;
    expiresAt: string;
    operationalStatus: LiveDestinationProjectionEntity['operationalStatus'];
    openingState: LiveDestinationProjectionEntity['openingState'];
    evidenceRef: string;
  };
  inboundRoute?: CitywideRouteFeasibilityDecision;
  outboundRoute?: CitywideRouteFeasibilityDecision;
  admission: DayReplacementAdmission;
  routingVerified: boolean;
  preservesFixedCommitments: true;
};

export type DayReplacementProposalSet = {
  schemaVersion: typeof DAY_REPLACEMENT_PROPOSAL_SCHEMA_VERSION;
  disruptionId: string;
  baselineUpdatedAt: string;
  status: 'ready' | 'blocked';
  blocker?:
    | 'affected-item-fixed'
    | 'no-source-backed-candidates'
    | 'no-executable-candidates';
  proposals: DayReplacementProposal[];
};

export type DayReplacementAcceptanceReceipt = {
  schemaVersion: typeof DAY_REPLACEMENT_PROPOSAL_SCHEMA_VERSION;
  proposalId: string;
  disruptionId: string;
  acceptedAt: string;
  baselineUpdatedAt: string;
  affectedItemId: string;
  before: {
    title: string;
    kind: PersonalTripItem['kind'];
    destinationNodeId?: string;
    plannedStartAt?: string;
    plannedEndAt?: string;
  };
  after: {
    title: string;
    kind: PersonalTripItem['kind'];
    destinationNodeId: string;
    plannedStartAt: string;
    plannedEndAt: string;
  };
  sourceEvidenceRef: string;
  routeObservationIds: string[];
  fixedCommitmentsPreserved: true;
};

const CULTURE_KINDS = new Set([
  'heritage', 'historical-site', 'landmark', 'museum', 'gallery', 'exhibition'
]);
const PROGRAMME_KINDS = new Set([
  'event', 'theatre', 'cinema', 'concert', 'exhibition'
]);
const FOOD_KINDS = new Set([
  'restaurant', 'cafe', 'food', 'bar', 'nightlife', 'market'
]);
const OUTDOOR_KINDS = new Set([
  'nature', 'park', 'viewpoint', 'activity', 'sport', 'wellness', 'kids'
]);

function sameExperienceFamily(
  affectedKind: string,
  candidateKind: string
) {
  if (affectedKind === candidateKind) return true;
  for (const family of [CULTURE_KINDS, PROGRAMME_KINDS, FOOD_KINDS, OUTDOOR_KINDS]) {
    if (family.has(affectedKind) && family.has(candidateKind)) return true;
  }
  return false;
}

function sourceEvidenceRef(entity: LiveDestinationProjectionEntity) {
  return [
    'current-live-candidate',
    encodeURIComponent(entity.providerId),
    encodeURIComponent(entity.observedAt),
    encodeURIComponent(entity.sourceUrl)
  ].join(':');
}

function sortedScheduledItems(projection: DayComposerProjection) {
  return projection.items
    .filter((item) => item.startsAt && item.endsAt)
    .sort((a, b) =>
      Date.parse(a.startsAt!) - Date.parse(b.startsAt!)
      || a.itemId.localeCompare(b.itemId)
    );
}

function routeAdmission(
  decisions: Array<CitywideRouteFeasibilityDecision | undefined>
): DayReplacementAdmission {
  const required = decisions.filter((decision): decision is CitywideRouteFeasibilityDecision => Boolean(decision));
  if (required.some((decision) => decision.status === 'impossible')) return 'routing-impossible';
  if (required.some((decision) => decision.status === 'unknown')) return 'routing-unverified';
  return 'executable';
}

function routeFor(input: {
  routingProjection?: ReturnType<typeof projectCitywideRoutingFeed>;
  fromId?: string;
  toId?: string;
  departureAt?: string;
  mustArriveBy?: string;
  preferredModes?: CitywideTravelMode[];
  safeBufferMinutes?: number;
}) {
  if (
    !input.routingProjection
    || !input.fromId
    || !input.toId
    || !input.departureAt
    || !input.mustArriveBy
  ) {
    return undefined;
  }

  return decideCitywideRouteFeasibility({
    projection: input.routingProjection,
    fromId: input.fromId,
    toId: input.toId,
    departureAt: input.departureAt,
    mustArriveBy: input.mustArriveBy,
    ...(input.preferredModes ? { preferredModes: input.preferredModes } : {}),
    ...(input.safeBufferMinutes !== undefined
      ? { safeBufferMinutes: input.safeBufferMinutes }
      : {})
  });
}

function cloneTrip(trip: PersonalTrip): PersonalTrip {
  return {
    ...trip,
    days: [...trip.days],
    items: trip.items.map((item) => ({
      ...item,
      ...(item.commitment ? { commitment: { ...item.commitment } } : {})
    })),
    visits: trip.visits.map((visit) => ({ ...visit })),
    ...(trip.preferences
      ? {
          preferences: {
            ...trip.preferences,
            ...(trip.preferences.lunchWindow
              ? { lunchWindow: { ...trip.preferences.lunchWindow } }
              : {})
          }
        }
      : {})
  };
}

function assertFixedCommitmentsUnchanged(
  trip: PersonalTrip,
  disruption: DayComposerDisruptionCase
) {
  for (const fixed of disruption.preservedFixedCommitments) {
    const item = trip.items.find((candidate) => candidate.id === fixed.itemId);
    if (!item) throw new Error(`Preserved fixed commitment missing: ${fixed.itemId}`);
    if (
      item.plannedStartAt !== fixed.startsAt
      || item.plannedEndAt !== fixed.endsAt
      || !item.commitment
      || item.commitment.status !== 'confirmed'
      || (item.commitment.kind === 'ticket' ? 'ticketed' : 'reserved') !== fixed.commitment
      || item.commitment.verification !== fixed.verification
    ) {
      throw new Error(`Preserved fixed commitment changed: ${fixed.itemId}`);
    }
  }
}

export function buildDayReplacementProposals(input: {
  trip: PersonalTrip;
  dayProjection: DayComposerProjection;
  disruption: DayComposerDisruptionCase;
  liveProjection: ReturnType<typeof projectLiveDestinationFeed>;
  routingProjection?: ReturnType<typeof projectCitywideRoutingFeed>;
  preferredTravelModes?: CitywideTravelMode[];
  safeTravelBufferMinutes?: number;
}): DayReplacementProposalSet {
  if (input.trip.updatedAt !== input.disruption.baselineUpdatedAt) {
    throw new Error('Replacement proposal baseline is stale');
  }
  if (input.dayProjection.baselineUpdatedAt !== input.disruption.baselineUpdatedAt) {
    throw new Error('Day Composer baseline does not match disruption');
  }

  if (
    input.disruption.affectedItem.flexibility !== 'flexible'
    || input.disruption.affectedItem.commitment !== 'none'
  ) {
    return {
      schemaVersion: DAY_REPLACEMENT_PROPOSAL_SCHEMA_VERSION,
      disruptionId: input.disruption.id,
      baselineUpdatedAt: input.disruption.baselineUpdatedAt,
      status: 'blocked',
      blocker: 'affected-item-fixed',
      proposals: []
    };
  }

  const scheduled = sortedScheduledItems(input.dayProjection);
  const affectedIndex = scheduled.findIndex(
    (item) => item.itemId === input.disruption.affectedItem.itemId
  );
  const previous = affectedIndex > 0 ? scheduled[affectedIndex - 1] : undefined;
  const nextFixed = scheduled
    .slice(Math.max(0, affectedIndex + 1))
    .find((item) =>
      item.flexibility === 'fixed'
      && item.startsAt
      && Date.parse(item.startsAt) >= Date.parse(input.disruption.affectedItem.endsAt)
    );

  const occupiedNodeIds = new Set(
    input.dayProjection.items.flatMap((item) =>
      item.itemId !== input.disruption.affectedItem.itemId && item.destinationNodeId
        ? [item.destinationNodeId]
        : []
    )
  );

  const candidates = input.liveProjection.entities
    .filter((entity) =>
      entity.freshness === 'fresh'
      && entity.journeyEligible
      && Boolean(entity.canonicalDestinationNodeId)
      && entity.canonicalDestinationNodeId !== input.disruption.affectedItem.destinationNodeId
      && !occupiedNodeIds.has(entity.canonicalDestinationNodeId!)
      && sameExperienceFamily(
        input.dayProjection.items.find(
          (item) => item.itemId === input.disruption.affectedItem.itemId
        )?.kind ?? '',
        entity.kind
      )
    );

  if (candidates.length === 0) {
    return {
      schemaVersion: DAY_REPLACEMENT_PROPOSAL_SCHEMA_VERSION,
      disruptionId: input.disruption.id,
      baselineUpdatedAt: input.disruption.baselineUpdatedAt,
      status: 'blocked',
      blocker: 'no-source-backed-candidates',
      proposals: []
    };
  }

  const proposals = candidates.map((entity): DayReplacementProposal => {
    const destinationNodeId = entity.canonicalDestinationNodeId!;
    const inboundRoute = previous
      ? routeFor({
          routingProjection: input.routingProjection,
          fromId: previous.destinationNodeId,
          toId: destinationNodeId,
          departureAt: previous.endsAt,
          mustArriveBy: input.disruption.affectedItem.startsAt,
          preferredModes: input.preferredTravelModes,
          safeBufferMinutes: input.safeTravelBufferMinutes
        })
      : undefined;

    const outboundRoute = nextFixed
      ? routeFor({
          routingProjection: input.routingProjection,
          fromId: destinationNodeId,
          toId: nextFixed.destinationNodeId,
          departureAt: input.disruption.affectedItem.endsAt,
          mustArriveBy: nextFixed.startsAt,
          preferredModes: input.preferredTravelModes,
          safeBufferMinutes: input.safeTravelBufferMinutes
        })
      : undefined;

    const missingRequiredRoute =
      Boolean(previous && !inboundRoute)
      || Boolean(nextFixed && !outboundRoute);
    const admission = missingRequiredRoute
      ? 'routing-unverified'
      : routeAdmission([inboundRoute, outboundRoute]);

    return {
      schemaVersion: DAY_REPLACEMENT_PROPOSAL_SCHEMA_VERSION,
      id: `replacement:${input.disruption.id}:${destinationNodeId}`,
      disruptionId: input.disruption.id,
      baselineUpdatedAt: input.disruption.baselineUpdatedAt,
      affectedItemId: input.disruption.affectedItem.itemId,
      proposedStartAt: input.disruption.affectedItem.startsAt,
      proposedEndAt: input.disruption.affectedItem.endsAt,
      candidate: {
        entityId: entity.id,
        destinationNodeId,
        title: entity.titleRu,
        kind: entity.kind,
        providerId: entity.providerId,
        providerName: entity.providerName,
        sourceUrl: entity.sourceUrl,
        observedAt: entity.observedAt,
        expiresAt: entity.expiresAt,
        operationalStatus: entity.operationalStatus,
        openingState: entity.openingState,
        evidenceRef: sourceEvidenceRef(entity)
      },
      ...(inboundRoute ? { inboundRoute } : {}),
      ...(outboundRoute ? { outboundRoute } : {}),
      admission,
      routingVerified: admission === 'executable',
      preservesFixedCommitments: true
    };
  }).sort((a, b) => {
    const admissionOrder = {
      executable: 0,
      'routing-unverified': 1,
      'routing-impossible': 2
    } as const;
    return admissionOrder[a.admission] - admissionOrder[b.admission]
      || Number(b.candidate.kind === input.dayProjection.items.find(
        (item) => item.itemId === input.disruption.affectedItem.itemId
      )?.kind)
      - Number(a.candidate.kind === input.dayProjection.items.find(
        (item) => item.itemId === input.disruption.affectedItem.itemId
      )?.kind)
      || a.candidate.title.localeCompare(b.candidate.title, 'ru');
  });

  return {
    schemaVersion: DAY_REPLACEMENT_PROPOSAL_SCHEMA_VERSION,
    disruptionId: input.disruption.id,
    baselineUpdatedAt: input.disruption.baselineUpdatedAt,
    status: proposals.some((proposal) => proposal.admission === 'executable')
      ? 'ready'
      : 'blocked',
    ...(proposals.some((proposal) => proposal.admission === 'executable')
      ? {}
      : { blocker: 'no-executable-candidates' as const }),
    proposals
  };
}

export function acceptDayReplacementProposal(input: {
  trip: PersonalTrip;
  disruption: DayComposerDisruptionCase;
  proposal: DayReplacementProposal;
  acceptedAt: string;
}) {
  const acceptedAtMs = Date.parse(input.acceptedAt);
  if (!Number.isFinite(acceptedAtMs)) throw new Error('Replacement acceptance timestamp is invalid');
  if (input.proposal.admission !== 'executable' || !input.proposal.routingVerified) {
    throw new Error('Replacement proposal is not executable');
  }
  if (
    input.trip.updatedAt !== input.disruption.baselineUpdatedAt
    || input.proposal.baselineUpdatedAt !== input.disruption.baselineUpdatedAt
  ) {
    throw new Error('Replacement acceptance baseline is stale');
  }
  if (
    input.disruption.affectedItem.flexibility !== 'flexible'
    || input.disruption.affectedItem.commitment !== 'none'
  ) {
    throw new Error('Fixed affected item cannot be replaced by this flow');
  }

  assertFixedCommitmentsUnchanged(input.trip, input.disruption);

  const next = cloneTrip(input.trip);
  const item = next.items.find(
    (candidate) => candidate.id === input.disruption.affectedItem.itemId
  );
  if (!item) throw new Error('Affected trip item no longer exists');
  if (
    item.destinationNodeId !== input.disruption.affectedItem.destinationNodeId
    || item.plannedStartAt !== input.disruption.affectedItem.startsAt
    || item.plannedEndAt !== input.disruption.affectedItem.endsAt
    || item.status !== 'planned'
    || item.commitment
  ) {
    throw new Error('Affected trip item changed since disruption');
  }

  const before = {
    title: item.title,
    kind: item.kind,
    ...(item.destinationNodeId ? { destinationNodeId: item.destinationNodeId } : {}),
    ...(item.plannedStartAt ? { plannedStartAt: item.plannedStartAt } : {}),
    ...(item.plannedEndAt ? { plannedEndAt: item.plannedEndAt } : {})
  };

  item.title = input.proposal.candidate.title;
  item.kind = input.proposal.candidate.kind;
  item.source = 'provider';
  item.destinationNodeId = input.proposal.candidate.destinationNodeId;
  item.plannedStartAt = input.proposal.proposedStartAt;
  item.plannedEndAt = input.proposal.proposedEndAt;
  next.updatedAt = input.acceptedAt;

  assertFixedCommitmentsUnchanged(next, input.disruption);

  return {
    trip: next,
    receipt: {
      schemaVersion: DAY_REPLACEMENT_PROPOSAL_SCHEMA_VERSION,
      proposalId: input.proposal.id,
      disruptionId: input.disruption.id,
      acceptedAt: input.acceptedAt,
      baselineUpdatedAt: input.disruption.baselineUpdatedAt,
      affectedItemId: input.disruption.affectedItem.itemId,
      before,
      after: {
        title: item.title,
        kind: item.kind,
        destinationNodeId: item.destinationNodeId,
        plannedStartAt: item.plannedStartAt,
        plannedEndAt: item.plannedEndAt
      },
      sourceEvidenceRef: input.proposal.candidate.evidenceRef,
      routeObservationIds: [
        input.proposal.inboundRoute?.routeObservationId,
        input.proposal.outboundRoute?.routeObservationId
      ].filter((value): value is string => Boolean(value)),
      fixedCommitmentsPreserved: true as const
    } satisfies DayReplacementAcceptanceReceipt
  };
}
