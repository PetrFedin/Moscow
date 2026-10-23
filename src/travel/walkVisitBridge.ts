import type { PersonalTrip } from './personalTrip.ts';
import { isActivePlannedTripStop } from './tripDayPresentation.ts';

export type WalkVisitCandidate = Readonly<{
  itemId: string;
  title: string;
  dayDate: string;
  destinationNodeId: string;
}>;

/**
 * Historical My Moscow walk progress has place IDs but no trustworthy visit
 * date or trip identity. It must NEVER create a PersonalTrip visit by itself.
 * These are merely candidates which the traveler can explicitly confirm.
 */
export function deriveWalkVisitCandidates(input: {
  trip: PersonalTrip;
  walkVisitedIds: readonly string[];
  dayDate: string;
  todayInDestination: string;
}): WalkVisitCandidate[] {
  if (input.dayDate !== input.todayInDestination
    || !input.trip.days.includes(input.dayDate)) return [];

  const possible = new Set(input.walkVisitedIds);
  const recordedItems = new Set(input.trip.visits.flatMap(visit =>
    visit.itemId ? [visit.itemId] : []
  ));
  const recordedPlaces = new Set(input.trip.visits
    .filter(visit => visit.dayDate === input.dayDate)
    .flatMap(visit => visit.destinationNodeId ? [visit.destinationNodeId] : []));

  return input.trip.items
    .filter(item => item.dayDate === input.dayDate
      && isActivePlannedTripStop(item)
      && item.destinationNodeId
      && possible.has(item.destinationNodeId)
      && !recordedItems.has(item.id)
      && !recordedPlaces.has(item.destinationNodeId))
    .map(item => ({
      itemId: item.id,
      title: item.title,
      dayDate: item.dayDate,
      destinationNodeId: item.destinationNodeId!
    }));
}
