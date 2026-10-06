import type { AppLanguage } from '../i18n';
import { demoTwinScenarios } from './districtEconomicTwinDemo.ts';
import {
  optimizeDistrictPortfolio,
  type CapitalOption
} from './districtPortfolioOptimizer.ts';

function findScenario(id: string) {
  const scenario = demoTwinScenarios.find((item) => item.id === id);
  if (!scenario) throw new Error(`missing-demo-scenario:${id}`);
  return scenario;
}

export const demoCapitalOptions: CapitalOption[] = [
  {
    id: 'capital-add-3-restaurants',
    mode: 'demo',
    scenario: findScenario('scenario-add-3-restaurants'),
    requiredCapitalRub: 180000000,
    implementationDays: 120,
    evidenceConfidence: 0.62,
    riskPenalty: 0.28,
    mutuallyExclusiveGroup: null
  },
  {
    id: 'capital-extend-museum-hours',
    mode: 'demo',
    scenario: findScenario('scenario-extend-museum-hours'),
    requiredCapitalRub: 45000000,
    implementationDays: 30,
    evidenceConfidence: 0.72,
    riskPenalty: 0.12,
    mutuallyExclusiveGroup: null
  },
  {
    id: 'capital-evening-route',
    mode: 'demo',
    scenario: findScenario('scenario-evening-route'),
    requiredCapitalRub: 80000000,
    implementationDays: 45,
    evidenceConfidence: 0.66,
    riskPenalty: 0.18,
    mutuallyExclusiveGroup: null
  },
  {
    id: 'capital-ticket-provider',
    mode: 'demo',
    scenario: findScenario('scenario-ticket-provider'),
    requiredCapitalRub: 60000000,
    implementationDays: 60,
    evidenceConfidence: 0.78,
    riskPenalty: 0.16,
    mutuallyExclusiveGroup: null
  }
];

export const demoDistrictPortfolio = optimizeDistrictPortfolio({
  id: 'demo-varvarka-portfolio-300m',
  mode: 'demo',
  budgetRub: 300000000,
  options: demoCapitalOptions
});

export const districtPortfolioCopy = {
  ru: {
    kicker: 'DISTRICT PORTFOLIO OPTIMIZER · DEMO',
    title: 'Как распределить ограниченный бюджет между альтернативными интервенциями',
    body: 'Optimizer сравнивает варианты по ожидаемому эффекту, сроку, confidence, риску и capital efficiency. Он формирует shortlist, но не принимает инвестиционное или закупочное решение.',
    budget: 'БЮДЖЕТ',
    selected: 'CAPITAL ALLOCATION SHORTLIST',
    rejected: 'НЕ ВОШЛО В SHORTLIST',
    impact: 'EXPECTED PORTFOLIO IMPACT',
    remaining: 'ОСТАТОК БЮДЖЕТА',
    score: 'score',
    capital: 'capital',
    lead: 'implementation',
    confidence: 'confidence',
    risk: 'risk',
    rule: 'RECOMMENDATION ONLY · human approval required'
  },
  en: {
    kicker: 'DISTRICT PORTFOLIO OPTIMIZER · DEMO',
    title: 'How to allocate a constrained budget across alternative interventions',
    body: 'The optimizer compares options by expected impact, lead time, confidence, risk and capital efficiency. It produces a shortlist but does not make an investment or procurement decision.',
    budget: 'BUDGET',
    selected: 'CAPITAL ALLOCATION SHORTLIST',
    rejected: 'NOT SELECTED',
    impact: 'EXPECTED PORTFOLIO IMPACT',
    remaining: 'BUDGET REMAINING',
    score: 'score',
    capital: 'capital',
    lead: 'implementation',
    confidence: 'confidence',
    risk: 'risk',
    rule: 'RECOMMENDATION ONLY · human approval required'
  },
  zh: {
    kicker: 'DISTRICT PORTFOLIO OPTIMIZER · 演示',
    title: '如何在预算约束下分配不同干预方案的资本',
    body: 'Optimizer 根据预期效果、实施周期、置信度、风险和资本效率比较方案。系统只生成候选组合，不做投资或采购决定。',
    budget: '预算',
    selected: '资本配置候选组合',
    rejected: '未进入组合',
    impact: '预期组合影响',
    remaining: '剩余预算',
    score: '评分',
    capital: '资本',
    lead: '实施周期',
    confidence: '置信度',
    risk: '风险',
    rule: '仅供建议 · 必须人工审批'
  }
} as const satisfies Record<AppLanguage, Record<string,string>>;
