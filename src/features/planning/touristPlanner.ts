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
 * Editorial route estimate until MapKit pedestrian geometry becomes authority.
 *
 * Stops are all on the same Varvarka corridor, so straight-line geodesic
 * distance is materially better than the old flat "4 minutes between any
 * stops" assumption. We use 75 m/min (~4.5 km/h) and clearly keep this as an
 * estimate, not turn-by-turn routing.
 */
export const TOURIST_ESTIMATED_WALK_METERS_PER_MINUTE = 75;

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

function geodesicDistanceMeters(a: Place, b: Place) {
  const earthRadiusMeters = 6371000;
  const rad = (value: number) => value * Math.PI / 180;
  const lat1 = rad(a.latitude);
  const lat2 = rad(b.latitude);
  const deltaLat = rad(b.latitude - a.latitude);
  const deltaLon = rad(b.longitude - a.longitude);
  const h = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function estimatedWalkMinutes(a: Place, b: Place) {
  return Math.max(
    1,
    Math.round(geodesicDistanceMeters(a, b) / TOURIST_ESTIMATED_WALK_METERS_PER_MINUTE)
  );
}

function estimateMinutes(stopIds: string[], source: Place[] = places) {
  const ordered = orderAlongPilot(stopIds);
  const byId = new Map(source.map((place) => [place.id, place]));
  const content = ordered.reduce((sum, id) => sum + (byId.get(id)?.experienceMinutes ?? 0), 0);
  const walking = ordered.slice(1).reduce((sum, id, index) => {
    const previous = byId.get(ordered[index]!);
    const current = byId.get(id);
    return sum + (previous && current ? estimatedWalkMinutes(previous, current) : 4);
  }, 0);
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
