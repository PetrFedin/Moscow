import { pilotRoute, places, type Place } from '../../data/places.ts';

export type TouristInterest = 'highlights' | 'architecture' | 'trade' | 'lost-city' | 'nearby';
export type TouristTimeBudget = 15 | 30 | 45;

export type TouristRoutePlan = {
  interest: TouristInterest;
  budgetMinutes: TouristTimeBudget;
  estimatedMinutes: number;
  stopIds: string[];
};

/**
 * Curated corridor walking times for the five-stop Varvarka pilot.
 *
 * This is deliberately not presented as live pedestrian routing. It replaces the
 * old flat "4 minutes between any two stops" assumption with an explicit
 * editorial corridor model until a pedestrian-routing provider becomes route
 * authority.
 *
 * Segments follow pilotRoute.stopIds order:
 * Barbara → English Court → Romanov → Znamensky → Varvarka Gates.
 */
export const VARVARKA_WALK_SEGMENT_MINUTES = [4, 3, 2, 7] as const;
const FALLBACK_WALK_BETWEEN_STOPS_MINUTES = 4;

const interestPriority: Record<TouristInterest, string[]> = {
  highlights: [
    'romanov-chambers',
    'old-english-court',
    'varvarka-gates',
    'znamensky-cathedral',
    'church-st-barbara'
  ],
  architecture: [
    'romanov-chambers',
    'church-st-barbara',
    'znamensky-cathedral',
    'old-english-court',
    'varvarka-gates'
  ],
  trade: [
    'old-english-court',
    'church-st-barbara',
    'romanov-chambers',
    'znamensky-cathedral',
    'varvarka-gates'
  ],
  'lost-city': [
    'varvarka-gates',
    'znamensky-cathedral',
    'old-english-court',
    'romanov-chambers',
    'church-st-barbara'
  ],
  nearby: [...pilotRoute.stopIds]
};

const pilotOrder = new Map(pilotRoute.stopIds.map((id, index) => [id, index]));

function orderAlongPilot(stopIds: string[]) {
  return [...stopIds].sort((a, b) => {
    const ai = pilotOrder.get(a);
    const bi = pilotOrder.get(b);
    if (ai === undefined && bi === undefined) return 0;
    if (ai === undefined) return 1;
    if (bi === undefined) return -1;
    return ai - bi;
  });
}

function corridorWalkMinutes(fromId: string, toId: string) {
  const from = pilotOrder.get(fromId);
  const to = pilotOrder.get(toId);
  if (from === undefined || to === undefined || from === to) {
    return from === to ? 0 : FALLBACK_WALK_BETWEEN_STOPS_MINUTES;
  }

  const start = Math.min(from, to);
  const end = Math.max(from, to);
  let total = 0;
  for (let index = start; index < end; index += 1) {
    total += VARVARKA_WALK_SEGMENT_MINUTES[index] ?? FALLBACK_WALK_BETWEEN_STOPS_MINUTES;
  }
  return total;
}

function estimateMinutes(stopIds: string[], source: Place[] = places) {
  const ordered = orderAlongPilot(stopIds);
  const byId = new Map(source.map((place) => [place.id, place]));
  const content = ordered.reduce((sum, id) => sum + (byId.get(id)?.experienceMinutes ?? 0), 0);
  const walking = ordered.slice(1).reduce(
    (sum, id, index) => sum + corridorWalkMinutes(ordered[index]!, id),
    0
  );
  return content + walking;
}

function orderedCandidates(interest: TouristInterest, mustSeeIds: string[] = []) {
  const seen = new Set<string>();
  const ordered = [...mustSeeIds, ...interestPriority[interest], ...pilotRoute.stopIds];
  return ordered.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function buildTouristRoutePlan(
  budgetMinutes: TouristTimeBudget,
  interest: TouristInterest = 'highlights',
  source: Place[] = places,
  mustSeeIds: string[] = []
): TouristRoutePlan {
  const validIds = new Set(source.map((place) => place.id));
  const candidates = orderedCandidates(interest, mustSeeIds).filter((id) => validIds.has(id));
  let stopIds: string[] = [];

  for (const id of candidates) {
    const proposal = orderAlongPilot([...stopIds, id]);
    const proposalMinutes = estimateMinutes(proposal, source);
    if (stopIds.length === 0 || proposalMinutes <= budgetMinutes) stopIds = proposal;
  }

  const fallback = stopIds.length > 0
    ? stopIds
    : pilotRoute.stopIds.filter((id) => validIds.has(id)).slice(0, 1);
  const routeOrdered = orderAlongPilot(fallback);

  return {
    interest,
    budgetMinutes,
    estimatedMinutes: estimateMinutes(routeOrdered, source),
    stopIds: routeOrdered
  };
}

export function estimateTouristRouteMinutes(stopIds: string[], source: Place[] = places) {
  return estimateMinutes(stopIds, source);
}
