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

export type DayComposerTimelineEntry =
  | DayComposerItemEntry
  | DayComposerFreeEntry
  | DayComposerConflictEntry;

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
  timeline: DayComposerTimelineEntry[];
  alternativeSlots: DayComposerAlternativeSlot[];
  counts: {
    fixed: number;
    flexible: number;
    ticketed: number;
    reserved: number;
    free: number;
    conflict: number;
  };
  externalTruth: {
    routingVerified: false;
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

function projectItem(item: PersonalTripItem): DayComposerItemEntry {
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
    ...(item.destinationNodeId ? { destinationNodeId: item.destinationNodeId } : {})
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
    entry.type === 'conflict' ? 0 : entry.type === 'item' ? 1 : 2;
  return start(a) - start(b) || rank(a) - rank(b) || a.id.localeCompare(b.id);
}

export function buildDayComposerProjection(input: {
  trip: PersonalTrip;
  dayDate: string;
  minimumFreeMinutes?: number;
}): DayComposerProjection {
  if (!input.trip.days.includes(input.dayDate)) {
    throw new Error(`Date is outside trip range: ${input.dayDate}`);
  }

  const preferences = resolvePersonalTripPreferences(input.trip);
  const dayStart = dayBoundary(input.dayDate, preferences.dayStart);
  const dayEnd = dayBoundary(input.dayDate, preferences.dayEnd);

  const items = personalTripDayItems(input.trip, input.dayDate).map(projectItem);

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
    timeline: [...items, ...freeWindows, ...conflicts].sort(timelineSort),
    alternativeSlots,
    counts: {
      fixed: items.filter((item) => item.flexibility === 'fixed').length,
      flexible: items.filter((item) => item.flexibility === 'flexible').length,
      ticketed: items.filter((item) => item.commitment === 'ticketed').length,
      reserved: items.filter((item) => item.commitment === 'reserved').length,
      free: freeWindows.length,
      conflict: conflicts.length
    },
    externalTruth: {
      routingVerified: false,
      openingHoursVerified: false,
      availabilityVerified: false,
      accessibilityVerified: false
    }
  };
}
