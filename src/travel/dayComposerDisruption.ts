import type {
  DayComposerItemEntry,
  DayComposerProjection
} from './dayComposer.ts';
import {
  applyJourneyRuntimeEvent,
  createDestinationJourneyRuntime,
  type DestinationJourneyRuntime,
  type JourneyBlockKind
} from './destinationJourneyRuntime.ts';

export const DAY_COMPOSER_DISRUPTION_SCHEMA_VERSION = 1 as const;

export type DayComposerDisruptionReason =
  | 'closed'
  | 'cancelled'
  | 'rescheduled'
  | 'stale';

export type DayComposerPreservedCommitment = {
  itemId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  commitment: 'ticketed' | 'reserved';
  verification: 'provider-confirmed' | 'user-declared' | 'none';
};

export type DayComposerDisruptionCase = {
  schemaVersion: typeof DAY_COMPOSER_DISRUPTION_SCHEMA_VERSION;
  id: string;
  tripId: string;
  baselineUpdatedAt: string;
  dayDate: string;
  affectedItem: {
    itemId: string;
    title: string;
    destinationNodeId: string;
    startsAt: string;
    endsAt: string;
    flexibility: DayComposerItemEntry['flexibility'];
    commitment: DayComposerItemEntry['commitment'];
    verification: DayComposerItemEntry['verification'];
  };
  disruption: {
    reason: DayComposerDisruptionReason;
    providerId: string;
    providerName: string;
    sourceUrl: string;
    observedAt: string;
    expiresAt: string;
    evidenceRef: string;
  };
  preservedFixedCommitments: DayComposerPreservedCommitment[];
  runtime: DestinationJourneyRuntime;
};

function disruptionReason(item: DayComposerItemEntry): DayComposerDisruptionReason | undefined {
  const live = item.liveTruth;
  if (!live) return undefined;
  if (live.freshness !== 'fresh') return 'stale';
  if (live.operationalStatus === 'closed' || live.operationalStatus === 'temporarily-closed') {
    return 'closed';
  }
  if (live.operationalStatus === 'cancelled') return 'cancelled';
  if (live.operationalStatus === 'rescheduled') return 'rescheduled';
  return undefined;
}

function journeyKind(item: DayComposerItemEntry): JourneyBlockKind {
  switch (item.kind) {
    case 'museum':
    case 'gallery':
    case 'exhibition':
      return 'museum';
    case 'restaurant':
    case 'cafe':
    case 'food':
      return 'food';
    case 'bar':
    case 'nightlife':
      return 'evening';
    case 'event':
    case 'theatre':
    case 'cinema':
    case 'concert':
      return 'event';
    default:
      return 'heritage';
  }
}

function evidenceRef(item: DayComposerItemEntry) {
  const live = item.liveTruth;
  if (!live) throw new Error('Live disruption requires current live truth');
  if (live.evidenceRef?.trim()) return live.evidenceRef;

  return [
    'current-live',
    encodeURIComponent(live.providerId),
    encodeURIComponent(live.observedAt),
    encodeURIComponent(live.sourceUrl)
  ].join(':');
}

function preservedCommitments(
  projection: DayComposerProjection,
  affectedItemId: string
): DayComposerPreservedCommitment[] {
  return projection.items.flatMap((item): DayComposerPreservedCommitment[] => {
    if (
      item.itemId === affectedItemId
      || item.flexibility !== 'fixed'
      || item.commitment === 'none'
      || !item.startsAt
      || !item.endsAt
    ) {
      return [];
    }

    return [{
      itemId: item.itemId,
      title: item.title,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      commitment: item.commitment,
      verification: item.verification
    }];
  });
}

export function buildDayComposerDisruptionCases(
  projection: DayComposerProjection
): DayComposerDisruptionCase[] {
  return projection.items.flatMap((item): DayComposerDisruptionCase[] => {
    const reason = disruptionReason(item);
    const live = item.liveTruth;
    if (
      !reason
      || !live
      || item.state !== 'planned'
      || !item.destinationNodeId
      || !item.startsAt
      || !item.endsAt
    ) {
      return [];
    }

    const ref = evidenceRef(item);
    let runtime = createDestinationJourneyRuntime({
      journeyId: `day-composer:${projection.tripId}:${projection.dayDate}:${item.itemId}`,
      destinationId: 'moscow',
      createdAt: live.observedAt,
      blocks: [{
        id: `trip-item:${item.itemId}`,
        kind: journeyKind(item),
        title: item.title,
        plannedStartAt: item.startsAt,
        plannedEndAt: item.endsAt,
        authority: {
          kind: 'live-destination',
          entityId: item.destinationNodeId,
          providerId: live.providerId,
          evidenceRef: ref
        },
        status: 'planned'
      }]
    });

    runtime = applyJourneyRuntimeEvent(runtime, {
      type: 'provider-invalidated',
      blockId: `trip-item:${item.itemId}`,
      reason,
      evidenceRef: ref,
      at: live.observedAt
    });

    if (runtime.state !== 'replan-required') {
      throw new Error(`Live disruption did not enter replan-required: ${item.itemId}`);
    }

    return [{
      schemaVersion: DAY_COMPOSER_DISRUPTION_SCHEMA_VERSION,
      id: `day-disruption:${projection.tripId}:${projection.dayDate}:${item.itemId}:${reason}`,
      tripId: projection.tripId,
      baselineUpdatedAt: projection.baselineUpdatedAt,
      dayDate: projection.dayDate,
      affectedItem: {
        itemId: item.itemId,
        title: item.title,
        destinationNodeId: item.destinationNodeId,
        startsAt: item.startsAt,
        endsAt: item.endsAt,
        flexibility: item.flexibility,
        commitment: item.commitment,
        verification: item.verification
      },
      disruption: {
        reason,
        providerId: live.providerId,
        providerName: live.providerName,
        sourceUrl: live.sourceUrl,
        observedAt: live.observedAt,
        expiresAt: live.expiresAt,
        evidenceRef: ref
      },
      preservedFixedCommitments: preservedCommitments(projection, item.itemId),
      runtime
    }];
  });
}
