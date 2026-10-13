import { parsePersonalTrip, type PersonalTrip, type PersonalTripVisit } from './personalTrip.ts';
import { parsePersonalTripArchive, type PersonalTripArchive } from './personalTripArchive.ts';

export type MoscowHistoryEntry = {
  key: string;
  tripId: string;
  tripTitle: string;
  title: string;
  dayDate: string;
  visitedAt: string;
  kind: PersonalTripVisit['kind'];
  evidence: PersonalTripVisit['evidence'];
  note?: string;
};

export type MoscowTravelHistory = {
  tripCount: number;
  visitCount: number;
  restaurantCount: number;
  museumAndCultureCount: number;
  entries: MoscowHistoryEntry[];
};

/** Local-only history. The active revision supersedes its archived snapshot. */
export function buildMoscowTravelHistory(input: {
  activeTrip: PersonalTrip | null;
  archive: PersonalTripArchive;
}): MoscowTravelHistory {
  const archive = parsePersonalTripArchive(JSON.stringify(input.archive));
  const active = input.activeTrip ? parsePersonalTrip(JSON.stringify(input.activeTrip)) : null;
  const trips = new Map(archive.trips.map(trip => [trip.id, trip]));
  if (active) trips.set(active.id, active);

  const entries: MoscowHistoryEntry[] = [];
  for (const trip of trips.values()) {
    for (const visit of trip.visits) {
      entries.push({
        key: JSON.stringify([trip.id, visit.id]),
        tripId: trip.id,
        tripTitle: trip.title,
        title: visit.title,
        dayDate: visit.dayDate,
        visitedAt: visit.visitedAt,
        kind: visit.kind,
        evidence: visit.evidence,
        ...(visit.note ? { note: visit.note } : {})
      });
    }
  }
  entries.sort((a, b) => b.visitedAt.localeCompare(a.visitedAt) || a.key.localeCompare(b.key));

  return {
    tripCount: trips.size,
    visitCount: entries.length,
    restaurantCount: entries.filter(e => e.kind === 'food').length,
    museumAndCultureCount: entries.filter(e =>
      e.kind === 'museum' || e.kind === 'theatre' || e.kind === 'exhibition').length,
    entries
  };
}
