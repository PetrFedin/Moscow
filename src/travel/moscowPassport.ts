import type { DestinationPackage } from './destinationPackage.ts';
import type {
  PersonalTrip,
  PersonalTripItemKind,
  PersonalTripVisit
} from './personalTrip.ts';

export type MoscowPassportCategory =
  | 'saw'
  | 'ate'
  | 'nightlife'
  | 'culture'
  | 'activity'
  | 'shopping'
  | 'stay'
  | 'transport'
  | 'other';

export type MoscowPassportEntry = {
  visit: PersonalTripVisit;
  kind: PersonalTripItemKind;
  category: MoscowPassportCategory;
};

export type MoscowPassportDay = {
  dayDate: string;
  entries: MoscowPassportEntry[];
  categoryCounts: Record<MoscowPassportCategory, number>;
};

export type MoscowPassport = {
  tripId: string;
  visitedCount: number;
  daysVisited: number;
  categoryCounts: Record<MoscowPassportCategory, number>;
  days: MoscowPassportDay[];
  evidenceCounts: Record<PersonalTripVisit['evidence'], number>;
};

const categories: MoscowPassportCategory[] = [
  'saw',
  'ate',
  'nightlife',
  'culture',
  'activity',
  'shopping',
  'stay',
  'transport',
  'other'
];

function emptyCategoryCounts(): Record<MoscowPassportCategory, number> {
  return {
    saw: 0,
    ate: 0,
    nightlife: 0,
    culture: 0,
    activity: 0,
    shopping: 0,
    stay: 0,
    transport: 0,
    other: 0
  };
}

function emptyEvidenceCounts(): Record<PersonalTripVisit['evidence'], number> {
  return {
    'user-confirmed': 0,
    'route-completed': 0,
    'provider-receipt': 0,
    proximity: 0
  };
}

export function passportCategoryForKind(kind: PersonalTripItemKind): MoscowPassportCategory {
  switch (kind) {
    case 'heritage':
    case 'historical-site':
    case 'landmark':
    case 'museum':
    case 'gallery':
    case 'nature':
    case 'park':
    case 'viewpoint':
      return 'saw';
    case 'food':
    case 'restaurant':
    case 'cafe':
      return 'ate';
    case 'bar':
    case 'nightlife':
      return 'nightlife';
    case 'event':
    case 'theatre':
    case 'cinema':
    case 'concert':
    case 'exhibition':
      return 'culture';
    case 'activity':
    case 'wellness':
    case 'sport':
    case 'kids':
      return 'activity';
    case 'shopping':
    case 'market':
      return 'shopping';
    case 'stay':
      return 'stay';
    case 'transport':
      return 'transport';
    default:
      return 'other';
  }
}

export function resolveVisitKind(input: {
  trip: PersonalTrip;
  visit: PersonalTripVisit;
  pkg?: DestinationPackage;
}): PersonalTripItemKind {
  if (input.visit.kind) return input.visit.kind;

  if (input.visit.itemId) {
    const item = input.trip.items.find((candidate) => candidate.id === input.visit.itemId);
    if (item) return item.kind;
  }

  if (input.visit.destinationNodeId && input.pkg) {
    const node = input.pkg.nodes.find((candidate) => candidate.id === input.visit.destinationNodeId);
    if (node) return node.kind;
  }

  return 'other';
}

export function buildMoscowPassport(input: {
  trip: PersonalTrip;
  pkg?: DestinationPackage;
}): MoscowPassport {
  const entries = [...input.trip.visits]
    .sort((a, b) => a.visitedAt.localeCompare(b.visitedAt))
    .map((visit): MoscowPassportEntry => {
      const kind = resolveVisitKind({ trip: input.trip, visit, pkg: input.pkg });
      return {
        visit,
        kind,
        category: passportCategoryForKind(kind)
      };
    });

  const categoryCounts = emptyCategoryCounts();
  const evidenceCounts = emptyEvidenceCounts();
  const byDay = new Map<string, MoscowPassportEntry[]>();

  for (const entry of entries) {
    categoryCounts[entry.category] += 1;
    evidenceCounts[entry.visit.evidence] += 1;
    const existing = byDay.get(entry.visit.dayDate) ?? [];
    existing.push(entry);
    byDay.set(entry.visit.dayDate, existing);
  }

  const days = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dayDate, dayEntries]): MoscowPassportDay => {
      const dayCounts = emptyCategoryCounts();
      for (const entry of dayEntries) dayCounts[entry.category] += 1;
      return {
        dayDate,
        entries: dayEntries,
        categoryCounts: dayCounts
      };
    });

  return {
    tripId: input.trip.id,
    visitedCount: entries.length,
    daysVisited: days.length,
    categoryCounts,
    days,
    evidenceCounts
  };
}

export function passportNonEmptyCategories(passport: MoscowPassport) {
  return categories.filter((category) => passport.categoryCounts[category] > 0);
}
