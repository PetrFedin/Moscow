import type { AppLanguage } from '../i18n';
import { demoDemandCells } from './demandControlDemo.ts';
import {
  baselineFromDemandCell,
  simulateDistrictTwin,
  type DistrictTwinAssumptionSet,
  type DistrictTwinScenarioInput
} from './districtEconomicTwinAuthority.ts';

const foodEvening = demoDemandCells.find(
  (cell) =>
    cell.districtId === 'varvarka-zaryadye'
    && cell.intentKind === 'food'
    && cell.timeBucket === 'evening'
)!;

const cultureDay = demoDemandCells.find(
  (cell) =>
    cell.districtId === 'varvarka-zaryadye'
    && cell.intentKind === 'culture'
    && cell.timeBucket === 'day'
)!;

export const demoTwinAssumptions: DistrictTwinAssumptionSet = {
  id: 'demo-twin-assumptions-v1',
  version: '1.0.0',
  provenance: 'demo-assumption',
  calibratedAt: null,
  evidenceRefs: [],
  unmetReductionPerCoveragePoint: 0.65,
  confirmedDemandLiftPerProviderConfirmationPoint: 0.5,
  grossContributionRubPerConfirmedDemandIndexPoint: 15000
};

export const demoFoodBaseline = baselineFromDemandCell({
  id: 'baseline-food-evening',
  cell: foodEvening,
  footfallIndex: 100,
  partnerGrossContributionRub: 250000
});

export const demoCultureBaseline = baselineFromDemandCell({
  id: 'baseline-culture-day',
  cell: cultureDay,
  footfallIndex: 120,
  partnerGrossContributionRub: 180000
});

const scenarios: DistrictTwinScenarioInput[] = [
  {
    id: 'scenario-add-3-restaurants',
    baseline: demoFoodBaseline,
    assumptions: demoTwinAssumptions,
    interventions: [
      {
        id: 'add-restaurants',
        type: 'add-supply',
        label: '+3 restaurants',
        addedFreshSupplyUnits: 3
      }
    ]
  },
  {
    id: 'scenario-extend-museum-hours',
    baseline: demoCultureBaseline,
    assumptions: demoTwinAssumptions,
    interventions: [
      {
        id: 'extend-museum-hours',
        type: 'extend-hours',
        label: '+2 museum hours',
        addedServiceHours: 2,
        equivalentFreshSupplyUnits: 1
      }
    ]
  },
  {
    id: 'scenario-evening-route',
    baseline: demoFoodBaseline,
    assumptions: demoTwinAssumptions,
    interventions: [
      {
        id: 'evening-route',
        type: 'evening-route',
        label: 'Evening route',
        expectedDemandRedistributionShare: 0.15,
        expectedFootfallIndexDelta: 12
      }
    ]
  },
  {
    id: 'scenario-ticket-provider',
    baseline: demoCultureBaseline,
    assumptions: demoTwinAssumptions,
    interventions: [
      {
        id: 'ticket-provider',
        type: 'ticket-provider',
        label: 'New ticket provider',
        expectedProviderConfirmationDelta: 0.12
      }
    ]
  }
];

export const demoTwinScenarios = scenarios.map(simulateDistrictTwin);

export const districtTwinCopy = {
  ru: {
    kicker: 'DISTRICT ECONOMIC DIGITAL TWIN · DEMO',
    title: 'Что изменится, если вмешаться в supply, часы работы, маршрут или provider layer',
    body: 'Сценарии отделены от факта. Все коэффициенты в DEMO — assumptions. Для production прогнозов нужны measured calibration и evidence refs.',
    baseline: 'BASELINE',
    intervention: 'INTERVENTION',
    expected: 'EXPECTED',
    delta: 'DELTA',
    verification: 'POST-LAUNCH VERIFICATION',
    assumption: 'DEMO ASSUMPTION',
    noCausality: 'Сценарий не является доказанным исходом, инвестиционным решением или причинным выводом.'
  },
  en: {
    kicker: 'DISTRICT ECONOMIC DIGITAL TWIN · DEMO',
    title: 'What changes if supply, opening hours, routing or provider layer changes',
    body: 'Scenarios are separated from fact. All DEMO coefficients are assumptions. Production forecasting requires measured calibration and evidence refs.',
    baseline: 'BASELINE',
    intervention: 'INTERVENTION',
    expected: 'EXPECTED',
    delta: 'DELTA',
    verification: 'POST-LAUNCH VERIFICATION',
    assumption: 'DEMO ASSUMPTION',
    noCausality: 'The scenario is not a proven outcome, investment decision or causal conclusion.'
  },
  zh: {
    kicker: 'DISTRICT ECONOMIC DIGITAL TWIN · 演示',
    title: '如果改变供给、开放时间、路线或服务商层，会发生什么',
    body: '场景与事实严格分离。DEMO 中的全部系数都是假设。Production 预测需要实测校准和 evidence refs。',
    baseline: '基线',
    intervention: '干预',
    expected: '预期',
    delta: '变化',
    verification: '上线后验证',
    assumption: '演示假设',
    noCausality: '该场景不构成已证明结果、投资决定或因果结论。'
  }
} as const satisfies Record<AppLanguage, Record<string,string>>;
