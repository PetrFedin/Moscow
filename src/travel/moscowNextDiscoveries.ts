import {
  curatedMoscowPlaces,
  type CuratedMoscowPlace
} from './curatedMoscowPlaces.ts';
import { passportCategoryForKind, type MoscowPassportCategory } from './moscowPassport.ts';
import {
  parsePersonalTrip,
  type PersonalTrip,
  type PersonalTripItemKind
} from './personalTrip.ts';
import {
  parsePersonalTripArchive,
  type PersonalTripArchive
} from './personalTripArchive.ts';
import { buildMoscowTravelHistory } from './moscowTravelHistory.ts';

export type MoscowDiscoveryInterest = 'all' | 'culture' | 'food' | 'parks';

export type MoscowNextDiscovery = {
  place: CuratedMoscowPlace;
  interest: Exclude<MoscowDiscoveryInterest, 'all'>;
  category: MoscowPassportCategory;
  relatedHistoryVisits: number;
  reason: 'similar-history-category' | 'another-category';
};

export type MoscowNextDiscoveryProjection = {
  dayDate: string;
  totalEligible: number;
  hiddenAsPlanned: number;
  hiddenAsVisited: number;
  unknownIdentityVisits: number;
  suggestions: MoscowNextDiscovery[];
};

/**
 * Static editorial directory only. This does not request live inventory, hours,
 * ticket prices, travel geometry, opening state or bookings.
 */
function interestForPlace(place: CuratedMoscowPlace): Exclude<MoscowDiscoveryInterest, 'all'> {
  if (place.kind === 'restaurant') return 'food';
  if (place.kind === 'park') return 'parks';
  return 'culture';
}

function kindForPlace(place: CuratedMoscowPlace): PersonalTripItemKind {
  if (place.kind === 'restaurant') return 'food';
  // Match the persisted curated-place mapping in addCuratedMoscowPlaceToTrip.
  if (place.kind === 'park') return 'activity';
  return place.kind;
}

/**
 * Search only source-identified places without a known recorded visit or active
 * plan. Unidentified manual visit titles never masquerade as matching identities.
 * Visited evidence is a recorded claim, not independently verified attendance.
 */
export function buildMoscowNextDiscoveries(input: {
  activeTrip: PersonalTrip;
  archive: PersonalTripArchive;
  dayDate: string;
  interest?: MoscowDiscoveryInterest;
  limit?: number;
}): MoscowNextDiscoveryProjection {
  const trip = parsePersonalTrip(JSON.stringify(input.activeTrip));
  const archive = parsePersonalTripArchive(JSON.stringify(input.archive));
  if (!trip.days.includes(input.dayDate)) {
    throw new Error('Discovery day must belong to the active trip');
  }
  const interest = input.interest ?? 'all';
  if (!['all', 'culture', 'food', 'parks'].includes(interest)) {
    throw new Error('Unsupported discovery interest');
  }
  const limit = input.limit ?? 4;
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new Error('Discovery limit must be 1 through 20');
  }

  const history = buildMoscowTravelHistory({ activeTrip: trip, archive });
  const historyByCategory = new Map<MoscowPassportCategory, number>();
  for (const entry of history.entries) {
    historyByCategory.set(entry.category, (historyByCategory.get(entry.category) ?? 0) + 1);
  }

  const visitedCatalogIds = new Set(
    history.entries.flatMap((entry) =>
      entry.knownPlaceId?.startsWith('catalog:')
        ? [entry.knownPlaceId.slice('catalog:'.length)]
        : []
    )
  );
  // Do not infer identities from manually-entered text or URLs.
  const activePlannedCatalogIds = new Set(trip.items.flatMap((item) =>
    item.catalogPlaceId && item.status !== 'cancelled' && item.status !== 'skipped'
      ? [item.catalogPlaceId]
      : []
  ));

  let hiddenAsPlanned = 0;
  let hiddenAsVisited = 0;
  const eligible: MoscowNextDiscovery[] = [];
  for (const place of curatedMoscowPlaces) {
    if (visitedCatalogIds.has(place.id)) {
      hiddenAsVisited++;
      continue;
    }
    if (activePlannedCatalogIds.has(place.id)) {
      hiddenAsPlanned++;
      continue;
    }
    const candidateInterest = interestForPlace(place);
    if (interest !== 'all' && interest !== candidateInterest) continue;
    const category = passportCategoryForKind(kindForPlace(place));
    const relatedHistoryVisits = historyByCategory.get(category) ?? 0;
    eligible.push({
      place,
      interest: candidateInterest,
      category,
      relatedHistoryVisits,
      reason: relatedHistoryVisits > 0 ? 'similar-history-category' : 'another-category'
    });
  }

  // The category's appearance in past records is a transparent editorial hint,
  // not a learned user preference or a quality ranking.
  const prioritized = [...eligible].sort((a, b) =>
    b.relatedHistoryVisits - a.relatedHistoryVisits
    || curatedMoscowPlaces.indexOf(a.place) - curatedMoscowPlaces.indexOf(b.place)
  );

  // Ensure exposure to different kinds of leisure before repeating a category.
  const picked: MoscowNextDiscovery[] = [];
  const pickedInterests = new Set<MoscowNextDiscovery['interest']>();
  for (const item of prioritized) {
    if (pickedInterests.has(item.interest)) continue;
    picked.push(item);
    pickedInterests.add(item.interest);
  }
  for (const item of prioritized) {
    if (picked.includes(item)) continue;
    picked.push(item);
  }

  return {
    dayDate: input.dayDate,
    totalEligible: eligible.length,
    hiddenAsPlanned,
    hiddenAsVisited,
    unknownIdentityVisits: history.unknownIdentityVisitCount,
    suggestions: picked.slice(0, limit)
  };
}
