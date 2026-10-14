import type { PersonalTripItem } from './personalTrip.ts';

export type DayStopPresentation =
  | 'cancelled'
  | 'skipped'
  | 'visit-recorded'
  | 'completed-in-plan'
  | 'provider-confirmation-recorded'
  | 'user-declared-confirmation'
  | 'reservation-held'
  | 'planned';

/**
 * UI evidence classification. A provider-confirmed flag in an imported record
 * means "the record says provider-confirmed", NOT independent re-verification.
 * Never show cancelled tickets as valid upcoming bookings.
 */
export function dayStopPresentation(
  item: Pick<PersonalTripItem, 'status' | 'commitment'>,
  recordedVisit: boolean
): DayStopPresentation {
  if (item.status === 'cancelled' || item.commitment?.status === 'cancelled') return 'cancelled';
  if (item.status === 'skipped') return 'skipped';
  if (recordedVisit) return 'visit-recorded';
  if (item.status === 'completed') return 'completed-in-plan';
  if (item.commitment?.status === 'held') return 'reservation-held';
  if (item.commitment?.status === 'confirmed' && item.commitment.verification === 'provider-confirmed') {
    return 'provider-confirmation-recorded';
  }
  if (item.commitment?.status === 'confirmed') return 'user-declared-confirmation';
  return 'planned';
}

/** A cancelled booking never becomes an actionable stop or takes time in Today's plan. */
export function isActivePlannedTripStop(
  item: Pick<PersonalTripItem, 'status' | 'commitment'>
): boolean {
  return item.status === 'planned' && item.commitment?.status !== 'cancelled';
}

/** Preserve the booked date/time unless the provider's documented change process is used. */
export function canMoveTripStopBetweenDays(
  item: Pick<PersonalTripItem, 'status' | 'commitment'>
): boolean {
  return item.status === 'planned' && !item.commitment;
}

/** Historical completed stops still occupy the interval; cancelled bookings do not. */
export function countsAsScheduledOccupancy(
  item: Pick<PersonalTripItem, 'status' | 'commitment'>
): boolean {
  return item.status !== 'cancelled'
    && item.status !== 'skipped'
    && item.commitment?.status !== 'cancelled';
}

export function displayedUpcomingCommitments(items: readonly PersonalTripItem[]): PersonalTripItem[] {
  return items.filter((item) =>
    item.commitment !== undefined
    && item.commitment.status !== 'cancelled'
    && item.status !== 'cancelled'
    && item.status !== 'skipped'
  );
}
