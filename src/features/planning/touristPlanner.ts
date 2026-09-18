import { pilotRoute, places, type Place } from '../../data/places.ts';

export type TouristInterest = 'highlights' | 'architecture' | 'trade' | 'lost-city';
export type TouristTimeBudget = 15 | 30 | 45;

export type TouristRoutePlan = {
  interest: TouristInterest;
  budgetMinutes: TouristTimeBudget;
  estimatedMinutes: number;
  stopIds: string[];
};

const WALK_BETWEEN_STOPS_MINUTES = 4;

const interestPriority: Record<TouristInterest, string[]> = {
  highlights: ['romanov-chambers', 'old-english-court', 'varvarka-gates'],
  architecture: ['romanov-chambers', 'varvarka-gates', 'old-english-court'],
  trade: ['old-english-court', 'romanov-chambers', 'varvarka-gates'],
  'lost-city': ['varvarka-gates', 'romanov-chambers', 'old-english-court']
};

function estimateMinutes(stopIds: string[], source: Place[] = places) {
  const byId = new Map(source.map((place) => [place.id, place]));
  const content = stopIds.reduce((sum, id) => sum + (byId.get(id)?.experienceMinutes ?? 0), 0);
  const walking = Math.max(0, stopIds.length - 1) * WALK_BETWEEN_STOPS_MINUTES;
  return content + walking;
}

function orderedCandidates(interest: TouristInterest) {
  const seen = new Set<string>();
  const ordered = [...interestPriority[interest], ...pilotRoute.stopIds];
  return ordered.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function buildTouristRoutePlan(
  budgetMinutes: TouristTimeBudget,
  interest: TouristInterest = 'highlights',
  source: Place[] = places
): TouristRoutePlan {
  const validIds = new Set(source.map((place) => place.id));
  const candidates = orderedCandidates(interest).filter((id) => validIds.has(id));
  const stopIds: string[] = [];

  for (const id of candidates) {
    const proposal = [...stopIds, id];
    const proposalMinutes = estimateMinutes(proposal, source);
    if (stopIds.length === 0 || proposalMinutes <= budgetMinutes) stopIds.push(id);
  }

  const fallback = stopIds.length > 0 ? stopIds : pilotRoute.stopIds.filter((id) => validIds.has(id)).slice(0, 1);
  return {
    interest,
    budgetMinutes,
    estimatedMinutes: estimateMinutes(fallback, source),
    stopIds: fallback
  };
}

export function estimateTouristRouteMinutes(stopIds: string[], source: Place[] = places) {
  return estimateMinutes(stopIds, source);
}
