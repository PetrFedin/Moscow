import type { PersonalTrip, PersonalTripItem } from './personalTrip.ts';
import { requireAdmittedDestination } from '../product/travelProductIdentity.ts';
import { canMoveTripStopBetweenDays, countsAsScheduledOccupancy, isActivePlannedTripStop } from './tripDayPresentation.ts';

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

function shiftedDayOffset(originalDay: string, targetDay: string): number {
  const source = Date.parse(originalDay + 'T12:00:00.000Z');
  const target = Date.parse(targetDay + 'T12:00:00.000Z');
  if (!Number.isFinite(source) || !Number.isFinite(target)) {
    throw new Error('Cannot move trip stop without valid source and target days');
  }
  const difference = (target - source) / 86_400_000;
  if (!Number.isInteger(difference)) throw new Error('Trip day shift must be a whole calendar day');
  return difference;
}

/** Preserve original relative date offsets for overnight flexible events. */
function shiftTimestampDays(value: string | undefined, dayOffset: number) {
  if (!value) return undefined;
  parseIso(value);
  const match = /^(\d{4}-\d{2}-\d{2})(T.*)$/.exec(value);
  if (!match?.[1] || !match[2]) {
    throw new Error('Cannot move a timestamp without a date-only prefix');
  }
  const date = new Date(match[1] + 'T12:00:00.000Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== match[1]) {
    throw new Error('Cannot move an invalid timestamp calendar date');
  }
  date.setUTCDate(date.getUTCDate() + dayOffset);
  const rebased = date.toISOString().slice(0, 10) + match[2];
  parseIso(rebased);
  return rebased;
}

function hasScheduledInterval(item: PersonalTripItem) {
  return countsAsScheduledOccupancy(item)
    && Boolean(item.plannedStartAt)
    && Boolean(item.plannedEndAt);
}

function isFixedCommitment(item: PersonalTripItem) {
  return isActivePlannedTripStop(item)
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
  // Tickets and reservations are attached to a real date/time. Their
  // metadata must never be rebased by an ordinary itinerary drag action.
  // Confirmed, held, cancelled and completed historic items all remain fixed.
  if (!canMoveTripStopBetweenDays(item)) {
    throw new Error('Booked or historic trip item cannot move without verified rescheduling');
  }

  const offsetDays = shiftedDayOffset(item.dayDate, input.targetDayDate);
  const rebasedStart = shiftTimestampDays(item.plannedStartAt, offsetDays);
  const rebasedEnd = shiftTimestampDays(item.plannedEndAt, offsetDays);
  if (rebasedStart && rebasedEnd && Date.parse(rebasedEnd) <= Date.parse(rebasedStart)) {
    throw new Error('Cannot move a trip item with an inverted time interval');
  }
  item.dayDate = input.targetDayDate;
  // Preserve JSON round-trip identity: an explicit undefined property disappears
  // during durable storage and can create false revision mismatches.
  delete item.displayOrder;
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

/**
 * The clock owns booking conflicts, not the calendar bucket where an item
 * was originally added. A 23:30 concert can overlap a 00:30 reservation on
 * the following trip day.
 */
function destinationDayAt(epoch: number, destinationId: string): string {
  const timezone = requireAdmittedDestination(destinationId).timezone;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date(epoch));
  const part = (type: string) => parts.find(value => value.type === type)?.value ?? '';
  return part('year') + '-' + part('month') + '-' + part('day');
}

/** Read-only warning candidates for a proposed time interval; no booking is changed. */
export function overlappingFixedCommitments(
  trip: PersonalTrip,
  proposedStartAt: string,
  proposedEndAt: string
): PersonalTripItem[] {
  const start = parseIso(proposedStartAt);
  const end = parseIso(proposedEndAt);
  if (end <= start) throw new Error('Proposed interval end must be after start');
  return trip.items
    .filter(isFixedCommitment)
    .filter(item => {
      const booked = interval(item);
      return booked.start < end && booked.end > start;
    })
    .sort((a, b) => itemStartTime(a) - itemStartTime(b) || a.id.localeCompare(b.id));
}

function itemStartTime(item: PersonalTripItem): number {
  return parseIso(item.plannedStartAt!);
}

export function detectTripScheduleConflicts(trip: PersonalTrip): TripScheduleConflict[] {
  const conflicts: TripScheduleConflict[] = [];
  const fixed = trip.items
    .filter(isFixedCommitment)
    .map(item => ({ item, ...interval(item) }))
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

      const overlapDay = destinationDayAt(overlapStart, trip.destinationId);
      conflicts.push({
        kind: 'fixed-commitment-overlap',
        // If an overlap spills beyond a trip's final day, keep it visible
        // on the originating trip day instead of making it disappear.
        dayDate: trip.days.includes(overlapDay) ? overlapDay : left.item.dayDate,
        itemIds: [left.item.id, right.item.id],
        overlapStartAt: new Date(overlapStart).toISOString(),
        overlapEndAt: new Date(overlapEnd).toISOString()
      });
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
    .filter(hasScheduledInterval)
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
