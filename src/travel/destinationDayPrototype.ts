import {
  planDestinationJourney,
  type DestinationJourneyIntent
} from './destinationJourneyPlanner.ts';
import type {
  DestinationPackage,
  ExperienceNode
} from './destinationPackage.ts';
import type {
  LiveDestinationProjectionEntity
} from './liveDestinationAuthority.ts';

export type DestinationDaySlotKind =
  | 'heritage'
  | 'food'
  | 'event'
  | 'continue';

export type DestinationDaySlotStatus =
  | 'ready'
  | 'requires-live-provider'
  | 'requires-routing-authority';

export type DestinationDayLiveProjection = {
  destinationId: string;
  asOf: string;
  entities: LiveDestinationProjectionEntity[];
};

export type DestinationDaySlot = {
  id: string;
  kind: DestinationDaySlotKind;
  status: DestinationDaySlotStatus;
  durationMinutes?: number;
  routeId?: string;
  nodeIds?: string[];
  heritageNodes?: ExperienceNode[];
  liveEntity?: LiveDestinationProjectionEntity;
  reason?: string;
};

export type DestinationDayPlan = {
  destinationId: string;
  budgetMinutes: number;
  slots: DestinationDaySlot[];
  readySlotCount: number;
  unresolvedSlotCount: number;
  bookingHandoffs: Array<{
    slotId: string;
    entityId: string;
    providerId: string;
    action: string;
    url: string;
  }>;
  truthBoundary: string[];
};

function earliestEligible(
  entities: LiveDestinationProjectionEntity[],
  kind: LiveDestinationProjectionEntity['kind']
) {
  return entities
    .filter((entity) => entity.kind === kind && entity.journeyEligible)
    .sort((a, b) => {
      const aTime = a.startsAt ? Date.parse(a.startsAt) : Number.MAX_SAFE_INTEGER;
      const bTime = b.startsAt ? Date.parse(b.startsAt) : Number.MAX_SAFE_INTEGER;
      return aTime - bTime || a.titleRu.localeCompare(b.titleRu, 'ru');
    })[0];
}

function heritageSlot(
  pkg: DestinationPackage,
  budgetMinutes: number,
  themes: string[]
): DestinationDaySlot {
  const heritageBudget = Math.min(budgetMinutes, 120);
  const intent: DestinationJourneyIntent = {
    budgetMinutes: heritageBudget,
    themes,
    preferredKinds: ['heritage', 'museum']
  };
  const plan = planDestinationJourney(pkg, intent);

  if (plan.status === 'ready') {
    const byId = new Map(pkg.nodes.map((node) => [node.id, node]));
    return {
      id: 'history',
      kind: 'heritage',
      status: 'ready',
      durationMinutes: plan.estimatedMinutes,
      routeId: plan.routeId,
      nodeIds: [...plan.nodeIds],
      heritageNodes: plan.nodeIds
        .map((id) => byId.get(id))
        .filter((node): node is ExperienceNode => Boolean(node))
    };
  }

  return {
    id: 'history',
    kind: 'heritage',
    status: 'requires-routing-authority',
    nodeIds:
      plan.status === 'needs-routing-authority'
        ? [...plan.suggestedNodeIds]
        : [],
    reason: 'No published route satisfies the selected day budget.'
  };
}

function liveSlot(
  id: 'food' | 'event' | 'continue',
  kind: 'food' | 'event' | 'activity',
  live: DestinationDayLiveProjection | undefined
): DestinationDaySlot {
  if (!live) {
    return {
      id,
      kind: id,
      status: 'requires-live-provider',
      reason: 'No verified live provider projection is connected.'
    };
  }

  const entity = earliestEligible(live.entities, kind);
  if (!entity) {
    return {
      id,
      kind: id,
      status: 'requires-live-provider',
      reason: 'No fresh journey-eligible entity is available from the connected providers.'
    };
  }

  return {
    id,
    kind: id,
    status: 'ready',
    liveEntity: entity
  };
}

/**
 * Builds a truthful full-day prototype from two authorities:
 *
 * 1. DestinationPackage for published destination/history inventory.
 * 2. LiveDestinationProjection for fresh events/food/activities.
 *
 * Missing live data stays visibly unresolved. The function never invents a
 * restaurant, event, opening status, price, ticket or travel time.
 */
export function buildDestinationDayPrototype(input: {
  pkg: DestinationPackage;
  budgetMinutes: number;
  themes?: string[];
  live?: DestinationDayLiveProjection;
}): DestinationDayPlan {
  const { pkg, budgetMinutes, live } = input;
  if (!Number.isFinite(budgetMinutes) || budgetMinutes <= 0) {
    throw new Error('Destination day budget must be a positive number');
  }
  if (live && live.destinationId !== pkg.destination.id) {
    throw new Error('Live destination projection does not match destination package');
  }

  const slots: DestinationDaySlot[] = [
    heritageSlot(pkg, budgetMinutes, input.themes ?? ['история Москвы']),
    liveSlot('food', 'food', live),
    liveSlot('event', 'event', live),
    liveSlot('continue', 'activity', live)
  ];

  const bookingHandoffs = slots.flatMap((slot) => {
    const entity = slot.liveEntity;
    if (!entity?.booking) return [];
    return [{
      slotId: slot.id,
      entityId: entity.id,
      providerId: entity.booking.providerId,
      action: entity.booking.action,
      url: entity.booking.url
    }];
  });

  return {
    destinationId: pkg.destination.id,
    budgetMinutes,
    slots,
    readySlotCount: slots.filter((slot) => slot.status === 'ready').length,
    unresolvedSlotCount: slots.filter((slot) => slot.status !== 'ready').length,
    bookingHandoffs,
    truthBoundary: [
      'Published heritage routes come only from DestinationPackage authority.',
      'Food, events and activities appear only from fresh journey-eligible live provider data.',
      'Booking appears only when a fresh verified booking handoff exists.',
      'The prototype does not synthesize travel time, prices, availability or opening status.'
    ]
  };
}
