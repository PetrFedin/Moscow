import type { PersonalTrip, PersonalTripItem } from './personalTrip.ts';
import { parsePersonalTrip } from './personalTrip.ts';
import { detectTripScheduleConflicts } from './tripScheduler.ts';
import { bookingResolutionIsOpen } from './bookingResolution.ts';
import { isActivePlannedTripStop } from './tripDayPresentation.ts';

export const TRIP_READINESS_VERSION = 1 as const;

/**
 * Read-only, local-only itinerary review.
 * This must NEVER be interpreted as supplier availability, an issued ticket,
 * actual payment, a verified route duration, or an authoritative booking.
 */
export type TripReadinessSeverity = 'conflict' | 'check' | 'information';
export type TripReadinessCode =
  | 'fixed-overlap'
  | 'planned-overlap'
  | 'missing-time'
  | 'incomplete-time'
  | 'provisional-hold'
  | 'user-declared-booking'
  | 'provider-recorded-check-original'
  | 'unresolved-provider-question';

export type TripReadinessIssue = Readonly<{
  id: string;
  code: TripReadinessCode;
  severity: TripReadinessSeverity;
  dayDate: string;
  itemIds: readonly string[];
  /** Only local entries. No contact or provider traffic is generated. */
  titles: readonly string[];
}>;

export type TripReadinessReport = Readonly<{
  version: typeof TRIP_READINESS_VERSION;
  tripId: string;
  dayDate?: string;
  evaluatedItemCount: number;
  issueCount: number;
  conflictCount: number;
  checkCount: number;
  informationCount: number;
  /** 'clear-local' explicitly means there were no DETECTED LOCAL issues. */
  level: 'conflict' | 'check' | 'clear-local';
  providerAvailabilityChecked: false;
  onlineBookingCompleted: false;
  travelRoutingVerified: false;
  issues: readonly TripReadinessIssue[];
}>;

type TimedStop = Readonly<{ item: PersonalTripItem; start: number; end: number }>;

function localDayFromInstant(ms: number, destinationId: string): string {
  if (destinationId !== 'moscow') throw new Error('Trip readiness is admitted for Moscow only');
  const pieces = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date(ms));
  const value = (type: string) => pieces.find(p => p.type === type)?.value ?? '';
  return value('year') + '-' + value('month') + '-' + value('day');
}

function issue(code: TripReadinessCode, severity: TripReadinessSeverity, dayDate: string,
  items: readonly PersonalTripItem[]): TripReadinessIssue {
  const ids = items.map(x => x.id).sort();
  return {
    id: code + ':' + dayDate + ':' + ids.join('|'),
    code, severity, dayDate, itemIds: ids,
    titles: ids.map(id => items.find(item => item.id === id)?.title ?? id)
  };
}

function active(item: PersonalTripItem, visitIds: ReadonlySet<string>): boolean {
  return isActivePlannedTripStop(item) && !visitIds.has(item.id);
}

function timeRange(item: PersonalTripItem): TimedStop | null {
  if (!item.plannedStartAt || !item.plannedEndAt) return null;
  const start = Date.parse(item.plannedStartAt);
  const end = Date.parse(item.plannedEndAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return null; // Input validity is independently enforced by parsePersonalTrip.
  }
  return { item, start, end };
}

const rank: Record<TripReadinessSeverity, number> = {
  conflict: 0, check: 1, information: 2
};

/**
 * Uses a validated snapshot, identifies overlaps across Moscow-midnight,
 * distinguishes supplier-declared truth from the user's own claims, and
 * preserves the original itinerary unchanged.
 */
export function assessTripReadiness(trip: PersonalTrip, dayDate?: string): TripReadinessReport {
  const safe = parsePersonalTrip(JSON.stringify(trip));
  if (safe.destinationId !== 'moscow') throw new Error('Trip readiness requires Moscow admission');
  if (dayDate !== undefined && !safe.days.includes(dayDate)) {
    throw new Error('Readiness day must belong to the trip');
  }

  const visitedItemIds = new Set(
    safe.visits.flatMap(v => v.itemId ? [v.itemId] : [])
  );
  const current = safe.items.filter(item => active(item, visitedItemIds));
  const byId = new Map(safe.items.map(item => [item.id, item]));
  const issues: TripReadinessIssue[] = [];
  const include = (date: string, items: readonly PersonalTripItem[]): boolean =>
    dayDate === undefined || dayDate === date || items.some(item => item.dayDate === dayDate);

  const hardPairs = new Set<string>();
  for (const conflict of detectTripScheduleConflicts(safe)) {
    const pairItems = conflict.itemIds
      .map(id => byId.get(id))
      .filter((item): item is PersonalTripItem => Boolean(item));
    if (pairItems.length !== 2 || !include(conflict.dayDate, pairItems)) continue;
    issues.push(issue('fixed-overlap', 'conflict', conflict.dayDate, pairItems));
    hardPairs.add([...conflict.itemIds].sort().join('|'));
  }

  // The scheduler's fixed check is authoritative for booked overlaps.
  // Additional review warns about overlapping personal plans WITHOUT claiming
  // routing or walking-time knowledge, and avoids duplicate booked pairs.
  const intervals = current.map(timeRange).filter((x): x is TimedStop => x !== null)
    .sort((a, b) => a.start - b.start || a.item.id.localeCompare(b.item.id));
  for (let left = 0; left < intervals.length; left += 1) {
    const a = intervals[left]!;
    for (let right = left + 1; right < intervals.length; right += 1) {
      const b = intervals[right]!;
      if (b.start >= a.end) break;
      if (a.start >= b.end) continue;
      const key = [a.item.id, b.item.id].sort().join('|');
      if (hardPairs.has(key)) continue;
      const overlapDay = localDayFromInstant(Math.max(a.start, b.start), safe.destinationId);
      if (!include(overlapDay, [a.item, b.item])) continue;
      issues.push(issue('planned-overlap', 'check',
        safe.days.includes(overlapDay) ? overlapDay : a.item.dayDate,
        [a.item, b.item]));
    }
  }

  for (const item of current) {
    if (dayDate !== undefined && item.dayDate !== dayDate) continue;
    const hasStart = Boolean(item.plannedStartAt);
    const hasEnd = Boolean(item.plannedEndAt);
    if (hasStart !== hasEnd) {
      issues.push(issue('incomplete-time', 'check', item.dayDate, [item]));
    } else if (!hasStart && !hasEnd) {
      issues.push(issue('missing-time', 'information', item.dayDate, [item]));
    }

    if (item.commitment?.status === 'held') {
      issues.push(issue('provisional-hold', 'check', item.dayDate, [item]));
    } else if (item.commitment?.status === 'confirmed') {
      issues.push(issue(
        item.commitment.verification === 'user-declared'
          ? 'user-declared-booking' : 'provider-recorded-check-original',
        item.commitment.verification === 'user-declared' ? 'check' : 'information',
        item.dayDate, [item]
      ));
    }
  }

  // The booking-resolution notebook records only the tourist's account of
  // contacts and replies. Even 'reply' is not external supplier proof.
  for (const inquiry of safe.bookingResolutions ?? []) {
    if (!bookingResolutionIsOpen(inquiry)) continue;
    const item = byId.get(inquiry.itemId);
    if (!item || !active(item, visitedItemIds)) continue;
    if (dayDate !== undefined && item.dayDate !== dayDate) continue;
    issues.push(issue('unresolved-provider-question', 'check', item.dayDate, [item]));
  }

  issues.sort((a, b) =>
    rank[a.severity] - rank[b.severity]
    || a.dayDate.localeCompare(b.dayDate)
    || a.id.localeCompare(b.id)
  );

  const conflictCount = issues.filter(i => i.severity === 'conflict').length;
  const checkCount = issues.filter(i => i.severity === 'check').length;
  const informationCount = issues.filter(i => i.severity === 'information').length;

  return {
    version: TRIP_READINESS_VERSION,
    tripId: safe.id,
    ...(dayDate ? { dayDate } : {}),
    evaluatedItemCount: dayDate
      ? current.filter(item => item.dayDate === dayDate).length
      : current.length,
    issueCount: issues.length,
    conflictCount,
    checkCount,
    informationCount,
    level: conflictCount ? 'conflict' : checkCount ? 'check' : 'clear-local',
    providerAvailabilityChecked: false,
    onlineBookingCompleted: false,
    travelRoutingVerified: false,
    issues
  };
}
