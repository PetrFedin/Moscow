import type { DestinationPackage, ExperienceNode, ExperienceNodeKind } from './destinationPackage.ts';

export const PERSONAL_TRIP_SCHEMA_VERSION = 1 as const;

export type PersonalTripItemKind =
  | ExperienceNodeKind
  | 'theatre'
  | 'bar'
  | 'shopping'
  | 'other';

export type PersonalTripItemSource = 'destination-package' | 'manual' | 'provider';

export type PersonalTripCommitment = {
  kind: 'ticket' | 'reservation';
  status: 'held' | 'confirmed' | 'cancelled';
  verification: 'user-declared' | 'provider-confirmed';
  provider?: string;
  reference?: string;
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
  itemId?: string;
  destinationNodeId?: string;
  evidence: 'user-confirmed' | 'route-completed' | 'provider-receipt' | 'proximity';
  evidenceRef?: string;
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
  if (commitment.provider !== undefined && !commitment.provider.trim()) {
    throw new Error('Commitment provider cannot be blank');
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
    visits: trip.visits.map((visit) => ({ ...visit }))
  };
}

function touch(trip: PersonalTrip, updatedAt: string) {
  parseIso(updatedAt);
  trip.updatedAt = updatedAt;
  return trip;
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
    plannedCount: trip.items.filter((item) => item.status === 'planned').length,
    commitmentCount: trip.items.filter((item) => item.commitment && item.commitment.status !== 'cancelled').length,
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
  parseIso(parsed.createdAt);
  parseIso(parsed.updatedAt);

  const trip = parsed as PersonalTrip;
  for (const item of trip.items) {
    assertTripDay(trip, item.dayDate);
    if (!item.id?.trim() || !item.title?.trim()) throw new Error('Invalid Personal Trip item');
    if (item.commitment) validateCommitment(item.commitment);
  }
  for (const visit of trip.visits) {
    assertTripDay(trip, visit.dayDate);
    parseIso(visit.visitedAt);
  }
  return clone(trip);
}
