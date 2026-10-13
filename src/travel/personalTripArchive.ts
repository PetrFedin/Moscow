import { parsePersonalTrip, type PersonalTrip } from './personalTrip.ts';

export const PERSONAL_TRIP_ARCHIVE_STORAGE_KEY = 'moscow:v1:personal-trip-archive';
export const PERSONAL_TRIP_ARCHIVE_VERSION = 1 as const;

export type PersonalTripArchive = {
  schemaVersion: typeof PERSONAL_TRIP_ARCHIVE_VERSION;
  trips: PersonalTrip[];
};

export function emptyPersonalTripArchive(): PersonalTripArchive {
  return { schemaVersion: PERSONAL_TRIP_ARCHIVE_VERSION, trips: [] };
}

/** All retained journeys stay local. This does not imply account sync or secure cloud backup. */
export function parsePersonalTripArchive(raw: string): PersonalTripArchive {
  const parsed = JSON.parse(raw) as Partial<PersonalTripArchive>;
  if (!parsed || parsed.schemaVersion !== PERSONAL_TRIP_ARCHIVE_VERSION || !Array.isArray(parsed.trips)) {
    throw new Error('Unsupported personal trip archive');
  }
  const trips: PersonalTrip[] = [];
  const ids = new Set<string>();
  for (const candidate of parsed.trips) {
    // Re-use the same validator and deep clone as the authoritative active trip.
    const trip = parsePersonalTrip(JSON.stringify(candidate));
    if (ids.has(trip.id)) throw new Error('Duplicate archived trip identity');
    ids.add(trip.id);
    trips.push(trip);
  }
  return {
    schemaVersion: PERSONAL_TRIP_ARCHIVE_VERSION,
    trips: trips.sort((a, b) => b.startDate.localeCompare(a.startDate) || b.updatedAt.localeCompare(a.updatedAt))
  };
}

/** Newest snapshot of a trip ID wins; never overwrite other journeys or erase their receipts. */
export function archivePersonalTrip(archive: PersonalTripArchive, trip: PersonalTrip): PersonalTripArchive {
  const normalizedArchive = parsePersonalTripArchive(JSON.stringify(archive));
  const normalizedTrip = parsePersonalTrip(JSON.stringify(trip));
  const next = normalizedArchive.trips.filter((saved) => saved.id !== normalizedTrip.id);
  next.push(normalizedTrip);
  return parsePersonalTripArchive(JSON.stringify({
    schemaVersion: PERSONAL_TRIP_ARCHIVE_VERSION,
    trips: next
  }));
}

export function archivedPersonalTrip(archive: PersonalTripArchive, tripId: string): PersonalTrip | undefined {
  const normalizedArchive = parsePersonalTripArchive(JSON.stringify(archive));
  return normalizedArchive.trips.find((trip) => trip.id === tripId);
}
