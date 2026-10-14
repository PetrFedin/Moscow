import type { DayReplacementAcceptanceReceipt } from './dayReplacementProposal.ts';
import type { PersonalTrip, PersonalTripItem } from './personalTrip.ts';

export type PostAcceptContinuation = {
  receipt: DayReplacementAcceptanceReceipt;
  acceptedItem: PersonalTripItem;
  nextItem?: PersonalTripItem;
  remainingItemIds: string[];
  preservedCommitmentItemIds: string[];
};

/**
 * Reconcile a confirmed replacement with the exact current trip.
 * This is a read-only projection; it never infers a route or changes bookings.
 */
export function buildPostAcceptContinuation(input: {
  trip: PersonalTrip;
  receipt: DayReplacementAcceptanceReceipt;
}): PostAcceptContinuation {
  const { trip, receipt } = input;
  if (receipt.fixedCommitmentsPreserved !== true) {
    throw new Error('Fixed commitment preservation is not verified');
  }
  if (receipt.acceptedAt !== trip.updatedAt) {
    throw new Error('Continuation requires the exact accepted trip revision');
  }
  const acceptedItem = trip.items.find(item => item.id === receipt.affectedItemId);
  if (!acceptedItem || acceptedItem.status !== 'planned'
    || acceptedItem.destinationNodeId !== receipt.after.destinationNodeId
    || acceptedItem.title !== receipt.after.title
    || acceptedItem.plannedStartAt !== receipt.after.plannedStartAt
    || acceptedItem.plannedEndAt !== receipt.after.plannedEndAt) {
    throw new Error('Accepted replacement no longer matches the trip');
  }
  const dayItems = trip.items
    .filter(item => item.dayDate === acceptedItem.dayDate && item.status === 'planned')
    .sort((a, b) => {
      const aTime = a.plannedStartAt ? Date.parse(a.plannedStartAt) : Number.POSITIVE_INFINITY;
      const bTime = b.plannedStartAt ? Date.parse(b.plannedStartAt) : Number.POSITIVE_INFINITY;
      return aTime - bTime || (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.id.localeCompare(b.id);
    });
  const afterEnd = Date.parse(acceptedItem.plannedEndAt!);
  const nextItem = dayItems.find(item =>
    item.id !== acceptedItem.id
    && !!item.plannedStartAt
    && Date.parse(item.plannedStartAt) >= afterEnd
  );
  return {
    receipt,
    acceptedItem,
    ...(nextItem ? { nextItem } : {}),
    remainingItemIds: dayItems
      .filter(item => item.id === acceptedItem.id || (!!item.plannedStartAt && Date.parse(item.plannedStartAt) >= afterEnd))
      .map(item => item.id),
    preservedCommitmentItemIds: dayItems
      .filter(item => item.id !== acceptedItem.id && item.commitment?.status === 'confirmed')
      .map(item => item.id)
  };
}
