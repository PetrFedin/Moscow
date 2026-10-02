import type { PersonalTrip, PersonalTripItem } from './personalTrip.ts';

export type TripScheduleConflict = {
  kind: 'fixed-commitment-overlap';
  dayDate: string;
  itemIds: [string, string];
  overlapStartAt: string;
  overlapEndAt: string;
};

export type TripFreeWindow = {
  dayDate: string;
  startsAt: string;
  endsAt: string;
  minutes: number;
  routingVerified: false;
};

export type TripReservedWindow = {
  startsAt: string;
  endsAt: string;
  reason: 'meal' | 'rest' | 'preference';
};

function parseIso(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ISO timestamp: ${value}`);
  return parsed;
}

function cloneTrip(trip: PersonalTrip): PersonalTrip {
  return {
    ...trip,
    days: [...trip.days],
    items: trip.items.map((item) => ({
      ...item,
      ...(item.commitment ? { commitment: { ...item.commitment } } : {})
    })),
    visits: trip.visits.map((visit) => ({ ...visit }))
  };
}

function assertDay(trip: PersonalTrip, dayDate: string) {
  if (!trip.days.includes(dayDate)) throw new Error(`Date is outside trip range: ${dayDate}`);
}

function rebaseTimestampDay(value: string | undefined, dayDate: string) {
  if (!value) return undefined;
  parseIso(value);
  const match = /^\d{4}-\d{2}-\d{2}(T.*)$/.exec(value);
  if (!match?.[1]) throw new Error(`Cannot move timestamp without date-only prefix: ${value}`);
  const rebased = `${dayDate}${match[1]}`;
  parseIso(rebased);
  return rebased;
}

function hasScheduledInterval(item: PersonalTripItem) {
  return item.status !== 'cancelled'
    && item.status !== 'skipped'
    && Boolean(item.plannedStartAt)
    && Boolean(item.plannedEndAt);
}

function isFixedCommitment(item: PersonalTripItem) {
  return item.status === 'planned'
    && item.commitment?.status === 'confirmed'
    && hasScheduledInterval(item);
}

function interval(item: PersonalTripItem) {
  if (!item.plannedStartAt || !item.plannedEndAt) {
    throw new Error(`Item does not have a complete fixed interval: ${item.id}`);
  }
  const start = parseIso(item.plannedStartAt);
  const end = parseIso(item.plannedEndAt);
  if (end <= start) throw new Error(`Invalid trip item interval: ${item.id}`);
  return { start, end };
}

export function moveTripItem(input: {
  trip: PersonalTrip;
  itemId: string;
  targetDayDate: string;
  updatedAt: string;
}): PersonalTrip {
  assertDay(input.trip, input.targetDayDate);
  parseIso(input.updatedAt);

  const next = cloneTrip(input.trip);
  const item = next.items.find((candidate) => candidate.id === input.itemId);
  if (!item) throw new Error(`Trip item not found: ${input.itemId}`);

  if (next.visits.some((visit) => visit.itemId === item.id)) {
    throw new Error('Visited trip item cannot move between days');
  }

  if (item.dayDate === input.targetDayDate) return next;

  item.dayDate = input.targetDayDate;
  item.displayOrder = undefined;

  const rebasedStart = rebaseTimestampDay(item.plannedStartAt, input.targetDayDate);
  const rebasedEnd = rebaseTimestampDay(item.plannedEndAt, input.targetDayDate);
  if (rebasedStart) item.plannedStartAt = rebasedStart;
  if (rebasedEnd) item.plannedEndAt = rebasedEnd;

  next.updatedAt = input.updatedAt;
  return next;
}

export function reorderTripDayItems(input: {
  trip: PersonalTrip;
  dayDate: string;
  orderedItemIds: string[];
  updatedAt: string;
}): PersonalTrip {
  assertDay(input.trip, input.dayDate);
  parseIso(input.updatedAt);

  const dayItems = input.trip.items.filter((item) => item.dayDate === input.dayDate);
  const expected = new Set(dayItems.map((item) => item.id));
  const supplied = new Set(input.orderedItemIds);

  if (input.orderedItemIds.length !== dayItems.length || supplied.size !== input.orderedItemIds.length) {
    throw new Error('Reorder must contain each day item exactly once');
  }
  for (const id of expected) {
    if (!supplied.has(id)) throw new Error(`Reorder is missing day item: ${id}`);
  }
  for (const id of supplied) {
    if (!expected.has(id)) throw new Error(`Reorder contains item from another day or unknown item: ${id}`);
  }

  const order = new Map(input.orderedItemIds.map((id, index) => [id, index]));
  const next = cloneTrip(input.trip);
  for (const item of next.items) {
    if (item.dayDate !== input.dayDate) continue;
    item.displayOrder = order.get(item.id);
  }
  next.updatedAt = input.updatedAt;
  return next;
}

export function detectTripScheduleConflicts(trip: PersonalTrip): TripScheduleConflict[] {
  const conflicts: TripScheduleConflict[] = [];

  for (const dayDate of trip.days) {
    const fixed = trip.items
      .filter((item) => item.dayDate === dayDate && isFixedCommitment(item))
      .map((item) => ({ item, ...interval(item) }))
      .sort((a, b) => a.start - b.start || a.item.id.localeCompare(b.item.id));

    for (let i = 0; i < fixed.length; i += 1) {
      const left = fixed[i];
      if (!left) continue;
      for (let j = i + 1; j < fixed.length; j += 1) {
        const right = fixed[j];
        if (!right) continue;
        if (right.start >= left.end) break;

        const overlapStart = Math.max(left.start, right.start);
        const overlapEnd = Math.min(left.end, right.end);
        if (overlapEnd <= overlapStart) continue;

        conflicts.push({
          kind: 'fixed-commitment-overlap',
          dayDate,
          itemIds: [left.item.id, right.item.id],
          overlapStartAt: new Date(overlapStart).toISOString(),
          overlapEndAt: new Date(overlapEnd).toISOString()
        });
      }
    }
  }

  return conflicts;
}

export function deriveTripFreeWindows(input: {
  trip: PersonalTrip;
  dayDate: string;
  dayStartsAt: string;
  dayEndsAt: string;
  minimumMinutes?: number;
  reservedWindows?: TripReservedWindow[];
}): TripFreeWindow[] {
  assertDay(input.trip, input.dayDate);
  const dayStart = parseIso(input.dayStartsAt);
  const dayEnd = parseIso(input.dayEndsAt);
  if (dayEnd <= dayStart) throw new Error('Day window end must be after start');

  const minimumMinutes = input.minimumMinutes ?? 30;
  if (!Number.isFinite(minimumMinutes) || minimumMinutes < 0) {
    throw new Error('Minimum free-window minutes must be non-negative');
  }

  const itemIntervals = input.trip.items
    .filter((item) => item.dayDate === input.dayDate && hasScheduledInterval(item))
    .map((item) => interval(item));

  const reservedIntervals = (input.reservedWindows ?? []).map((window) => {
    const start = parseIso(window.startsAt);
    const end = parseIso(window.endsAt);
    if (end <= start) throw new Error('Reserved window end must be after start');
    return { start, end };
  });

  const fixedIntervals = [...itemIntervals, ...reservedIntervals]
    .map(({ start, end }) => ({
      start: Math.max(start, dayStart),
      end: Math.min(end, dayEnd)
    }))
    .filter(({ start, end }) => end > start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const merged: Array<{ start: number; end: number }> = [];
  for (const current of fixedIntervals) {
    const last = merged[merged.length - 1];
    if (!last || current.start > last.end) {
      merged.push({ ...current });
    } else {
      last.end = Math.max(last.end, current.end);
    }
  }

  const windows: TripFreeWindow[] = [];
  let cursor = dayStart;

  const pushWindow = (start: number, end: number) => {
    const minutes = Math.floor((end - start) / 60_000);
    if (minutes < minimumMinutes) return;
    windows.push({
      dayDate: input.dayDate,
      startsAt: new Date(start).toISOString(),
      endsAt: new Date(end).toISOString(),
      minutes,
      routingVerified: false
    });
  };

  for (const busy of merged) {
    if (busy.start > cursor) pushWindow(cursor, busy.start);
    cursor = Math.max(cursor, busy.end);
  }
  if (cursor < dayEnd) pushWindow(cursor, dayEnd);

  return windows;
}

export function tripFixedCommitmentIds(trip: PersonalTrip, dayDate: string) {
  assertDay(trip, dayDate);
  return trip.items
    .filter((item) => item.dayDate === dayDate && isFixedCommitment(item))
    .map((item) => item.id);
}
