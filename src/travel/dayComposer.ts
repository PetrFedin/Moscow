import {
  personalTripDayItems,
  resolvePersonalTripPreferences,
  type PersonalTrip,
  type PersonalTripItem
} from './personalTrip.ts';
import {
  deriveTripFreeWindows,
  detectTripScheduleConflicts,
  type TripScheduleConflict
} from './tripScheduler.ts';
import {
  decideCitywideRouteFeasibility,
  type CitywideRouteFeasibility,
  type CitywideTravelMode,
  type projectCitywideRoutingFeed
} from './citywideRoutingAuthority.ts';
import type {
  LiveDestinationProjectionEntity,
  projectLiveDestinationFeed
} from './liveDestinationAuthority.ts';

export const DAY_COMPOSER_SCHEMA_VERSION = 1 as const;

export type DayComposerFlexibility = 'fixed' | 'flexible';
export type DayComposerCommitment = 'ticketed' | 'reserved' | 'none';
export type DayComposerVerification = 'provider-confirmed' | 'user-declared' | 'none';
export type DayComposerItemState = 'planned' | 'completed' | 'skipped' | 'cancelled';

export type DayComposerItemEntry = {
  type: 'item';
  id: string;
  itemId: string;
  title: string;
  kind: PersonalTripItem['kind'];
  startsAt?: string;
  endsAt?: string;
  flexibility: DayComposerFlexibility;
  commitment: DayComposerCommitment;
  verification: DayComposerVerification;
  state: DayComposerItemState;
  source: PersonalTripItem['source'];
  destinationNodeId?: string;
  liveTruth?: {
    freshness: LiveDestinationProjectionEntity['freshness'];
    operationalStatus: LiveDestinationProjectionEntity['operationalStatus'];
    openingState: LiveDestinationProjectionEntity['openingState'];
    nextOpeningChangeAt?: string;
    journeyEligible: boolean;
    providerId: string;
    providerName: string;
    sourceUrl: string;
    observedAt: string;
    expiresAt: string;
    evidenceMode?: 'live' | 'historical-evidence-replay';
    evidenceRef?: string;
  };
};

export type DayComposerFreeEntry = {
  type: 'free';
  id: string;
  startsAt: string;
  endsAt: string;
  minutes: number;
  routingVerified: false;
  alternativeEligible: true;
};

export type DayComposerConflictEntry = {
  type: 'conflict';
  id: string;
  itemIds: [string, string];
  startsAt: string;
  endsAt: string;
  minutes: number;
  reason: 'fixed-commitment-overlap';
};

export type DayComposerTravelEntry = {
  type: 'travel';
  id: string;
  fromItemId: string;
  toItemId: string;
  fromDestinationNodeId?: string;
  toDestinationNodeId?: string;
  startsAt: string;
  mustArriveBy: string;
  status: CitywideRouteFeasibility;
  availableMinutes: number;
  requiredTravelMinutes?: number;
  bufferMinutes?: number;
  mode?: CitywideTravelMode;
  routeObservationId?: string;
  providerId?: string;
  providerName?: string;
  sourceUrl?: string;
  observedAt?: string;
  expiresAt?: string;
  evidenceMode?: 'live' | 'historical-evidence-replay';
  evidenceRef?: string;
  routingVerified: boolean;
};

export type DayComposerTimelineEntry =
  | DayComposerItemEntry
  | DayComposerFreeEntry
  | DayComposerConflictEntry
  | DayComposerTravelEntry;

export type DayComposerAlternativeSlot = {
  id: string;
  dayDate: string;
  startsAt: string;
  endsAt: string;
  minutes: number;
  routingVerified: false;
  openingHoursVerified: false;
  availabilityVerified: false;
  accessibilityVerified: false;
};

export type DayComposerProjection = {
  schemaVersion: typeof DAY_COMPOSER_SCHEMA_VERSION;
  tripId: string;
  baselineUpdatedAt: string;
  dayDate: string;
  dayStart: string;
  dayEnd: string;
  items: DayComposerItemEntry[];
  freeWindows: DayComposerFreeEntry[];
  conflicts: DayComposerConflictEntry[];
  travel: DayComposerTravelEntry[];
  timeline: DayComposerTimelineEntry[];
  alternativeSlots: DayComposerAlternativeSlot[];
  counts: {
    fixed: number;
    flexible: number;
    ticketed: number;
    reserved: number;
    free: number;
    conflict: number;
    travel: number;
  };
  externalTruth: {
    routingVerified: boolean;
    openingHoursVerified: false;
    availabilityVerified: false;
    accessibilityVerified: false;
  };
};

function parseIso(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ISO timestamp: ${value}`);
  return parsed;
}

function dayBoundary(dayDate: string, hhmm: string) {
  return `${dayDate}T${hhmm}:00+03:00`;
}

function commitment(item: PersonalTripItem): DayComposerCommitment {
  if (!item.commitment || item.commitment.status === 'cancelled') return 'none';
  if (item.commitment.kind === 'ticket') return 'ticketed';
  if (item.commitment.kind === 'reservation') return 'reserved';
  return 'none';
}

function verification(item: PersonalTripItem): DayComposerVerification {
  if (!item.commitment || item.commitment.status === 'cancelled') return 'none';
  return item.commitment.verification;
}

function flexibility(item: PersonalTripItem): DayComposerFlexibility {
  return item.status === 'planned'
    && item.commitment?.status === 'confirmed'
    && Boolean(item.plannedStartAt)
    && Boolean(item.plannedEndAt)
    ? 'fixed'
    : 'flexible';
}

function projectItem(
  item: PersonalTripItem,
  liveById: Map<string, LiveDestinationProjectionEntity>
): DayComposerItemEntry {
  const live = item.destinationNodeId ? liveById.get(item.destinationNodeId) : undefined;
  return {
    type: 'item',
    id: `item:${item.id}`,
    itemId: item.id,
    title: item.title,
    kind: item.kind,
    ...(item.plannedStartAt ? { startsAt: item.plannedStartAt } : {}),
    ...(item.plannedEndAt ? { endsAt: item.plannedEndAt } : {}),
    flexibility: flexibility(item),
    commitment: commitment(item),
    verification: verification(item),
    state: item.status,
    source: item.source,
    ...(item.destinationNodeId ? { destinationNodeId: item.destinationNodeId } : {}),
    ...(live
      ? {
          liveTruth: {
            freshness: live.freshness,
            operationalStatus: live.operationalStatus,
            openingState: live.openingState,
            ...(live.nextOpeningChangeAt ? { nextOpeningChangeAt: live.nextOpeningChangeAt } : {}),
            journeyEligible: live.journeyEligible,
            providerId: live.providerId,
            providerName: live.providerName,
            sourceUrl: live.sourceUrl,
            observedAt: live.observedAt,
            expiresAt: live.expiresAt,
            ...(input.liveEvidenceContext
              ? {
                  evidenceMode: input.liveEvidenceContext.mode,
                  ...(input.liveEvidenceContext.evidenceRef
                    ? { evidenceRef: input.liveEvidenceContext.evidenceRef }
                    : {})
                }
              : {})
          }
        }
      : {})
  };
}

function conflictMinutes(conflict: TripScheduleConflict) {
  return Math.max(
    0,
    Math.floor((parseIso(conflict.overlapEndAt) - parseIso(conflict.overlapStartAt)) / 60_000)
  );
}

function timelineSort(a: DayComposerTimelineEntry, b: DayComposerTimelineEntry) {
  const start = (entry: DayComposerTimelineEntry) => {
    if (entry.type === 'item') return entry.startsAt ? parseIso(entry.startsAt) : Number.MAX_SAFE_INTEGER;
    return parseIso(entry.startsAt);
  };
  const rank = (entry: DayComposerTimelineEntry) =>
    entry.type === 'conflict'
      ? 0
      : entry.type === 'item'
        ? 1
        : entry.type === 'travel'
          ? 2
          : 3;
  return start(a) - start(b) || rank(a) - rank(b) || a.id.localeCompare(b.id);
}

export function buildDayComposerProjection(input: {
  trip: PersonalTrip;
  dayDate: string;
  minimumFreeMinutes?: number;
  routingProjection?: ReturnType<typeof projectCitywideRoutingFeed>;
  liveDestinationProjection?: ReturnType<typeof projectLiveDestinationFeed>;
  liveEvidenceContext?: {
    mode: 'live' | 'historical-evidence-replay';
    evidenceRef?: string;
  };
  routingEvidenceContext?: {
    mode: 'live' | 'historical-evidence-replay';
    evidenceRef?: string;
  };
  preferredTravelModes?: CitywideTravelMode[];
  safeTravelBufferMinutes?: number;
}): DayComposerProjection {
  if (!input.trip.days.includes(input.dayDate)) {
    throw new Error(`Date is outside trip range: ${input.dayDate}`);
  }

  const preferences = resolvePersonalTripPreferences(input.trip);
  const dayStart = dayBoundary(input.dayDate, preferences.dayStart);
  const dayEnd = dayBoundary(input.dayDate, preferences.dayEnd);

  const liveById = new Map<string, LiveDestinationProjectionEntity>();
  for (const entity of input.liveDestinationProjection?.entities ?? []) {
    liveById.set(entity.id, entity);
    if (entity.canonicalDestinationNodeId) {
      liveById.set(entity.canonicalDestinationNodeId, entity);
    }
  }
  const items = personalTripDayItems(input.trip, input.dayDate)
    .map((item) => projectItem(item, liveById));

  const freeWindows = deriveTripFreeWindows({
    trip: input.trip,
    dayDate: input.dayDate,
    dayStartsAt: dayStart,
    dayEndsAt: dayEnd,
    minimumMinutes: input.minimumFreeMinutes ?? 30,
    reservedWindows: preferences.lunchWindow
      ? [{
          startsAt: dayBoundary(input.dayDate, preferences.lunchWindow.start),
          endsAt: dayBoundary(input.dayDate, preferences.lunchWindow.end),
          reason: 'meal'
        }]
      : []
  }).map((window): DayComposerFreeEntry => ({
    type: 'free',
    id: `free:${window.startsAt}:${window.endsAt}`,
    startsAt: window.startsAt,
    endsAt: window.endsAt,
    minutes: window.minutes,
    routingVerified: false,
    alternativeEligible: true
  }));

  const conflicts = detectTripScheduleConflicts(input.trip)
    .filter((conflict) => conflict.dayDate === input.dayDate)
    .map((conflict): DayComposerConflictEntry => ({
      type: 'conflict',
      id: `conflict:${conflict.itemIds.join(':')}:${conflict.overlapStartAt}`,
      itemIds: conflict.itemIds,
      startsAt: conflict.overlapStartAt,
      endsAt: conflict.overlapEndAt,
      minutes: conflictMinutes(conflict),
      reason: conflict.kind
    }));

  const alternativeSlots = freeWindows.map((window): DayComposerAlternativeSlot => ({
    id: `alternative:${window.startsAt}:${window.endsAt}`,
    dayDate: input.dayDate,
    startsAt: window.startsAt,
    endsAt: window.endsAt,
    minutes: window.minutes,
    routingVerified: false,
    openingHoursVerified: false,
    availabilityVerified: false,
    accessibilityVerified: false
  }));

  const scheduledForTravel = items
    .filter((item) => item.state === 'planned' || item.state === 'completed')
    .filter((item) => Boolean(item.startsAt) && Boolean(item.endsAt))
    .sort((a, b) => parseIso(a.startsAt!) - parseIso(b.startsAt!) || a.itemId.localeCompare(b.itemId));

  const travel: DayComposerTravelEntry[] = [];
  for (let index = 0; index < scheduledForTravel.length - 1; index += 1) {
    const from = scheduledForTravel[index]!;
    const to = scheduledForTravel[index + 1]!;
    const startsAt = from.endsAt!;
    const mustArriveBy = to.startsAt!;
    if (parseIso(mustArriveBy) <= parseIso(startsAt)) continue;

    const base = {
      type: 'travel' as const,
      id: `travel:${from.itemId}:${to.itemId}`,
      fromItemId: from.itemId,
      toItemId: to.itemId,
      ...(from.destinationNodeId ? { fromDestinationNodeId: from.destinationNodeId } : {}),
      ...(to.destinationNodeId ? { toDestinationNodeId: to.destinationNodeId } : {}),
      startsAt,
      mustArriveBy
    };

    if (!input.routingProjection || !from.destinationNodeId || !to.destinationNodeId) {
      travel.push({
        ...base,
        status: 'unknown',
        availableMinutes: Math.floor((parseIso(mustArriveBy) - parseIso(startsAt)) / 60_000),
        routingVerified: false
      });
      continue;
    }

    const decision = decideCitywideRouteFeasibility({
      projection: input.routingProjection,
      fromId: from.destinationNodeId,
      toId: to.destinationNodeId,
      departureAt: startsAt,
      mustArriveBy,
      preferredModes: input.preferredTravelModes,
      safeBufferMinutes: input.safeTravelBufferMinutes
    });

    travel.push({
      ...base,
      status: decision.status,
      availableMinutes: decision.availableMinutes,
      ...(decision.requiredTravelMinutes !== undefined
        ? { requiredTravelMinutes: decision.requiredTravelMinutes }
        : {}),
      ...(decision.bufferMinutes !== undefined ? { bufferMinutes: decision.bufferMinutes } : {}),
      ...(decision.mode ? { mode: decision.mode } : {}),
      ...(decision.routeObservationId ? { routeObservationId: decision.routeObservationId } : {}),
      ...(decision.providerId ? { providerId: decision.providerId } : {}),
      ...(decision.providerName ? { providerName: decision.providerName } : {}),
      ...(decision.sourceUrl ? { sourceUrl: decision.sourceUrl } : {}),
      ...(decision.observedAt ? { observedAt: decision.observedAt } : {}),
      ...(decision.expiresAt ? { expiresAt: decision.expiresAt } : {}),
      ...(decision.status !== 'unknown'
        ? {
            evidenceMode: input.routingEvidenceContext?.mode ?? 'live',
            ...(input.routingEvidenceContext?.evidenceRef
              ? { evidenceRef: input.routingEvidenceContext.evidenceRef }
              : {})
          }
        : {}),
      routingVerified: decision.status !== 'unknown'
    });
  }

  return {
    schemaVersion: DAY_COMPOSER_SCHEMA_VERSION,
    tripId: input.trip.id,
    baselineUpdatedAt: input.trip.updatedAt,
    dayDate: input.dayDate,
    dayStart,
    dayEnd,
    items,
    freeWindows,
    conflicts,
    travel,
    timeline: [...items, ...freeWindows, ...conflicts, ...travel].sort(timelineSort),
    alternativeSlots,
    counts: {
      fixed: items.filter((item) => item.flexibility === 'fixed').length,
      flexible: items.filter((item) => item.flexibility === 'flexible').length,
      ticketed: items.filter((item) => item.commitment === 'ticketed').length,
      reserved: items.filter((item) => item.commitment === 'reserved').length,
      free: freeWindows.length,
      conflict: conflicts.length,
      travel: travel.length
    },
    externalTruth: {
      routingVerified: travel.length > 0 && travel.every((entry) => entry.routingVerified),
      openingHoursVerified:
        items.some((item) =>
          item.liveTruth?.freshness === 'fresh'
          && item.liveTruth.openingState !== 'unknown'
        ),
      availabilityVerified: false,
      accessibilityVerified: false
    }
  };
}
