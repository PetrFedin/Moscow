import type { PersonalTrip } from './personalTrip.ts';

/**
 * Local traveler notes about contacting a ticket/reservation supplier.
 * NOT a provider ticket, refund, consent receipt or proof of communication.
 *
 * Cases are append-only per event. The original commitment is NEVER mutated
 * by this workflow. Any real reschedule/refund remains a provider action.
 */
export const BOOKING_RESOLUTION_MAX_CASES = 40;
export const BOOKING_RESOLUTION_MAX_EVENTS = 12;
export const BOOKING_RESOLUTION_MAX_NOTE = 800;

export type BookingResolutionTopic =
  | 'change-date'
  | 'cancel-refund'
  | 'venue-unavailable'
  | 'other';

export type BookingResolutionEvent = Readonly<{
  id: string;
  at: string;
  kind: 'opened' | 'contact-self-reported' | 'reply-self-reported' | 'archived';
  /** Plain user-authored text, not independent supplier evidence. */
  note?: string;
}>;

export type BookingResolutionCase = Readonly<{
  id: string;
  itemId: string;
  topic: BookingResolutionTopic;
  events: readonly BookingResolutionEvent[];
}>;

const topics: readonly BookingResolutionTopic[] = [
  'change-date', 'cancel-refund', 'venue-unavailable', 'other'
];
const kinds: readonly BookingResolutionEvent['kind'][] = [
  'opened', 'contact-self-reported', 'reply-self-reported', 'archived'
];

function nonempty(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

function exactTime(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

export function validateBookingResolutions(trip: PersonalTrip): void {
  const list: unknown = trip.bookingResolutions;
  if (list === undefined) return;
  if (!Array.isArray(list) || list.length > BOOKING_RESOLUTION_MAX_CASES) {
    throw new Error('Invalid booking resolution case collection');
  }

  const caseIds = new Set<string>();
  const allEventIds = new Set<string>();
  const openItemIds = new Set<string>();
  for (const candidate of list) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      throw new Error('Invalid booking resolution case');
    }
    const entry = candidate as Partial<BookingResolutionCase>;
    if (!Object.keys(entry).every(key => ['id', 'itemId', 'topic', 'events'].includes(key))) {
      throw new Error('Unsupported booking case fields');
    }
    if (!nonempty(entry.id, 120) || caseIds.has(entry.id)
      || !nonempty(entry.itemId, 120)
      || !trip.items.some(item => item.id === entry.itemId && item.commitment)
      || !topics.includes(entry.topic as BookingResolutionTopic)
      || !Array.isArray(entry.events) || entry.events.length < 1
      || entry.events.length > BOOKING_RESOLUTION_MAX_EVENTS) {
      throw new Error('Invalid booking resolution case identity or item');
    }
    caseIds.add(entry.id);

    let lastTime = -Infinity;
    let archived = false;
    for (let i = 0; i < entry.events.length; i++) {
      const event = entry.events[i] as Partial<BookingResolutionEvent>;
      if (event && typeof event === 'object' && !Array.isArray(event)
        && !Object.keys(event).every(key => ['id', 'at', 'kind', 'note'].includes(key))) {
        throw new Error('Unsupported booking event fields');
      }
      if (!event || typeof event !== 'object' || Array.isArray(event)
        || !nonempty(event.id, 120) || allEventIds.has(event.id)
        || !exactTime(event.at)
        || !kinds.includes(event.kind as BookingResolutionEvent['kind'])
        || (i === 0 && event.kind !== 'opened')
        || (i > 0 && event.kind === 'opened')
        || archived) {
        throw new Error('Invalid booking resolution event');
      }
      allEventIds.add(event.id);
      const clock = Date.parse(event.at);
      if (clock < lastTime) throw new Error('Booking resolution events are not chronological');
      lastTime = clock;
      if (event.kind === 'reply-self-reported') {
        if (!nonempty(event.note, BOOKING_RESOLUTION_MAX_NOTE)) {
          throw new Error('User reply note is required and must be short');
        }
      } else if (event.note !== undefined) {
        throw new Error('Booking resolution contact/open/close events cannot carry notes');
      }
      if (event.kind === 'archived') archived = true;
    }

    if (!archived) {
      if (openItemIds.has(entry.itemId)) throw new Error('Multiple open booking cases for one item');
      openItemIds.add(entry.itemId);
    }
  }
}

export function latestBookingResolution(trip: PersonalTrip, itemId: string): BookingResolutionCase | undefined {
  return [...(trip.bookingResolutions ?? [])].reverse().find(item => item.itemId === itemId);
}

export function bookingResolutionIsOpen(caseRecord: BookingResolutionCase): boolean {
  return caseRecord.events[caseRecord.events.length - 1]?.kind !== 'archived';
}

export function beginBookingResolution(input: {
  trip: PersonalTrip;
  itemId: string;
  topic: BookingResolutionTopic;
  caseId: string;
  eventId: string;
  at: string;
}): PersonalTrip {
  validateBookingResolutions(input.trip);
  if (!topics.includes(input.topic)
    || !nonempty(input.caseId, 120) || !nonempty(input.eventId, 120)
    || !exactTime(input.at)) {
    throw new Error('Invalid booking resolution request');
  }
  const target = input.trip.items.find(item => item.id === input.itemId && item.commitment);
  if (!target) throw new Error('Booking resolution requires an existing ticket or reservation');
  const previous = latestBookingResolution(input.trip, target.id);
  if (previous && bookingResolutionIsOpen(previous)) {
    throw new Error('Resolve or archive the existing local booking case first');
  }
  const changed: PersonalTrip = {
    ...input.trip,
    updatedAt: input.at,
    bookingResolutions: [
      ...(input.trip.bookingResolutions ?? []),
      { id: input.caseId, itemId: target.id, topic: input.topic, events: [
        { id: input.eventId, at: input.at, kind: 'opened' }
      ] }
    ]
  };
  validateBookingResolutions(changed);
  return changed;
}

function appendEvent(input: {
  trip: PersonalTrip;
  caseId: string;
  eventId: string;
  at: string;
  kind: 'contact-self-reported' | 'reply-self-reported' | 'archived';
  note?: string;
}): PersonalTrip {
  validateBookingResolutions(input.trip);
  if (!nonempty(input.caseId, 120) || !nonempty(input.eventId, 120)
    || !exactTime(input.at)) throw new Error('Invalid booking resolution event input');
  const record = input.trip.bookingResolutions?.find(c => c.id === input.caseId);
  if (!record) throw new Error('Booking resolution case not found');
  if (!bookingResolutionIsOpen(record)) throw new Error('Booking resolution is already archived');
  const next: BookingResolutionEvent = {
    id: input.eventId, at: input.at, kind: input.kind,
    ...(input.note !== undefined ? { note: input.note.trim() } : {})
  };
  const changed: PersonalTrip = {
    ...input.trip,
    updatedAt: input.at,
    bookingResolutions: input.trip.bookingResolutions!.map(c =>
      c.id === record.id ? { ...c, events: [...c.events, next] } : c
    )
  };
  validateBookingResolutions(changed);
  return changed;
}

/** User clicked "I contacted the supplier"; opening a link does not call this. */
export function noteBookingContact(input: {
  trip: PersonalTrip; caseId: string; eventId: string; at: string;
}): PersonalTrip {
  return appendEvent({ ...input, kind: 'contact-self-reported' });
}

/** Stores ONLY what the traveler says they were told; never upgrades verification. */
export function noteBookingResponse(input: {
  trip: PersonalTrip; caseId: string; eventId: string; at: string; note: string;
}): PersonalTrip {
  return appendEvent({ ...input, kind: 'reply-self-reported', note: input.note });
}

/** Close the local to-do; does not cancel, refund, or move the actual ticket. */
export function archiveBookingResolution(input: {
  trip: PersonalTrip; caseId: string; eventId: string; at: string;
}): PersonalTrip {
  return appendEvent({ ...input, kind: 'archived' });
}
