import type { Place } from '../../data/places.ts';
import { places } from '../../data/places.ts';
import {
  estimateTouristRouteMinutes,
  type TouristRoutePlan,
  type TouristTimeBudget
} from '../planning/touristPlanner.ts';
import { distanceMeters } from '../walk/walkCompanionContract.ts';

export type GeoPoint = { latitude: number; longitude: number };

export type NearbyPlace = {
  place: Place;
  distanceMeters: number;
  visited: boolean;
};

export function rankNearbyPlaces(
  location: GeoPoint,
  source: Place[] = places,
  visitedIds: string[] = []
): NearbyPlace[] {
  const visited = new Set(visitedIds);
  return source
    .map((place) => ({
      place,
      distanceMeters: distanceMeters(location, { latitude: place.latitude, longitude: place.longitude }),
      visited: visited.has(place.id)
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

function nearestNeighbourOrder(start: GeoPoint, candidates: Place[]) {
  const remaining = [...candidates];
  const ordered: Place[] = [];
  let cursor = start;

  while (remaining.length > 0) {
    remaining.sort((a, b) =>
      distanceMeters(cursor, { latitude: a.latitude, longitude: a.longitude })
      - distanceMeters(cursor, { latitude: b.latitude, longitude: b.longitude })
    );
    const next = remaining.shift();
    if (!next) break;
    ordered.push(next);
    cursor = { latitude: next.latitude, longitude: next.longitude };
  }
  return ordered;
}

export function buildNearbyWalkPlan(
  location: GeoPoint,
  source: Place[] = places,
  visitedIds: string[] = [],
  budgetMinutes: TouristTimeBudget = 45
): TouristRoutePlan {
  const visited = new Set(visitedIds);
  const nearby = rankNearbyPlaces(location, source, visitedIds);
  const unvisited = nearby.filter((item) => !item.visited).map((item) => item.place);
  const alreadySeen = nearby.filter((item) => item.visited).map((item) => item.place);

  // Repeated use should surface something new first, but never make the user walk
  // across the district just to avoid a previously visited place.
  const nearest = nearby[0];
  const seed = nearest && nearest.distanceMeters <= 120 && nearest.visited
    ? [nearest.place, ...unvisited.filter((item) => item.id !== nearest.place.id), ...alreadySeen.filter((item) => item.id !== nearest.place.id)]
    : [...unvisited, ...alreadySeen];

  const ordered = nearestNeighbourOrder(location, seed);
  const stopIds: string[] = [];
  for (const place of ordered) {
    const proposal = [...stopIds, place.id];
    const minutes = estimateTouristRouteMinutes(proposal, source);
    if (stopIds.length === 0 || minutes <= budgetMinutes) stopIds.push(place.id);
  }

  return {
    interest: 'nearby',
    budgetMinutes,
    estimatedMinutes: estimateTouristRouteMinutes(stopIds, source),
    stopIds
  };
}
