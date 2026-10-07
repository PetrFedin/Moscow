import type { AppLanguage } from '../i18n';
import {
  MARKETPLACE_RANKING_POLICY_V1,
  rankMarketplaceCandidates,
  type MarketplaceCandidate,
  type MarketplaceIntent
} from './demandRankingAuthority.ts';

export const demoMarketplaceIntent: MarketplaceIntent = {
  id: 'demo-intent-evening-food',
  kind: 'food',
  requiredTags: ['dinner'],
  preferredTags: ['near-route', 'quiet', 'local'],
  maximumDistanceMeters: 1500,
  availableMinutes: 120,
  availabilityRequirement: 'live-required'
};

export const demoMarketplaceCandidates: MarketplaceCandidate[] = [
  {
    id: 'demo-organic-a',
    partnerId: 'demo-partner-zaryadye-dining',
    title: 'Zaryadye Dining · DEMO',
    kind: 'food',
    tags: ['dinner', 'near-route', 'quiet', 'local'],
    distanceMeters: 420,
    estimatedDurationMinutes: 90,
    partnerVerified: true,
    published: true,
    serviceQualityScore: 0.92,
    availability: {
      state: 'available',
      checkedAt: '2026-10-06T18:00:00+03:00',
      freshnessSlaMinutes: 15,
      authoritative: true
    },
    sponsor: {
      active: false,
      contractRef: null,
      disclosureLabel: null
    }
  },
  {
    id: 'demo-sponsored-b',
    partnerId: 'demo-partner-sponsored',
    title: 'Moscow River Dinner · DEMO SPONSORED',
    kind: 'food',
    tags: ['dinner', 'near-route', 'local'],
    distanceMeters: 650,
    estimatedDurationMinutes: 100,
    partnerVerified: true,
    published: true,
    serviceQualityScore: 0.88,
    availability: {
      state: 'limited',
      checkedAt: '2026-10-06T18:00:00+03:00',
      freshnessSlaMinutes: 15,
      authoritative: true
    },
    sponsor: {
      active: true,
      contractRef: 'DEMO-SPONSOR-CONTRACT-001',
      disclosureLabel: 'Реклама · DEMO'
    }
  },
  {
    id: 'demo-organic-c',
    partnerId: 'demo-partner-cafe',
    title: 'Varvarka Cafe · DEMO',
    kind: 'food',
    tags: ['dinner', 'near-route'],
    distanceMeters: 300,
    estimatedDurationMinutes: 70,
    partnerVerified: true,
    published: true,
    serviceQualityScore: 0.74,
    availability: {
      state: 'available',
      checkedAt: '2026-10-06T18:00:00+03:00',
      freshnessSlaMinutes: 15,
      authoritative: true
    },
    sponsor: {
      active: false,
      contractRef: null,
      disclosureLabel: null
    }
  },
  {
    id: 'demo-stale-d',
    partnerId: 'demo-partner-stale',
    title: 'Old Availability Restaurant · DEMO',
    kind: 'food',
    tags: ['dinner', 'near-route', 'quiet'],
    distanceMeters: 250,
    estimatedDurationMinutes: 80,
    partnerVerified: true,
    published: true,
    serviceQualityScore: 0.9,
    availability: {
      state: 'available',
      checkedAt: '2026-10-06T17:15:00+03:00',
      freshnessSlaMinutes: 15,
      authoritative: true
    },
    sponsor: {
      active: true,
      contractRef: 'DEMO-SPONSOR-CONTRACT-STALE',
      disclosureLabel: 'Реклама · DEMO'
    }
  }
];

export const demoMarketplaceRanking = rankMarketplaceCandidates({
  intent: demoMarketplaceIntent,
  candidates: demoMarketplaceCandidates,
  now: '2026-10-06T18:05:00+03:00',
  policy: MARKETPLACE_RANKING_POLICY_V1
});

export const marketplaceDemoCopy = {
  ru: {
    kicker: 'MARKETPLACE & DEMAND ENGINE · DEMO',
    title: 'Контекстный спрос без покупки органического места',
    body: 'Сначала eligibility + availability gates, затем organic ranking. Sponsorship существует отдельно и не меняет organicRank.',
    organic: 'ОРГАНИЧЕСКИЙ РЕЙТИНГ',
    sponsored: 'СПОНСОРСКИЙ СЛОЙ',
    excluded: 'ИСКЛЮЧЕНО',
    intent: 'INTENT',
    score: 'Organic score',
    rank: 'Organic rank',
    noSponsored: 'Нет eligible sponsored placement.',
    policy: 'Ranking policy'
  },
  en: {
    kicker: 'MARKETPLACE & DEMAND ENGINE · DEMO',
    title: 'Contextual demand without buying organic position',
    body: 'Eligibility and availability gates run first, then organic ranking. Sponsorship is separate and cannot change organicRank.',
    organic: 'ORGANIC RANKING',
    sponsored: 'SPONSORED LAYER',
    excluded: 'EXCLUDED',
    intent: 'INTENT',
    score: 'Organic score',
    rank: 'Organic rank',
    noSponsored: 'No eligible sponsored placement.',
    policy: 'Ranking policy'
  },
  zh: {
    kicker: 'MARKETPLACE & DEMAND ENGINE · 演示',
    title: '基于情境的需求，而不是购买自然排序位置',
    body: '先经过 eligibility 与 availability gates，再进行自然排序。赞助层独立存在，不能改变 organicRank。',
    organic: '自然排序',
    sponsored: '赞助层',
    excluded: '已排除',
    intent: '需求意图',
    score: '自然分数',
    rank: '自然排名',
    noSponsored: '没有符合条件的赞助展示。',
    policy: '排序策略'
  }
} as const satisfies Record<AppLanguage, Record<string, string>>;
