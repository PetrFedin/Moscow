import type { DestinationPackage, ExperienceNode, ExperienceNodeKind } from './destinationPackage.ts';
import type { StepFreeIntent } from './accessibilityRouteProfile.ts';
import type { DayReplacementAcceptanceReceipt } from './dayReplacementProposal.ts';
import type { CuratedMoscowPlace } from './curatedMoscowPlaces.ts';
import { displayedUpcomingCommitments, isActivePlannedTripStop } from './tripDayPresentation.ts';
import { validateBookingResolutions, type BookingResolutionCase } from './bookingResolution.ts';

export const PERSONAL_TRIP_SCHEMA_VERSION = 1 as const;

export type PersonalTripItemKind = ExperienceNodeKind;

export type PersonalTripItemSource = 'destination-package' | 'manual' | 'provider';

export type PersonalTripCommitment = {
  kind: 'ticket' | 'reservation';
  status: 'held' | 'confirmed' | 'cancelled';
  verification: 'user-declared' | 'provider-confirmed';
  provider?: string;
  reference?: string;
  partySize?: number;
  seats?: string;
  address?: string;
  sourceRef?: string;
  externalUrl?: string;
  receiptEvidenceRef?: string;
};

export type PersonalTripItem = {
  id: string;
  dayDate: string;
  title: string;
  kind: PersonalTripItemKind;
  source: PersonalTripItemSource;
  destinationNodeId?: string;
  /** Canonical ID of a user-selected editorial venue; not a reservation. */
  catalogPlaceId?: string;
  officialSourceUrl?: string;
  /** User-imported calendar UID for local deduplication, not provider proof. */
  calendarImportKey?: string;
  plannedStartAt?: string;
  plannedEndAt?: string;
  status: 'planned' | 'completed' | 'skipped' | 'cancelled';
  displayOrder?: number;
  commitment?: PersonalTripCommitment;
  note?: string;
};

export type PersonalTripVisit = {
  id: string;
  visitedAt: string;
  dayDate: string;
  title: string;
  kind?: PersonalTripItemKind;
  itemId?: string;
  destinationNodeId?: string;
  evidence: 'user-confirmed' | 'route-completed' | 'provider-receipt' | 'proximity';
  evidenceRef?: string;
  /** Private local-first note entered voluntarily by the traveler. */
  note?: string;
};

export type TripPace = 'relaxed' | 'balanced' | 'intensive';
export type TripPriorityMode = 'must-see' | 'balanced' | 'discover-more';

export type TripLunchWindow = {
  start: string;
  end: string;
};

export type PersonalTripPreferences = {
  stepFreeIntent?: StepFreeIntent;
  pace?: TripPace;
  dayStart?: string;
  dayEnd?: string;
  maxContinuousWalkingMinutes?: number;
  lunchWindow?: TripLunchWindow;
  priorityMode?: TripPriorityMode;
};

export type ResolvedPersonalTripPreferences = {
  stepFreeIntent: StepFreeIntent;
  pace: TripPace;
  dayStart: string;
  dayEnd: string;
  maxContinuousWalkingMinutes: number;
  lunchWindow?: TripLunchWindow;
  priorityMode: TripPriorityMode;
};

export const DEFAULT_PERSONAL_TRIP_PREFERENCES: ResolvedPersonalTripPreferences = {
  stepFreeIntent: 'none',
  pace: 'balanced',
  dayStart: '09:00',
  dayEnd: '23:00',
  maxContinuousWalkingMinutes: 60,
  priorityMode: 'balanced'
};

export type PersonalTrip = {
  schemaVersion: typeof PERSONAL_TRIP_SCHEMA_VERSION;
  id: string;
  destinationId: string;
  title: string;
  startDate: string;
  endDate: string;
  days: string[];
  items: PersonalTripItem[];
  visits: PersonalTripVisit[];
  preferences?: PersonalTripPreferences;
  /** Locally append-only user acceptance records, persisted in the same trip snapshot. */
  replacementReceipts?: DayReplacementAcceptanceReceipt[];
  /** Private traveler-authored contact notes; not a change to the provider booking. */
  bookingResolutions?: BookingResolutionCase[];
  createdAt: string;
  updatedAt: string;
};

export type PersonalTripSummary = {
  dayCount: number;
  plannedCount: number;
  commitmentCount: number;
  completedCount: number;
  visitedCount: number;
};

function isDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function parseIso(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ISO timestamp: ${value}`);
  return parsed;
}

function assertDateOnly(value: string, field: string) {
  if (!isDateOnly(value)) throw new Error(`Invalid ${field}: ${value}`);
}

function enumerateDates(startDate: string, endDate: string) {
  assertDateOnly(startDate, 'trip start date');
  assertDateOnly(endDate, 'trip end date');
  const start = Date.parse(`${startDate}T00:00:00.000Z`);
  const end = Date.parse(`${endDate}T00:00:00.000Z`);
  if (end < start) throw new Error('Trip end date cannot be before start date');

  const days: string[] = [];
  for (let cursor = start; cursor <= end; cursor += 86_400_000) {
    days.push(new Date(cursor).toISOString().slice(0, 10));
    if (days.length > 31) throw new Error('Personal Trip v1 supports at most 31 days');
  }
  return days;
}

function assertTripDay(trip: PersonalTrip, dayDate: string) {
  assertDateOnly(dayDate, 'trip day');
  if (!trip.days.includes(dayDate)) throw new Error(`Date is outside trip range: ${dayDate}`);
}

function assertUniqueItemId(trip: PersonalTrip, itemId: string) {
  if (!itemId.trim()) throw new Error('Trip item id is required');
  if (trip.items.some((item) => item.id === itemId)) throw new Error(`Duplicate trip item id: ${itemId}`);
}

function validateCommitment(commitment: PersonalTripCommitment) {
  if (!commitment || typeof commitment !== 'object' || Array.isArray(commitment)
    || !['ticket', 'reservation'].includes(commitment.kind)
    || !['held', 'confirmed', 'cancelled'].includes(commitment.status)
    || !['user-declared', 'provider-confirmed'].includes(commitment.verification)) {
    throw new Error('Invalid booking type, status or verification');
  }
  if (commitment.provider !== undefined && (typeof commitment.provider !== 'string'
    || !commitment.provider.trim() || commitment.provider.length > 240)) {
    throw new Error('Commitment provider cannot be blank or oversized');
  }
  if (commitment.reference !== undefined && (typeof commitment.reference !== 'string'
    || !commitment.reference.trim() || commitment.reference.length > 240)) {
    throw new Error('Invalid commitment reference');
  }
  if (commitment.partySize !== undefined
    && (!Number.isInteger(commitment.partySize) || commitment.partySize < 1 || commitment.partySize > 50)) {
    throw new Error('Commitment party size must be an integer between 1 and 50');
  }
  for (const [field, value, max] of [
    ['seats', commitment.seats, 160],
    ['address', commitment.address, 240],
    ['sourceRef', commitment.sourceRef, 240]
  ] as const) {
    if (value !== undefined && (!value.trim() || value.trim().length > max)) {
      throw new Error(`Commitment ${field} must be non-empty and at most ${max} characters`);
    }
  }
  if (commitment.externalUrl && !/^https:\/\//i.test(commitment.externalUrl)) {
    throw new Error('Commitment external URL must use HTTPS');
  }
  if (commitment.verification === 'provider-confirmed') {
    if (!commitment.provider?.trim()) throw new Error('Provider-confirmed commitment requires provider');
    if (!commitment.receiptEvidenceRef?.trim()) {
      throw new Error('Provider-confirmed commitment requires receipt evidence');
    }
  }
  if (commitment.verification === 'user-declared' && commitment.receiptEvidenceRef) {
    throw new Error('User-declared commitment cannot carry provider receipt evidence');
  }
}

function clone(trip: PersonalTrip): PersonalTrip {
  return {
    ...trip,
    days: [...trip.days],
    items: trip.items.map((item) => ({
      ...item,
      ...(item.commitment ? { commitment: { ...item.commitment } } : {})
    })),
    visits: trip.visits.map((visit) => ({ ...visit })),
    ...(trip.bookingResolutions ? {
      bookingResolutions: trip.bookingResolutions.map((entry) => ({
        ...entry,
        events: entry.events.map(event => ({ ...event }))
      }))
    } : {}),
    ...(trip.replacementReceipts ? {
      replacementReceipts: trip.replacementReceipts.map((receipt) => ({
        ...receipt,
        before: { ...receipt.before },
        after: { ...receipt.after },
        routeObservationIds: [...receipt.routeObservationIds]
      }))
    } : {}),
    ...(trip.preferences ? {
      preferences: {
        ...trip.preferences,
        ...(trip.preferences.lunchWindow ? { lunchWindow: { ...trip.preferences.lunchWindow } } : {})
      }
    } : {})
  };
}

function touch(trip: PersonalTrip, updatedAt: string) {
  parseIso(updatedAt);
  trip.updatedAt = updatedAt;
  return trip;
}

function hhmmToMinutes(value: string, field: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) throw new Error(`Invalid ${field}: ${value}`);
  const [hoursRaw, minutesRaw] = value.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid ${field}: ${value}`);
  }
  return hours * 60 + minutes;
}

function validatePersonalTripPreferences(preferences: PersonalTripPreferences) {
  if (preferences.stepFreeIntent
    && !['none', 'preferred', 'required'].includes(preferences.stepFreeIntent)) {
    throw new Error('Invalid Personal Trip step-free intent');
  }
  if (preferences.pace && !['relaxed', 'balanced', 'intensive'].includes(preferences.pace)) {
    throw new Error('Invalid Personal Trip pace');
  }
  if (preferences.priorityMode && !['must-see', 'balanced', 'discover-more'].includes(preferences.priorityMode)) {
    throw new Error('Invalid Personal Trip priority mode');
  }

  const dayStart = preferences.dayStart ?? DEFAULT_PERSONAL_TRIP_PREFERENCES.dayStart;
  const dayEnd = preferences.dayEnd ?? DEFAULT_PERSONAL_TRIP_PREFERENCES.dayEnd;
  const startMinutes = hhmmToMinutes(dayStart, 'Personal Trip day start');
  const endMinutes = hhmmToMinutes(dayEnd, 'Personal Trip day end');
  if (endMinutes <= startMinutes) throw new Error('Personal Trip day end must be after day start');

  if (preferences.maxContinuousWalkingMinutes !== undefined
    && (!Number.isInteger(preferences.maxContinuousWalkingMinutes)
      || preferences.maxContinuousWalkingMinutes < 10
      || preferences.maxContinuousWalkingMinutes > 240)) {
    throw new Error('Personal Trip max walking minutes must be an integer between 10 and 240');
  }

  if (preferences.lunchWindow) {
    const lunchStart = hhmmToMinutes(preferences.lunchWindow.start, 'Personal Trip lunch start');
    const lunchEnd = hhmmToMinutes(preferences.lunchWindow.end, 'Personal Trip lunch end');
    if (lunchEnd <= lunchStart) throw new Error('Personal Trip lunch end must be after lunch start');
    if (lunchStart < startMinutes || lunchEnd > endMinutes) {
      throw new Error('Personal Trip lunch window must stay inside day bounds');
    }
  }
}

export function resolvePersonalTripPreferences(trip: PersonalTrip): ResolvedPersonalTripPreferences {
  const stored = trip.preferences ?? {};
  validatePersonalTripPreferences(stored);
  return {
    stepFreeIntent: stored.stepFreeIntent ?? DEFAULT_PERSONAL_TRIP_PREFERENCES.stepFreeIntent,
    pace: stored.pace ?? DEFAULT_PERSONAL_TRIP_PREFERENCES.pace,
    dayStart: stored.dayStart ?? DEFAULT_PERSONAL_TRIP_PREFERENCES.dayStart,
    dayEnd: stored.dayEnd ?? DEFAULT_PERSONAL_TRIP_PREFERENCES.dayEnd,
    maxContinuousWalkingMinutes: stored.maxContinuousWalkingMinutes ?? DEFAULT_PERSONAL_TRIP_PREFERENCES.maxContinuousWalkingMinutes,
    ...(stored.lunchWindow ? { lunchWindow: { ...stored.lunchWindow } } : {}),
    priorityMode: stored.priorityMode ?? DEFAULT_PERSONAL_TRIP_PREFERENCES.priorityMode
  };
}

export function setTripPreferences(input: {
  trip: PersonalTrip;
  preferences: Partial<Omit<PersonalTripPreferences, 'lunchWindow'>> & { lunchWindow?: TripLunchWindow | null };
  updatedAt: string;
}): PersonalTrip {
  parseIso(input.updatedAt);
  const next = clone(input.trip);
  const { lunchWindow, ...rest } = input.preferences;
  const merged: PersonalTripPreferences = {
    ...(next.preferences ?? {}),
    ...rest
  };
  if (lunchWindow === null) {
    delete merged.lunchWindow;
  } else if (lunchWindow) {
    merged.lunchWindow = { ...lunchWindow };
  }
  validatePersonalTripPreferences(merged);
  next.preferences = merged;
  return touch(next, input.updatedAt);
}

export function createPersonalTrip(input: {
  id: string;
  destinationId: string;
  title: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}): PersonalTrip {
  if (!input.id.trim()) throw new Error('Trip id is required');
  if (!input.destinationId.trim()) throw new Error('Trip destination id is required');
  if (!input.title.trim()) throw new Error('Trip title is required');
  parseIso(input.createdAt);

  return {
    schemaVersion: PERSONAL_TRIP_SCHEMA_VERSION,
    id: input.id,
    destinationId: input.destinationId,
    title: input.title.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    days: enumerateDates(input.startDate, input.endDate),
    items: [],
    visits: [],
    createdAt: input.createdAt,
    updatedAt: input.createdAt
  };
}

export function addDestinationNodeToTrip(input: {
  trip: PersonalTrip;
  node: ExperienceNode;
  itemId: string;
  dayDate: string;
  updatedAt: string;
  plannedStartAt?: string;
}): PersonalTrip {
  assertTripDay(input.trip, input.dayDate);
  assertUniqueItemId(input.trip, input.itemId);
  if (input.plannedStartAt) parseIso(input.plannedStartAt);

  const next = clone(input.trip);
  next.items.push({
    id: input.itemId,
    dayDate: input.dayDate,
    title: input.node.titleRu,
    kind: input.node.kind,
    source: 'destination-package',
    destinationNodeId: input.node.id,
    ...(input.plannedStartAt ? { plannedStartAt: input.plannedStartAt } : {}),
    status: 'planned'
  });
  return touch(next, input.updatedAt);
}

export function addManualTripItem(input: {
  trip: PersonalTrip;
  itemId: string;
  dayDate: string;
  title: string;
  kind: PersonalTripItemKind;
  updatedAt: string;
  plannedStartAt?: string;
  plannedEndAt?: string;
  note?: string;
  commitment?: PersonalTripCommitment;
}): PersonalTrip {
  assertTripDay(input.trip, input.dayDate);
  assertUniqueItemId(input.trip, input.itemId);
  if (!input.title.trim()) throw new Error('Trip item title is required');
  if (input.plannedStartAt) parseIso(input.plannedStartAt);
  if (input.plannedEndAt) parseIso(input.plannedEndAt);
  if (input.plannedStartAt && input.plannedEndAt && Date.parse(input.plannedEndAt) <= Date.parse(input.plannedStartAt)) {
    throw new Error('Trip item end must be after start');
  }
  if (input.commitment) validateCommitment(input.commitment);

  const next = clone(input.trip);
  next.items.push({
    id: input.itemId,
    dayDate: input.dayDate,
    title: input.title.trim(),
    kind: input.kind,
    source: 'manual',
    ...(input.plannedStartAt ? { plannedStartAt: input.plannedStartAt } : {}),
    ...(input.plannedEndAt ? { plannedEndAt: input.plannedEndAt } : {}),
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    ...(input.commitment ? { commitment: { ...input.commitment } } : {}),
    status: 'planned'
  });
  return touch(next, input.updatedAt);
}

/** Add an editorial venue as a user-selected place, never as a purchased ticket or reservation. */
export function addCuratedMoscowPlaceToTrip(input: {
  trip: PersonalTrip;
  place: CuratedMoscowPlace;
  itemId: string;
  dayDate: string;
  updatedAt: string;
}): PersonalTrip {
  assertTripDay(input.trip, input.dayDate);
  assertUniqueItemId(input.trip, input.itemId);
  if (!input.place.id.trim() || !/^https:\/\//i.test(input.place.officialUrl)) {
    throw new Error('Curated Moscow place requires a canonical ID and HTTPS official source');
  }
  if (input.trip.items.some((item) => item.dayDate === input.dayDate
    && item.catalogPlaceId === input.place.id
    && item.status !== 'cancelled')) {
    throw new Error('Curated Moscow place already in the selected day');
  }
  const next = clone(input.trip);
  const kind: PersonalTripItemKind =
    input.place.kind === 'park' ? 'activity' : input.place.kind === 'restaurant' ? 'food' : input.place.kind;
  next.items.push({
    id: input.itemId,
    dayDate: input.dayDate,
    title: input.place.titleRu,
    kind,
    source: 'manual',
    catalogPlaceId: input.place.id,
    officialSourceUrl: input.place.officialUrl,
    note: input.place.addressRu,
    status: 'planned'
  });
  return touch(next, input.updatedAt);
}

export function attachTripCommitment(input: {
  trip: PersonalTrip;
  itemId: string;
  commitment: PersonalTripCommitment;
  updatedAt: string;
}): PersonalTrip {
  validateCommitment(input.commitment);
  const next = clone(input.trip);
  const item = next.items.find((candidate) => candidate.id === input.itemId);
  if (!item) throw new Error(`Trip item not found: ${input.itemId}`);
  item.commitment = { ...input.commitment };
  return touch(next, input.updatedAt);
}

export function setTripItemStatus(input: {
  trip: PersonalTrip;
  itemId: string;
  status: PersonalTripItem['status'];
  updatedAt: string;
}): PersonalTrip {
  const next = clone(input.trip);
  const item = next.items.find((candidate) => candidate.id === input.itemId);
  if (!item) throw new Error(`Trip item not found: ${input.itemId}`);
  item.status = input.status;
  return touch(next, input.updatedAt);
}

export function recordTripVisit(input: {
  trip: PersonalTrip;
  visitId: string;
  dayDate: string;
  visitedAt: string;
  title: string;
  evidence: PersonalTripVisit['evidence'];
  updatedAt: string;
  kind?: PersonalTripItemKind;
  itemId?: string;
  destinationNodeId?: string;
  evidenceRef?: string;
}): PersonalTrip {
  assertTripDay(input.trip, input.dayDate);
  parseIso(input.visitedAt);
  if (!input.visitId.trim()) throw new Error('Visit id is required');
  if (!input.title.trim()) throw new Error('Visit title is required');
  if (input.trip.visits.some((visit) => visit.id === input.visitId)) {
    throw new Error(`Duplicate visit id: ${input.visitId}`);
  }
  if (input.evidence === 'provider-receipt' && !input.evidenceRef?.trim()) {
    throw new Error('Provider-receipt visit requires evidence reference');
  }

  const next = clone(input.trip);
  const duplicate = next.visits.some((visit) =>
    (input.itemId && visit.itemId === input.itemId)
    || (input.destinationNodeId && visit.destinationNodeId === input.destinationNodeId && visit.dayDate === input.dayDate)
  );
  if (duplicate) return touch(next, input.updatedAt);

  next.visits.push({
    id: input.visitId,
    visitedAt: input.visitedAt,
    dayDate: input.dayDate,
    title: input.title.trim(),
    ...(input.kind ? { kind: input.kind } : {}),
    ...(input.itemId ? { itemId: input.itemId } : {}),
    ...(input.destinationNodeId ? { destinationNodeId: input.destinationNodeId } : {}),
    evidence: input.evidence,
    ...(input.evidenceRef?.trim() ? { evidenceRef: input.evidenceRef.trim() } : {})
  });

  if (input.itemId) {
    const item = next.items.find((candidate) => candidate.id === input.itemId);
    if (item && item.status === 'planned') item.status = 'completed';
  }

  return touch(next, input.updatedAt);
}

/** A note never upgrades user-confirmed attendance to provider-verified. */
export function updateTripVisitNote(input: {
  trip: PersonalTrip;
  visitId: string;
  note: string;
  updatedAt: string;
}): PersonalTrip {
  parseIso(input.updatedAt);
  if (!input.trip.visits.some((visit) => visit.id === input.visitId)) throw new Error('Visit not found');
  const normalized = input.note.trim();
  if (normalized.length > 2000) throw new Error('Visit note exceeds 2000 characters');
  const next = clone(input.trip);
  const visit = next.visits.find((candidate) => candidate.id === input.visitId)!;
  if (normalized) visit.note = normalized;
  else delete visit.note;
  return touch(next, input.updatedAt);
}

export function syncRouteCompletedVisits(input: {
  trip: PersonalTrip;
  pkg: DestinationPackage;
  destinationNodeIds: string[];
  dayDate: string;
  at: string;
  idForNode: (nodeId: string) => string;
}): PersonalTrip {
  if (!input.trip.days.includes(input.dayDate)) return input.trip;
  const byId = new Map(input.pkg.nodes.map((node) => [node.id, node]));
  let next = input.trip;

  for (const nodeId of [...new Set(input.destinationNodeIds)]) {
    const node = byId.get(nodeId);
    if (!node) continue;
    if (next.visits.some((visit) => visit.destinationNodeId === nodeId && visit.dayDate === input.dayDate)) continue;

    const item = next.items.find((candidate) => candidate.destinationNodeId === nodeId && candidate.dayDate === input.dayDate);
    next = recordTripVisit({
      trip: next,
      visitId: input.idForNode(nodeId),
      dayDate: input.dayDate,
      visitedAt: input.at,
      title: node.titleRu,
      kind: node.kind,
      evidence: 'route-completed',
      updatedAt: input.at,
      ...(item ? { itemId: item.id } : {}),
      destinationNodeId: nodeId
    });
  }

  return next;
}

export function summarizePersonalTrip(trip: PersonalTrip): PersonalTripSummary {
  return {
    dayCount: trip.days.length,
    plannedCount: trip.items.filter(isActivePlannedTripStop).length,
    commitmentCount: displayedUpcomingCommitments(trip.items).length,
    completedCount: trip.items.filter((item) => item.status === 'completed').length,
    visitedCount: trip.visits.length
  };
}

export function getUnseenDestinationNodes(input: {
  pkg: DestinationPackage;
  trip: PersonalTrip;
  visitedDestinationNodeIds?: string[];
}) {
  const planned = new Set(input.trip.items.flatMap((item) => item.destinationNodeId ? [item.destinationNodeId] : []));
  const visited = new Set([
    ...input.trip.visits.flatMap((visit) => visit.destinationNodeId ? [visit.destinationNodeId] : []),
    ...(input.visitedDestinationNodeIds ?? [])
  ]);
  return input.pkg.nodes.filter((node) => !planned.has(node.id) && !visited.has(node.id));
}

export function personalTripDayItems(trip: PersonalTrip, dayDate: string) {
  assertTripDay(trip, dayDate);
  return trip.items
    .filter((item) => item.dayDate === dayDate)
    .sort((a, b) => {
      const aOrder = a.displayOrder;
      const bOrder = b.displayOrder;
      if (aOrder !== undefined && bOrder !== undefined && aOrder !== bOrder) return aOrder - bOrder;
      if (aOrder !== undefined && bOrder === undefined) return -1;
      if (aOrder === undefined && bOrder !== undefined) return 1;
      return (a.plannedStartAt ?? '').localeCompare(b.plannedStartAt ?? '')
        || a.title.localeCompare(b.title, 'ru');
    });
}

export function personalTripDayVisits(trip: PersonalTrip, dayDate: string) {
  assertTripDay(trip, dayDate);
  return trip.visits
    .filter((visit) => visit.dayDate === dayDate)
    .sort((a, b) => a.visitedAt.localeCompare(b.visitedAt));
}

export function parsePersonalTrip(raw: string): PersonalTrip {
  const parsed = JSON.parse(raw) as Partial<PersonalTrip>;
  if (parsed.schemaVersion !== PERSONAL_TRIP_SCHEMA_VERSION) throw new Error('Unsupported Personal Trip schema');
  if (!parsed.id?.trim() || !parsed.destinationId?.trim() || !parsed.title?.trim()) throw new Error('Invalid Personal Trip identity');
  if (!parsed.startDate || !parsed.endDate) throw new Error('Invalid Personal Trip dates');
  const expectedDays = enumerateDates(parsed.startDate, parsed.endDate);
  if (!Array.isArray(parsed.days) || parsed.days.join('|') !== expectedDays.join('|')) throw new Error('Personal Trip day range mismatch');
  if (!Array.isArray(parsed.items) || !Array.isArray(parsed.visits)) throw new Error('Invalid Personal Trip collections');
  if (!parsed.createdAt || !parsed.updatedAt) throw new Error('Invalid Personal Trip timestamps');
  if (parsed.preferences) validatePersonalTripPreferences(parsed.preferences);
  if (parsed.replacementReceipts !== undefined) {
    if (!Array.isArray(parsed.replacementReceipts)) throw new Error('Invalid replacement receipt collection');
    const seenProposals = new Set<string>();
    for (const receipt of parsed.replacementReceipts) {
      if (!receipt || typeof receipt !== 'object'
        || receipt.schemaVersion !== 1
        || receipt.fixedCommitmentsPreserved !== true
        || !receipt.proposalId?.trim()
        || !receipt.disruptionId?.trim()
        || !receipt.affectedItemId?.trim()
        || !receipt.sourceEvidenceRef?.trim()
        || !receipt.before?.title?.trim()
        || !receipt.before?.kind
        || !receipt.after?.title?.trim()
        || !receipt.after?.kind
        || !receipt.after?.destinationNodeId?.trim()
        || !receipt.after?.plannedStartAt
        || !receipt.after?.plannedEndAt
        || !Array.isArray(receipt.routeObservationIds)
        || !receipt.routeObservationIds.every((id) => typeof id === 'string' && id.trim().length > 0)
        || (receipt.disruptionReason !== undefined && !['closed', 'cancelled', 'rescheduled', 'stale'].includes(receipt.disruptionReason))
        || (receipt.sourceUrl !== undefined && (typeof receipt.sourceUrl !== 'string' || !/^https:\/\//.test(receipt.sourceUrl)))
        || (receipt.sourceProviderName !== undefined && (typeof receipt.sourceProviderName !== 'string' || !receipt.sourceProviderName.trim()))) {
        throw new Error('Invalid replacement acceptance receipt');
      }
      parseIso(receipt.acceptedAt);
      parseIso(receipt.baselineUpdatedAt);
      parseIso(receipt.after.plannedStartAt);
      parseIso(receipt.after.plannedEndAt);
      if (receipt.before.plannedStartAt) parseIso(receipt.before.plannedStartAt);
      if (receipt.before.plannedEndAt) parseIso(receipt.before.plannedEndAt);
      if (seenProposals.has(receipt.proposalId)) throw new Error('Duplicate replacement acceptance receipt');
      seenProposals.add(receipt.proposalId);
    }
  }
  parseIso(parsed.createdAt);
  parseIso(parsed.updatedAt);

  const trip = parsed as PersonalTrip;
  const seenItemIds = new Set<string>();
  const seenCalendarKeys = new Set<string>();
  for (const item of trip.items) {
    assertTripDay(trip, item.dayDate);
    if (!item.id?.trim() || !item.title?.trim()) throw new Error('Invalid Personal Trip item');
    if (!['planned', 'completed', 'skipped', 'cancelled'].includes(item.status)
      || !['manual', 'provider', 'destination-package'].includes(item.source)) {
      throw new Error('Invalid trip item status or source');
    }
    if (seenItemIds.has(item.id)) throw new Error('Duplicate trip item ID: ' + item.id);
    seenItemIds.add(item.id);
    if (item.catalogPlaceId !== undefined) {
      if (typeof item.catalogPlaceId !== 'string' || !item.catalogPlaceId.trim()
        || typeof item.officialSourceUrl !== 'string' || !/^https:\/\//i.test(item.officialSourceUrl)
) {
        throw new Error('Invalid curated trip place metadata');
      }
    }
    if (item.officialSourceUrl !== undefined
      && (typeof item.officialSourceUrl !== 'string' || !/^https:\/\//i.test(item.officialSourceUrl))) {
      throw new Error('Invalid trip place source URL');
    }
    if (item.calendarImportKey !== undefined) {
      if (typeof item.calendarImportKey !== 'string'
        || !/^ics:[A-Za-z0-9._@+:-]{1,140}$/.test(item.calendarImportKey)
        || item.source !== 'manual') {
        throw new Error('Invalid calendar import key');
      }
      if (seenCalendarKeys.has(item.calendarImportKey)) {
        throw new Error('Duplicate imported calendar event: ' + item.calendarImportKey);
      }
      seenCalendarKeys.add(item.calendarImportKey);
    }
    if (item.commitment) validateCommitment(item.commitment);
  }
  const seenVisitIds = new Set<string>();
  for (const visit of trip.visits) {
    if (!visit.id?.trim() || seenVisitIds.has(visit.id)) {
      throw new Error('Invalid or duplicate visit ID');
    }
    seenVisitIds.add(visit.id);
    assertTripDay(trip, visit.dayDate);
    parseIso(visit.visitedAt);
    if (visit.note !== undefined && (typeof visit.note !== 'string' || visit.note.length > 2000)) {
      throw new Error('Invalid visit note');
    }
  }
  // Reject forged/imported supplier replies and broken event trails without
  // upgrading any commitment verification, receipt or actual booked time.
  validateBookingResolutions(trip);
  return clone(trip);
}


export function setTripStepFreeIntent(input: {
  trip: PersonalTrip;
  intent: StepFreeIntent;
  updatedAt: string;
}): PersonalTrip {
  return setTripPreferences({
    trip: input.trip,
    preferences: { stepFreeIntent: input.intent },
    updatedAt: input.updatedAt
  });
}

export function tripStepFreeIntent(trip: PersonalTrip): StepFreeIntent {
  return resolvePersonalTripPreferences(trip).stepFreeIntent;
}
