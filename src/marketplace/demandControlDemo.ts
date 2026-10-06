import type { AppLanguage } from '../i18n';
import {
  buildCityDevelopmentSignal,
  buildDemandControlCells,
  buildPartnerQualitySnapshots,
  type DemandObservation,
  type PartnerQualityObservation
} from './demandControlAuthority';

function makeObservation({
  id,
  mode,
  districtId,
  intentKind,
  timeBucket,
  observedAt,
  eligibleSupplyCount,
  freshAvailableSupplyCount,
  handoffCreated,
  providerConfirmed,
  cancelledOrRefunded = false
}: {
  id: string;
  mode: 'actual' | 'demo';
  districtId: string;
  intentKind: 'food' | 'culture' | 'event' | 'stay' | 'shopping' | 'rest' | 'family';
  timeBucket: 'morning' | 'day' | 'evening' | 'night';
  observedAt: string;
  eligibleSupplyCount: number;
  freshAvailableSupplyCount: number;
  handoffCreated: boolean;
  providerConfirmed: boolean;
  cancelledOrRefunded?: boolean;
}): DemandObservation {
  return {
    id,
    mode,
    districtId,
    intentKind,
    timeBucket,
    observedAt,
    eligibleSupplyCount,
    freshAvailableSupplyCount,
    bestOrganicScore: freshAvailableSupplyCount > 0 ? 0.78 : null,
    handoffCreated,
    providerConfirmed,
    cancelledOrRefunded
  };
}

export const actualDemandObservations: DemandObservation[] = [];

export const demoDemandObservations: DemandObservation[] = Array.from({ length: 36 }).map((_, index) => {
  const day = 1 + (index % 4);
  const confirmed = index % 5 === 0;
  const unmet = index % 2 === 0 || index % 3 === 0;

  return makeObservation({
    id: `demo-food-evening-${index + 1}`,
    mode: 'demo',
    districtId: 'varvarka-zaryadye',
    intentKind: 'food',
    timeBucket: 'evening',
    observedAt: `2026-10-0${day}T18:${String(index % 60).padStart(2, '0')}:00+03:00`,
    eligibleSupplyCount: 2,
    freshAvailableSupplyCount: unmet ? 0 : 1,
    handoffCreated: !unmet,
    providerConfirmed: confirmed
  });
}).concat(
  Array.from({ length: 34 }).map((_, index) => {
    const day = 1 + (index % 4);
    return makeObservation({
      id: `demo-culture-day-${index + 1}`,
      mode: 'demo',
      districtId: 'varvarka-zaryadye',
      intentKind: 'culture',
      timeBucket: 'day',
      observedAt: `2026-10-0${day}T13:${String(index % 60).padStart(2, '0')}:00+03:00`,
      eligibleSupplyCount: 5,
      freshAvailableSupplyCount: 4,
      handoffCreated: index % 3 !== 0,
      providerConfirmed: index % 4 !== 0
    });
  })
);

export const demoPartnerQualityObservations: PartnerQualityObservation[] = Array.from({ length: 14 }).map(
  (_, index) => ({
    partnerId: 'demo-partner-zaryadye-dining',
    mode: 'demo' as const,
    districtId: 'varvarka-zaryadye',
    intentKind: 'food' as const,
    observedAt: `2026-10-0${1 + (index % 4)}T18:00:00+03:00`,
    feedFresh: index !== 12,
    providerConfirmed: index % 3 !== 0,
    cancelledOrRefunded: index === 11,
    serviceQualityScore: 0.88
  })
);

export const actualDemandCells = buildDemandControlCells({
  observations: actualDemandObservations,
  mode: 'actual'
});

export const demoDemandCells = buildDemandControlCells({
  observations: demoDemandObservations,
  mode: 'demo'
});

export const demoPartnerQuality = buildPartnerQualitySnapshots({
  observations: demoPartnerQualityObservations,
  mode: 'demo'
});

export const demoDevelopmentSignals = demoDemandCells.map(buildCityDevelopmentSignal);

export const demandControlCopy = {
  ru: {
    kicker: 'DEMAND MARKETPLACE CONTROL TOWER',
    title: 'Где спрос уже есть, а качественного предложения пока не хватает',
    body: 'Система агрегирует privacy-safe intent evidence по району, категории и времени. Opportunity — это сигнал для проверки и partner acquisition, а не разрешение на инвестиции или строительство.',
    actual: 'ACTUAL',
    demo: 'DEMO',
    demandGaps: 'Разрывы спроса',
    supplyCoverage: 'Покрытие предложения',
    partnerQuality: 'Качество партнёров',
    conversion: 'Конверсия',
    unmetIntent: 'Незакрытый intent',
    districtOpportunity: 'Возможность района',
    acquisition: 'Partner acquisition',
    citySignal: 'Сигнал развития',
    noActual: 'Пока нет достаточного ACTUAL demand evidence. Система не формирует opportunity из пустых данных.',
    prohibited: 'Не является инвестиционным, градостроительным или закупочным решением.'
  },
  en: {
    kicker: 'DEMAND MARKETPLACE CONTROL TOWER',
    title: 'Where demand already exists but quality supply is still insufficient',
    body: 'The system aggregates privacy-safe intent evidence by district, category and time. Opportunity is a signal for validation and partner acquisition, not an investment or construction authorization.',
    actual: 'ACTUAL',
    demo: 'DEMO',
    demandGaps: 'Demand gaps',
    supplyCoverage: 'Supply coverage',
    partnerQuality: 'Partner quality',
    conversion: 'Conversion',
    unmetIntent: 'Unmet intent',
    districtOpportunity: 'District opportunity',
    acquisition: 'Partner acquisition',
    citySignal: 'City development signal',
    noActual: 'There is not yet enough ACTUAL demand evidence. The system does not create an opportunity from empty data.',
    prohibited: 'Not an investment, planning or procurement decision.'
  },
  zh: {
    kicker: 'DEMAND MARKETPLACE CONTROL TOWER',
    title: '哪里已经存在需求，但高质量供给仍然不足',
    body: '系统按区域、类别和时间聚合隐私安全的需求意图证据。Opportunity 只是验证和合作伙伴拓展信号，不等于投资或建设授权。',
    actual: '实际',
    demo: '演示',
    demandGaps: '需求缺口',
    supplyCoverage: '供给覆盖',
    partnerQuality: '合作伙伴质量',
    conversion: '转化',
    unmetIntent: '未满足需求',
    districtOpportunity: '区域机会',
    acquisition: '合作伙伴拓展',
    citySignal: '城市发展信号',
    noActual: '目前还没有足够的 ACTUAL 需求证据。系统不会从空数据中生成机会。',
    prohibited: '不构成投资、规划或采购决定。'
  }
} as const satisfies Record<AppLanguage, Record<string, string>>;
