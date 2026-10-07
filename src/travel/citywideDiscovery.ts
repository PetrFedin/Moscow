import type {
  DestinationPackage,
  ExperienceNode,
  ExperienceNodeKind
} from './destinationPackage.ts';

export const CITYWIDE_DISCOVERY_VERSION = 1 as const;

export type CitywideCategoryId =
  | 'culture'
  | 'history'
  | 'food'
  | 'night'
  | 'events'
  | 'parks'
  | 'shopping'
  | 'family'
  | 'wellness'
  | 'views';

export type CitywideCategory = {
  id: CitywideCategoryId;
  titleRu: string;
  titleEn: string;
  kinds: ExperienceNodeKind[];
};

export const citywideCategories: CitywideCategory[] = [
  {
    id: 'culture',
    titleRu: 'Музеи · выставки · театры',
    titleEn: 'Museums · exhibitions · theatres',
    kinds: ['museum', 'gallery', 'exhibition', 'theatre', 'cinema', 'concert']
  },
  {
    id: 'history',
    titleRu: 'История · архитектура · знаковые места',
    titleEn: 'History · architecture · landmarks',
    kinds: ['heritage', 'historical-site', 'landmark']
  },
  {
    id: 'food',
    titleRu: 'Рестораны · кафе · бары',
    titleEn: 'Restaurants · cafes · bars',
    kinds: ['restaurant', 'cafe', 'bar', 'food', 'market']
  },
  {
    id: 'night',
    titleRu: 'Вечер · бары · ночная жизнь',
    titleEn: 'Evening · bars · nightlife',
    kinds: ['bar', 'nightlife', 'concert', 'event']
  },
  {
    id: 'events',
    titleRu: 'События · концерты · выставки',
    titleEn: 'Events · concerts · exhibitions',
    kinds: ['event', 'concert', 'exhibition', 'theatre']
  },
  {
    id: 'parks',
    titleRu: 'Парки · прогулки · природа',
    titleEn: 'Parks · walks · nature',
    kinds: ['park', 'nature', 'activity', 'viewpoint']
  },
  {
    id: 'shopping',
    titleRu: 'Шопинг · рынки',
    titleEn: 'Shopping · markets',
    kinds: ['shopping', 'market']
  },
  {
    id: 'family',
    titleRu: 'С детьми',
    titleEn: 'Family',
    kinds: ['kids', 'museum', 'park', 'activity']
  },
  {
    id: 'wellness',
    titleRu: 'Спорт · wellness',
    titleEn: 'Sport · wellness',
    kinds: ['sport', 'wellness', 'activity']
  },
  {
    id: 'views',
    titleRu: 'Панорамы · красивые места',
    titleEn: 'Views · scenic places',
    kinds: ['viewpoint', 'landmark', 'park']
  }
];

export type CitywideDiscoveryQuery = {
  categoryIds?: CitywideCategoryId[];
  kinds?: ExperienceNodeKind[];
  district?: string;
  priceBands?: ExperienceNode['priceBand'][];
  indoorOutdoor?: ExperienceNode['indoorOutdoor'];
  bookableOnly?: boolean;
  audience?: NonNullable<ExperienceNode['audience']>[number];
  tags?: string[];
};

function categoryKinds(ids: CitywideCategoryId[] | undefined) {
  if (!ids?.length) return [];
  const selected = new Set(ids);
  return citywideCategories
    .filter((category) => selected.has(category.id))
    .flatMap((category) => category.kinds);
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('ru-RU');
}

export function filterCityExperiences(
  pkg: DestinationPackage,
  query: CitywideDiscoveryQuery
): ExperienceNode[] {
  const requestedKinds = new Set([
    ...(query.kinds ?? []),
    ...categoryKinds(query.categoryIds)
  ]);
  const priceBands = new Set(query.priceBands ?? []);
  const requestedTags = (query.tags ?? []).map(normalize).filter(Boolean);

  return pkg.nodes.filter((node) => {
    if (requestedKinds.size > 0 && !requestedKinds.has(node.kind)) return false;
    if (query.district && normalize(node.district ?? '') !== normalize(query.district)) return false;
    if (priceBands.size > 0 && (!node.priceBand || !priceBands.has(node.priceBand))) return false;
    if (query.indoorOutdoor && node.indoorOutdoor !== query.indoorOutdoor) return false;
    if (query.bookableOnly && !node.booking) return false;
    if (query.audience && !node.audience?.includes(query.audience)) return false;
    if (requestedTags.length > 0) {
      const tags = new Set(node.tags.map(normalize));
      if (!requestedTags.every((tag) => tags.has(tag))) return false;
    }
    return true;
  });
}

export function getCitywideCategoryCounts(pkg: DestinationPackage) {
  return Object.fromEntries(
    citywideCategories.map((category) => [
      category.id,
      filterCityExperiences(pkg, { categoryIds: [category.id] }).length
    ])
  ) as Record<CitywideCategoryId, number>;
}
