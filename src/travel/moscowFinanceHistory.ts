import { parsePersonalTrip, type PersonalTrip } from './personalTrip.ts';
import { parsePersonalTripArchive, type PersonalTripArchive } from './personalTripArchive.ts';
import { assessTripFinances, type TripFinanceEntry } from './tripFinance.ts';

/**
 * Read-only projection of a traveler's *self-entered* finances across
 * separate journeys. No visit, supplier verification or bank transaction is
 * inferred from an expense, even when linked to a booked stop.
 *
 * Trip identity stays in the grouping key: journeys on the same date are
 * deliberately NOT combined into a single apparent visit.
 */
export type MoscowFinanceHistoryDay = {
  key: string;
  tripId: string;
  tripTitle: string;
  dayDate: string;
  entries: TripFinanceEntry[];
  entriesCount: number;
  estimatedMinor: number;
  actualMinor: number;
  outstandingEstimatesMinor: number;
  projectedMinor: number;
};

export type MoscowFinanceHistory = {
  tripCount: number;
  tripsWithExpenses: number;
  entriesCount: number;
  /** Entries with an explicitly recorded actual, including recorded zero. */
  actualEntriesCount: number;
  /** Sum of traveler-reported actual costs, NOT bank-confirmed expenditure. */
  actualMinor: number;
  /** Sum of all estimates, not a sum of supplier quotes. */
  estimatedMinor: number;
  /** Forecast = actual when present, otherwise estimate; not a completed spend. */
  projectedMinor: number;
  outstandingEstimatesMinor: number;
  /** Days are grouped by journey ID AND date to avoid cross-trip conflation. */
  days: MoscowFinanceHistoryDay[];
};

export function buildMoscowFinanceHistory(input: {
  activeTrip: PersonalTrip | null;
  archive: PersonalTripArchive;
}): MoscowFinanceHistory {
  const archive = parsePersonalTripArchive(JSON.stringify(input.archive));
  const active = input.activeTrip ? parsePersonalTrip(JSON.stringify(input.activeTrip)) : null;
  const trips = new Map<string, PersonalTrip>(archive.trips.map(trip => [trip.id, trip]));
  if (active) trips.set(active.id, active);

  const days: MoscowFinanceHistoryDay[] = [];
  let entriesCount = 0;
  let actualEntriesCount = 0;
  let actualMinor = 0;
  let estimatedMinor = 0;
  let projectedMinor = 0;
  let outstandingEstimatesMinor = 0;
  let tripsWithExpenses = 0;

  for (const trip of trips.values()) {
    const report = assessTripFinances(trip);
    if (!report.entriesCount) continue;
    tripsWithExpenses++;
    entriesCount += report.entriesCount;
    actualEntriesCount += (trip.finance?.entries ?? []).filter(e => e.actualMinor !== undefined).length;
    actualMinor += report.actualMinor;
    estimatedMinor += report.estimatedMinor;
    projectedMinor += report.projectedMinor;
    outstandingEstimatesMinor += report.outstandingEstimatesMinor;

    for (const day of report.byDay) {
      if (!day.entriesCount) continue;
      days.push({
        key: JSON.stringify([trip.id, day.dayDate]),
        tripId: trip.id,
        tripTitle: trip.title,
        dayDate: day.dayDate,
        entries: (trip.finance?.entries ?? [])
          .filter(entry => entry.dayDate === day.dayDate)
          .map(entry => ({ ...entry })),
        entriesCount: day.entriesCount,
        estimatedMinor: day.estimatedMinor,
        actualMinor: day.actualMinor,
        outstandingEstimatesMinor: day.outstandingEstimatesMinor,
        projectedMinor: day.projectedMinor
      });
    }
  }

  days.sort((a, b) =>
    b.dayDate.localeCompare(a.dayDate)
    || a.tripId.localeCompare(b.tripId)
  );
  return {
    tripCount: trips.size,
    tripsWithExpenses,
    entriesCount,
    actualEntriesCount,
    actualMinor,
    estimatedMinor,
    outstandingEstimatesMinor,
    projectedMinor,
    days
  };
}
