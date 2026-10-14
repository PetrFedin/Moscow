import { moscowVarvarkaDestinationPackage } from './moscowDestinationPackage.ts';
import { curatedMoscowPlaces } from './curatedMoscowPlaces.ts';
import {
  passportCategoryForKind,
  resolveVisitKind,
  type MoscowPassportCategory
} from './moscowPassport.ts';
import {
  parsePersonalTrip,
  type PersonalTrip,
  type PersonalTripItemKind,
  type PersonalTripVisit
} from './personalTrip.ts';
import { parsePersonalTripArchive, type PersonalTripArchive } from './personalTripArchive.ts';

export type MoscowHistoryEntry = {
  /** Stable within local history; never treat a title alone as a place identity. */
  key: string;
  tripId: string;
  tripTitle: string;
  title: string;
  dayDate: string;
  visitedAt: string;
  kind: PersonalTripItemKind;
  category: MoscowPassportCategory;
  evidence: PersonalTripVisit['evidence'];
  /** A namespaced ID from the destination or curated catalog, if available. */
  knownPlaceId?: string;
  note?: string;
};

export type MoscowTravelHistory = {
  tripCount: number;
  /** Recorded visit entries; does not certify real physical attendance. */
  visitCount: number;
  restaurantCount: number;
  museumAndCultureCount: number;
  /** Unique *identified* places only; anonymous/free-text venues are not deduplicated. */
  knownPlaceCount: number;
  unknownIdentityVisitCount: number;
  /** Repeat visit entries after the first for each identified place. */
  repeatKnownPlaceVisitCount: number;
  entries: MoscowHistoryEntry[];
};

export type MoscowHistoryFilter = {
  query?: string;
  category?: MoscowPassportCategory | 'all';
  fromDate?: string;
  toDate?: string;
};

export type MoscowHistoryDay = {
  dayDate: string;
  entries: MoscowHistoryEntry[];
};

const knownDestinationIds = new Set(moscowVarvarkaDestinationPackage.nodes.map((node) => node.id));
const knownCatalogIds = new Set(curatedMoscowPlaces.map((place) => place.id));

function placeIdentity(trip: PersonalTrip, visit: PersonalTripVisit): string | undefined {
  const linkedItem = visit.itemId ? trip.items.find((item) => item.id === visit.itemId) : undefined;
  const nodeId = visit.destinationNodeId ?? linkedItem?.destinationNodeId;
  if (nodeId && knownDestinationIds.has(nodeId)) return `destination:${nodeId}`;
  if (linkedItem?.catalogPlaceId && knownCatalogIds.has(linkedItem.catalogPlaceId)) {
    return `catalog:${linkedItem.catalogPlaceId}`;
  }
  // Same title/address is NOT reliable enough to merge separate manual entries.
  return undefined;
}

function validDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Local-only view. Active trip revision supersedes the same ID from the archive. */
export function buildMoscowTravelHistory(input: {
  activeTrip: PersonalTrip | null;
  archive: PersonalTripArchive;
}): MoscowTravelHistory {
  const archive = parsePersonalTripArchive(JSON.stringify(input.archive));
  const active = input.activeTrip ? parsePersonalTrip(JSON.stringify(input.activeTrip)) : null;
  const trips = new Map<string, PersonalTrip>(archive.trips.map((trip) => [trip.id, trip]));
  if (active) trips.set(active.id, active);

  const entries: MoscowHistoryEntry[] = [];
  for (const trip of trips.values()) {
    for (const visit of trip.visits) {
      const kind = resolveVisitKind({ trip, visit, pkg: moscowVarvarkaDestinationPackage });
      const knownPlaceId = placeIdentity(trip, visit);
      entries.push({
        key: JSON.stringify([trip.id, visit.id]),
        tripId: trip.id,
        tripTitle: trip.title,
        title: visit.title,
        dayDate: visit.dayDate,
        visitedAt: visit.visitedAt,
        kind,
        category: passportCategoryForKind(kind),
        evidence: visit.evidence,
        ...(knownPlaceId ? { knownPlaceId } : {}),
        ...(visit.note ? { note: visit.note } : {})
      });
    }
  }

  entries.sort((a, b) =>
    b.dayDate.localeCompare(a.dayDate)
    || b.visitedAt.localeCompare(a.visitedAt)
    || a.key.localeCompare(b.key)
  );

  const knownCounts = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.knownPlaceId) continue;
    knownCounts.set(entry.knownPlaceId, (knownCounts.get(entry.knownPlaceId) ?? 0) + 1);
  }

  return {
    tripCount: trips.size,
    visitCount: entries.length,
    restaurantCount: entries.filter((entry) => entry.category === 'ate').length,
    museumAndCultureCount: entries.filter((entry) =>
      entry.kind === 'museum' || entry.kind === 'theatre' || entry.kind === 'exhibition').length,
    knownPlaceCount: knownCounts.size,
    unknownIdentityVisitCount: entries.filter((entry) => !entry.knownPlaceId).length,
    repeatKnownPlaceVisitCount: [...knownCounts.values()]
      .reduce((count, visits) => count + Math.max(0, visits - 1), 0),
    entries
  };
}

/** Read-only search and explicit inclusive date-range filters. Invalid dates fail closed. */
export function filterMoscowTravelHistory(
  history: MoscowTravelHistory,
  filter: MoscowHistoryFilter
): MoscowHistoryEntry[] {
  const fromDate = filter.fromDate?.trim() || undefined;
  const toDate = filter.toDate?.trim() || undefined;
  if ((fromDate && !validDay(fromDate)) || (toDate && !validDay(toDate))
    || (fromDate && toDate && fromDate > toDate)) {
    throw new Error('Invalid Moscow history date range');
  }
  const query = filter.query?.trim().normalize('NFKC').toLowerCase() ?? '';
  return history.entries.filter((entry) => {
    if (filter.category && filter.category !== 'all' && entry.category !== filter.category) return false;
    if (fromDate && entry.dayDate < fromDate) return false;
    if (toDate && entry.dayDate > toDate) return false;
    if (!query) return true;
    const searchable = [
      entry.title,
      entry.tripTitle,
      entry.dayDate,
      entry.note ?? ''
    ].join(' ').normalize('NFKC').toLowerCase();
    return searchable.includes(query);
  });
}

export function groupMoscowHistoryByDay(entries: readonly MoscowHistoryEntry[]): MoscowHistoryDay[] {
  const byDay = new Map<string, MoscowHistoryEntry[]>();
  for (const entry of entries) {
    const list = byDay.get(entry.dayDate) ?? [];
    list.push(entry);
    byDay.set(entry.dayDate, list);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dayDate, dayEntries]) => ({ dayDate, entries: dayEntries }));
}
