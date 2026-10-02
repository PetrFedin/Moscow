import {
  resolvePersonalTripPreferences,
  type PersonalTrip,
  type PersonalTripItem
} from './personalTrip.ts';

export const PERSONAL_TRIP_REPLAN_SCHEMA_VERSION = 1 as const;

export type PersonalTripReplanTrigger =
  | 'manual'
  | 'user-skipped'
  | 'fixed-cancelled'
  | 'schedule-conflict';

export type PersonalTripReplanPlacement = {
  itemId: string;
  previousStartAt?: string;
  previousEndAt?: string;
  proposedStartAt: string;
  proposedEndAt: string;
  durationMinutes: number;
  reason: 'existing-duration-fit';
};

export type PersonalTripReplanUnplaced = {
  itemId: string;
  reason: 'missing-duration' | 'no-schedule-window';
  action: 'unschedule';
};

export type PersonalTripReplanProposal = {
  schemaVersion: typeof PERSONAL_TRIP_REPLAN_SCHEMA_VERSION;
  id: string;
  tripId: string;
  baselineUpdatedAt: string;
  dayDate: string;
  createdAt: string;
  trigger: PersonalTripReplanTrigger;
  affectedItemId?: string;
  source: 'schedule-only';
  preservedFixedCommitments: Array<{
    itemId: string;
    startAt: string;
    endAt: string;
  }>;
  placements: PersonalTripReplanPlacement[];
  unplaced: PersonalTripReplanUnplaced[];
  inputSnapshot: {
    nowIso: string;
    dayStart: string;
    dayEnd: string;
    lunchWindow?: { start: string; end: string };
    pace: 'relaxed' | 'balanced' | 'intensive';
    priorityMode: 'must-see' | 'balanced' | 'discover-more';
    maxContinuousWalkingMinutes: number;
    stepFreeIntent: 'none' | 'preferred' | 'required';
  };
  assumptions: {
    routingVerified: false;
    openingHoursVerified: false;
    accessibilityVerified: false;
    weatherVerified: false;
  };
};

function parseIso(value: string, field = 'timestamp') {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${field}: ${value}`);
  return parsed;
}

function dayBoundary(dayDate: string, hhmm: string) {
  return `${dayDate}T${hhmm}:00+03:00`;
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
    ...(trip.preferences ? {
      preferences: {
        ...trip.preferences,
        ...(trip.preferences.lunchWindow
          ? { lunchWindow: { ...trip.preferences.lunchWindow } }
          : {})
      }
    } : {})
  };
}

function isFixedCommitment(item: PersonalTripItem) {
  return item.status === 'planned'
    && item.commitment?.status === 'confirmed'
    && Boolean(item.plannedStartAt)
    && Boolean(item.plannedEndAt);
}

function interval(item: PersonalTripItem) {
  if (!item.plannedStartAt || !item.plannedEndAt) return undefined;
  const start = parseIso(item.plannedStartAt, 'trip item start');
  const end = parseIso(item.plannedEndAt, 'trip item end');
  if (end <= start) throw new Error(`Invalid trip item interval: ${item.id}`);
  return { start, end };
}

function itemDurationMinutes(item: PersonalTripItem) {
  const value = interval(item);
  if (!value) return undefined;
  return Math.floor((value.end - value.start) / 60_000);
}

function mergeBusyIntervals(values: Array<{ start: number; end: number }>) {
  const sorted = values
    .filter((value) => value.end > value.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: Array<{ start: number; end: number }> = [];
  for (const current of sorted) {
    const last = merged[merged.length - 1];
    if (!last || current.start > last.end) {
      merged.push({ ...current });
    } else {
      last.end = Math.max(last.end, current.end);
    }
  }
  return merged;
}

function freeWindows(input: {
  start: number;
  end: number;
  busy: Array<{ start: number; end: number }>;
}) {
  const windows: Array<{ start: number; end: number; cursor: number }> = [];
  let cursor = input.start;
  for (const blocked of mergeBusyIntervals(input.busy)) {
    const start = Math.max(blocked.start, input.start);
    const end = Math.min(blocked.end, input.end);
    if (end <= input.start || start >= input.end) continue;
    if (start > cursor) windows.push({ start: cursor, end: start, cursor });
    cursor = Math.max(cursor, end);
  }
  if (cursor < input.end) windows.push({ start: cursor, end: input.end, cursor });
  return windows;
}

function itemSort(a: PersonalTripItem, b: PersonalTripItem) {
  const aOrder = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
  const bOrder = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
  if (aOrder !== bOrder) return aOrder - bOrder;
  const aStart = a.plannedStartAt ? parseIso(a.plannedStartAt) : Number.MAX_SAFE_INTEGER;
  const bStart = b.plannedStartAt ? parseIso(b.plannedStartAt) : Number.MAX_SAFE_INTEGER;
  return aStart - bStart || a.title.localeCompare(b.title, 'ru');
}

export function buildPersonalTripReplanProposal(input: {
  trip: PersonalTrip;
  proposalId: string;
  dayDate: string;
  nowIso: string;
  trigger: PersonalTripReplanTrigger;
  affectedItemId?: string;
}): PersonalTripReplanProposal {
  if (!input.proposalId.trim()) throw new Error('Replan proposal id is required');
  if (!input.trip.days.includes(input.dayDate)) throw new Error('Replan day is outside trip range');
  const now = parseIso(input.nowIso, 'replan now');
  if (input.affectedItemId && !input.trip.items.some((item) => item.id === input.affectedItemId)) {
    throw new Error(`Affected trip item not found: ${input.affectedItemId}`);
  }

  const preferences = resolvePersonalTripPreferences(input.trip);
  const dayStart = parseIso(dayBoundary(input.dayDate, preferences.dayStart), 'replan day start');
  const dayEnd = parseIso(dayBoundary(input.dayDate, preferences.dayEnd), 'replan day end');
  const effectiveStart = Math.min(dayEnd, Math.max(dayStart, now));

  const dayItems = input.trip.items.filter((item) => item.dayDate === input.dayDate);
  const fixed = dayItems
    .filter(isFixedCommitment)
    .map((item) => ({ item, interval: interval(item)! }))
    .sort((a, b) => a.interval.start - b.interval.start || a.item.id.localeCompare(b.item.id));

  const busy: Array<{ start: number; end: number }> = fixed.map(({ interval: value }) => value);
  if (preferences.lunchWindow) {
    busy.push({
      start: parseIso(dayBoundary(input.dayDate, preferences.lunchWindow.start), 'replan lunch start'),
      end: parseIso(dayBoundary(input.dayDate, preferences.lunchWindow.end), 'replan lunch end')
    });
  }

  const windows = freeWindows({
    start: effectiveStart,
    end: dayEnd,
    busy
  });

  const flexible = dayItems
    .filter((item) => item.status === 'planned')
    .filter((item) => !isFixedCommitment(item))
    .sort(itemSort);

  const placements: PersonalTripReplanPlacement[] = [];
  const unplaced: PersonalTripReplanUnplaced[] = [];

  for (const item of flexible) {
    const durationMinutes = itemDurationMinutes(item);
    if (!durationMinutes || durationMinutes <= 0) {
      unplaced.push({
        itemId: item.id,
        reason: 'missing-duration',
        action: 'unschedule'
      });
      continue;
    }

    const durationMs = durationMinutes * 60_000;
    let chosen: { start: number; end: number; cursor: number } | undefined;
    for (const window of windows) {
      if (window.cursor + durationMs <= window.end) {
        chosen = window;
        break;
      }
    }

    if (!chosen) {
      unplaced.push({
        itemId: item.id,
        reason: 'no-schedule-window',
        action: 'unschedule'
      });
      continue;
    }

    const proposedStart = chosen.cursor;
    const proposedEnd = proposedStart + durationMs;
    chosen.cursor = proposedEnd;

    placements.push({
      itemId: item.id,
      ...(item.plannedStartAt ? { previousStartAt: item.plannedStartAt } : {}),
      ...(item.plannedEndAt ? { previousEndAt: item.plannedEndAt } : {}),
      proposedStartAt: new Date(proposedStart).toISOString(),
      proposedEndAt: new Date(proposedEnd).toISOString(),
      durationMinutes,
      reason: 'existing-duration-fit'
    });
  }

  return {
    schemaVersion: PERSONAL_TRIP_REPLAN_SCHEMA_VERSION,
    id: input.proposalId,
    tripId: input.trip.id,
    baselineUpdatedAt: input.trip.updatedAt,
    dayDate: input.dayDate,
    createdAt: input.nowIso,
    trigger: input.trigger,
    ...(input.affectedItemId ? { affectedItemId: input.affectedItemId } : {}),
    source: 'schedule-only',
    preservedFixedCommitments: fixed.map(({ item }) => ({
      itemId: item.id,
      startAt: item.plannedStartAt!,
      endAt: item.plannedEndAt!
    })),
    placements,
    unplaced,
    inputSnapshot: {
      nowIso: input.nowIso,
      dayStart: preferences.dayStart,
      dayEnd: preferences.dayEnd,
      ...(preferences.lunchWindow ? { lunchWindow: { ...preferences.lunchWindow } } : {}),
      pace: preferences.pace,
      priorityMode: preferences.priorityMode,
      maxContinuousWalkingMinutes: preferences.maxContinuousWalkingMinutes,
      stepFreeIntent: preferences.stepFreeIntent
    },
    assumptions: {
      routingVerified: false,
      openingHoursVerified: false,
      accessibilityVerified: false,
      weatherVerified: false
    }
  };
}

function assertProposalAgainstTrip(trip: PersonalTrip, proposal: PersonalTripReplanProposal) {
  if (proposal.schemaVersion !== PERSONAL_TRIP_REPLAN_SCHEMA_VERSION) {
    throw new Error('Unsupported Personal Trip replan schema');
  }
  if (proposal.tripId !== trip.id) throw new Error('Replan proposal belongs to another trip');
  if (proposal.baselineUpdatedAt !== trip.updatedAt) {
    throw new Error('Replan proposal is stale for current trip');
  }
  if (!trip.days.includes(proposal.dayDate)) throw new Error('Replan proposal day is outside trip range');

  const currentFixed = trip.items
    .filter((item) => item.dayDate === proposal.dayDate)
    .filter(isFixedCommitment)
    .map((item) => ({
      itemId: item.id,
      startAt: item.plannedStartAt!,
      endAt: item.plannedEndAt!
    }))
    .sort((a, b) => a.itemId.localeCompare(b.itemId));
  const proposalFixed = proposal.preservedFixedCommitments
    .map((item) => ({ ...item }))
    .sort((a, b) => a.itemId.localeCompare(b.itemId));

  if (JSON.stringify(currentFixed) !== JSON.stringify(proposalFixed)) {
    throw new Error('Replan proposal does not preserve current fixed commitments');
  }

  const seen = new Set<string>();
  for (const placement of proposal.placements) {
    if (seen.has(placement.itemId)) throw new Error(`Duplicate replan item: ${placement.itemId}`);
    seen.add(placement.itemId);
    const item = trip.items.find((candidate) => candidate.id === placement.itemId);
    if (!item || item.dayDate !== proposal.dayDate) throw new Error(`Replan item not found in day: ${placement.itemId}`);
    if (item.status !== 'planned') throw new Error(`Replan item is not planned: ${placement.itemId}`);
    if (isFixedCommitment(item)) throw new Error(`Replan cannot move fixed commitment: ${placement.itemId}`);
    const start = parseIso(placement.proposedStartAt, 'replan proposed start');
    const end = parseIso(placement.proposedEndAt, 'replan proposed end');
    if (end <= start) throw new Error(`Invalid replan interval: ${placement.itemId}`);
    const minutes = Math.floor((end - start) / 60_000);
    if (minutes !== placement.durationMinutes) throw new Error(`Replan duration mismatch: ${placement.itemId}`);
  }

  for (const item of proposal.unplaced) {
    if (seen.has(item.itemId)) throw new Error(`Duplicate replan item: ${item.itemId}`);
    seen.add(item.itemId);
    const tripItem = trip.items.find((candidate) => candidate.id === item.itemId);
    if (!tripItem || tripItem.dayDate !== proposal.dayDate) throw new Error(`Unplaced item not found in day: ${item.itemId}`);
    if (isFixedCommitment(tripItem)) throw new Error(`Replan cannot unschedule fixed commitment: ${item.itemId}`);
  }

  const preferences = resolvePersonalTripPreferences(trip);
  const dayStart = parseIso(dayBoundary(proposal.dayDate, preferences.dayStart));
  const dayEnd = parseIso(dayBoundary(proposal.dayDate, preferences.dayEnd));
  const busy = currentFixed.map((item) => ({
    start: parseIso(item.startAt),
    end: parseIso(item.endAt),
    kind: 'fixed' as const
  }));
  if (preferences.lunchWindow) {
    busy.push({
      start: parseIso(dayBoundary(proposal.dayDate, preferences.lunchWindow.start)),
      end: parseIso(dayBoundary(proposal.dayDate, preferences.lunchWindow.end)),
      kind: 'fixed' as const
    });
  }

  const proposedIntervals = proposal.placements
    .map((placement) => ({
      itemId: placement.itemId,
      start: parseIso(placement.proposedStartAt),
      end: parseIso(placement.proposedEndAt)
    }))
    .sort((a, b) => a.start - b.start || a.itemId.localeCompare(b.itemId));

  for (const intervalValue of proposedIntervals) {
    if (intervalValue.start < dayStart || intervalValue.end > dayEnd) {
      throw new Error(`Replan interval outside day bounds: ${intervalValue.itemId}`);
    }
    for (const blocked of busy) {
      if (intervalValue.start < blocked.end && blocked.start < intervalValue.end) {
        throw new Error(`Replan interval overlaps fixed/reserved window: ${intervalValue.itemId}`);
      }
    }
  }
  for (let i = 1; i < proposedIntervals.length; i += 1) {
    const previous = proposedIntervals[i - 1]!;
    const current = proposedIntervals[i]!;
    if (current.start < previous.end) {
      throw new Error(`Replan placements overlap: ${previous.itemId} / ${current.itemId}`);
    }
  }
}

export function applyPersonalTripReplanProposal(input: {
  trip: PersonalTrip;
  proposal: PersonalTripReplanProposal;
  userAccepted: boolean;
  updatedAt: string;
}): PersonalTrip {
  if (!input.userAccepted) throw new Error('Replan proposal requires explicit user acceptance');
  parseIso(input.updatedAt, 'replan apply time');
  assertProposalAgainstTrip(input.trip, input.proposal);

  const next = cloneTrip(input.trip);
  const placementsById = new Map(input.proposal.placements.map((placement) => [placement.itemId, placement]));
  const unplacedIds = new Set(input.proposal.unplaced.map((item) => item.itemId));

  for (const item of next.items) {
    if (item.dayDate !== input.proposal.dayDate) continue;
    const placement = placementsById.get(item.id);
    if (placement) {
      item.plannedStartAt = placement.proposedStartAt;
      item.plannedEndAt = placement.proposedEndAt;
      continue;
    }
    if (unplacedIds.has(item.id)) {
      delete item.plannedStartAt;
      delete item.plannedEndAt;
      item.displayOrder = undefined;
    }
  }

  const dayItems = next.items
    .filter((item) => item.dayDate === input.proposal.dayDate)
    .filter((item) => item.status === 'planned')
    .sort((a, b) => {
      const aStart = a.plannedStartAt ? parseIso(a.plannedStartAt) : Number.MAX_SAFE_INTEGER;
      const bStart = b.plannedStartAt ? parseIso(b.plannedStartAt) : Number.MAX_SAFE_INTEGER;
      return aStart - bStart || a.title.localeCompare(b.title, 'ru');
    });
  dayItems.forEach((item, index) => {
    item.displayOrder = index;
  });

  next.updatedAt = input.updatedAt;
  return next;
}
