import type { AppLanguage } from '../i18n';
import { buildDemandControlCells, type DemandObservation } from './demandControlAuthority';
import {
  buildCityOpportunityCase,
  type PartnerProspect
} from './cityOpportunityAuthority';
import { demoDemandCells } from './demandControlDemo';

const baseline = demoDemandCells.find(
  (cell) =>
    cell.districtId === 'varvarka-zaryadye'
    && cell.intentKind === 'food'
    && cell.timeBucket === 'evening'
    && cell.status === 'OPPORTUNITY'
);

if (!baseline) {
  throw new Error('demo-opportunity-baseline-missing');
}

export const demoOpportunityProspects: PartnerProspect[] = [
  {
    id: 'prospect-a',
    mode: 'demo',
    displayName: 'Moscow Table Group · DEMO',
    legalEntityIdentified: true,
    eligibleIntentKinds: ['food'],
    supportedTimeBuckets: ['evening', 'night'],
    targetDistrictIds: ['varvarka-zaryadye'],
    expectedFreshSupplyUnits: 2,
    serviceQualityScore: 0.91,
    authoritativeFeedReady: true,
    providerConfirmationReady: true,
    onboardingLeadDays: 14,
    paidPromotionBudgetRub: 0
  },
  {
    id: 'prospect-b',
    mode: 'demo',
    displayName: 'Premium Dining Partner · DEMO',
    legalEntityIdentified: true,
    eligibleIntentKinds: ['food'],
    supportedTimeBuckets: ['evening'],
    targetDistrictIds: ['varvarka-zaryadye'],
    expectedFreshSupplyUnits: 3,
    serviceQualityScore: 0.84,
    authoritativeFeedReady: true,
    providerConfirmationReady: false,
    onboardingLeadDays: 10,
    paidPromotionBudgetRub: 500000
  },
  {
    id: 'prospect-c',
    mode: 'demo',
    displayName: 'City Cafe Network · DEMO',
    legalEntityIdentified: true,
    eligibleIntentKinds: ['food'],
    supportedTimeBuckets: ['day', 'evening'],
    targetDistrictIds: ['varvarka-zaryadye'],
    expectedFreshSupplyUnits: 1,
    serviceQualityScore: 0.77,
    authoritativeFeedReady: true,
    providerConfirmationReady: true,
    onboardingLeadDays: 30,
    paidPromotionBudgetRub: 1000000
  }
];

function makePostObservation(index: number): DemandObservation {
  const day = 11 + (index % 4);
  const unmet = index % 10 === 0;

  return {
    id: `post-food-evening-${index + 1}`,
    mode: 'demo',
    districtId: 'varvarka-zaryadye',
    intentKind: 'food',
    timeBucket: 'evening',
    observedAt: `2026-10-${day}T18:${String(index % 60).padStart(2, '0')}:00+03:00`,
    eligibleSupplyCount: 4,
    freshAvailableSupplyCount: unmet ? 2 : 3,
    bestOrganicScore: 0.86,
    handoffCreated: true,
    providerConfirmed: index % 5 !== 0,
    cancelledOrRefunded: index === 29
  };
}

export const demoOpportunityPostObservations = Array.from({ length: 36 }).map(
  (_, index) => makePostObservation(index)
);

export const demoOpportunityPostCell = buildDemandControlCells({
  observations: demoOpportunityPostObservations,
  mode: 'demo'
})[0] ?? null;

export const demoCityOpportunityCase = buildCityOpportunityCase({
  id: 'demo-opportunity-varvarka-food-evening',
  baseline,
  prospects: demoOpportunityProspects,
  selectedProspectId: 'prospect-a',
  onboardingEvidenceRef: 'DEMO-ONBOARDING-EVIDENCE-001',
  postOnboarding: demoOpportunityPostCell
});

export const cityOpportunityCopy = {
  ru: {
    kicker: 'CITY OPPORTUNITY ENGINE · DEMO',
    title: 'От устойчивого demand gap до доказанного результата после подключения партнёра',
    body: 'Shortlist строится по fit, operational quality, integration readiness и onboarding speed. Paid promotion budget не входит в score. После onboarding эффект измеряется заново по demand evidence.',
    brief: 'ACQUISITION BRIEF',
    shortlist: 'PARTNER SHORTLIST',
    impact: 'EXPECTED SUPPLY IMPACT',
    measurement: 'POST-ONBOARDING MEASUREMENT',
    outcome: 'OUTCOME',
    selected: 'ВЫБРАН',
    paidNeutral: 'Paid promotion budget не влияет на shortlist rank.',
    causality: 'До/после улучшение не доказывает причинность само по себе.'
  },
  en: {
    kicker: 'CITY OPPORTUNITY ENGINE · DEMO',
    title: 'From persistent demand gap to measured post-onboarding outcome',
    body: 'The shortlist uses fit, operational quality, integration readiness and onboarding speed. Paid promotion budget is excluded from score. After onboarding, the effect is measured again from demand evidence.',
    brief: 'ACQUISITION BRIEF',
    shortlist: 'PARTNER SHORTLIST',
    impact: 'EXPECTED SUPPLY IMPACT',
    measurement: 'POST-ONBOARDING MEASUREMENT',
    outcome: 'OUTCOME',
    selected: 'SELECTED',
    paidNeutral: 'Paid promotion budget does not affect shortlist rank.',
    causality: 'Before/after improvement does not establish causality by itself.'
  },
  zh: {
    kicker: 'CITY OPPORTUNITY ENGINE · 演示',
    title: '从持续需求缺口到合作伙伴接入后的实测结果',
    body: '候选排序依据 fit、运营质量、集成准备度和接入速度。付费推广预算不进入评分。合作伙伴接入后，再次根据需求证据测量效果。',
    brief: '合作伙伴拓展简报',
    shortlist: '合作伙伴候选列表',
    impact: '预期供给影响',
    measurement: '接入后测量',
    outcome: '结果',
    selected: '已选择',
    paidNeutral: '付费推广预算不会影响候选排名。',
    causality: '前后改善本身不能证明因果关系。'
  }
} as const satisfies Record<AppLanguage, Record<string, string>>;
