import type { AppLanguage } from '../i18n';
import {
  buildCapitalProgrammeSnapshot,
  type CapitalProgrammeCase
} from './cityCapitalProgrammeAuthority.ts';
import {
  demoInvestmentCommitteeWorkspace
} from './cityInvestmentCommitteeDemo.ts';

const supportedCase: CapitalProgrammeCase = {
  id: 'programme-case-varvarka',
  mode: 'demo',
  programmeId: 'demo-moscow-tourism-capital-programme',
  districtId: 'varvarka-zaryadye',
  priority: 'CORE',
  workspace: demoInvestmentCommitteeWorkspace
};

const mixedCase: CapitalProgrammeCase = {
  id: 'programme-case-museum-quarter',
  mode: 'demo',
  programmeId: 'demo-moscow-tourism-capital-programme',
  districtId: 'museum-quarter',
  priority: 'HIGH',
  workspace: {
    ...demoInvestmentCommitteeWorkspace,
    businessCase: {
      ...demoInvestmentCommitteeWorkspace.businessCase,
      id: 'demo-investment-case-museum-quarter',
      districtId: 'museum-quarter',
      title: 'Museum Quarter evening access · DEMO',
      requestedCapitalRub: 70000000
    },
    commitment: {
      businessCaseId: 'demo-investment-case-museum-quarter',
      amountRub: 70000000,
      committedAt: '2026-10-06T12:00:00+03:00',
      authorityRef: 'DEMO-COMMIT-MUSEUM',
      state: 'COMMITTED'
    },
    execution: [
      {
        id: 'museum-hours',
        label: '+2 museum hours',
        plannedCapitalRub: 70000000,
        actualCapitalRub: 42000000,
        status: 'ACCEPTED',
        evidenceRefs: ['DEMO-MUSEUM-EXEC'],
        acceptanceRef: 'DEMO-MUSEUM-ACC'
      }
    ],
    portfolioVerification: {
      portfolioId: 'demo-museum-portfolio',
      verifiedOptions: 2,
      insufficientOptions: 0,
      directionallyVerified: 1,
      missedDirection: 1,
      totalActualCapitalRub: 42000000,
      conclusion: 'MIXED',
      causality: 'not-established'
    },
    benefitsReview: {
      businessCaseId: 'demo-investment-case-museum-quarter',
      evidenceRefs: ['DEMO-MUSEUM-BENEFITS'],
      observed: {
        unmetIntentDelta: -0.08,
        footfallIndexDelta: 6,
        confirmedDemandDelta: 0.02,
        partnerGrossContributionDeltaRub: 50000
      },
      comparison: {
        unmetIntentForecastError: 0.03,
        footfallForecastError: -2,
        confirmedDemandForecastError: -0.01,
        partnerEconomicsForecastErrorRub: -20000
      },
      outcome: 'MIXED',
      causality: 'not-established'
    }
  }
};

const executingCase: CapitalProgrammeCase = {
  id: 'programme-case-evening-route',
  mode: 'demo',
  programmeId: 'demo-moscow-tourism-capital-programme',
  districtId: 'central-evening-route',
  priority: 'STANDARD',
  workspace: {
    ...demoInvestmentCommitteeWorkspace,
    businessCase: {
      ...demoInvestmentCommitteeWorkspace.businessCase,
      id: 'demo-investment-case-evening-route',
      districtId: 'central-evening-route',
      title: 'Evening cultural route · DEMO',
      requestedCapitalRub: 80000000
    },
    commitment: {
      businessCaseId: 'demo-investment-case-evening-route',
      amountRub: 80000000,
      committedAt: '2026-10-06T12:30:00+03:00',
      authorityRef: 'DEMO-COMMIT-ROUTE',
      state: 'COMMITTED'
    },
    execution: [
      {
        id: 'route-launch',
        label: 'Evening route launch',
        plannedCapitalRub: 80000000,
        actualCapitalRub: 30000000,
        status: 'IN_PROGRESS',
        evidenceRefs: ['DEMO-ROUTE-PROGRESS'],
        acceptanceRef: null
      }
    ],
    portfolioVerification: null,
    benefitsReview: null
  }
};

export const demoCapitalProgrammeCases: CapitalProgrammeCase[] = [
  supportedCase,
  mixedCase,
  executingCase
];

export const demoCapitalProgrammeSnapshot = buildCapitalProgrammeSnapshot({
  programmeId: 'demo-moscow-tourism-capital-programme',
  mode: 'demo',
  authorizedEnvelopeRub: 500000000,
  cases: demoCapitalProgrammeCases
});

export const capitalProgrammeCopy = {
  ru: {
    kicker: 'CITY CAPITAL PROGRAMME CONTROL TOWER · DEMO',
    title: 'Весь городской инвестиционный портфель: деньги, исполнение, эффект и возможность перераспределения',
    body: 'Control Tower показывает committed capital, actual spend, execution progress, benefits realization и forecast accuracy по всем инвестиционным кейсам. Reallocation остаётся proposal-only до отдельного review/decommitment/approval.',
    envelope: 'PROGRAMME ENVELOPE',
    committed: 'COMMITTED',
    actual: 'ACTUAL SPEND',
    progress: 'EXECUTION PROGRESS',
    benefits: 'BENEFITS REALIZATION',
    forecast: 'FORECAST ACCURACY',
    underperforming: 'UNDERPERFORMING INTERVENTIONS',
    reallocation: 'REALLOCATION OPPORTUNITIES',
    rule: 'NO AUTO-REALLOCATION · human governance required'
  },
  en: {
    kicker: 'CITY CAPITAL PROGRAMME CONTROL TOWER · DEMO',
    title: 'The full city investment portfolio: capital, execution, benefits and reallocation opportunity',
    body: 'The Control Tower shows committed capital, actual spend, execution progress, benefits realization and forecast accuracy across all investment cases. Reallocation remains proposal-only until separate review, decommitment and approval.',
    envelope: 'PROGRAMME ENVELOPE',
    committed: 'COMMITTED',
    actual: 'ACTUAL SPEND',
    progress: 'EXECUTION PROGRESS',
    benefits: 'BENEFITS REALIZATION',
    forecast: 'FORECAST ACCURACY',
    underperforming: 'UNDERPERFORMING INTERVENTIONS',
    reallocation: 'REALLOCATION OPPORTUNITIES',
    rule: 'NO AUTO-REALLOCATION · human governance required'
  },
  zh: {
    kicker: 'CITY CAPITAL PROGRAMME CONTROL TOWER · 演示',
    title: '完整城市投资组合：资本、执行、效益与再配置机会',
    body: 'Control Tower 汇总所有投资案例的已承诺资本、实际支出、执行进度、效益实现和预测准确度。再配置在独立审核、解除承诺和审批前始终只是建议。',
    envelope: '项目资金池',
    committed: '已承诺',
    actual: '实际支出',
    progress: '执行进度',
    benefits: '效益实现',
    forecast: '预测准确度',
    underperforming: '表现不佳的干预',
    reallocation: '再配置机会',
    rule: '禁止自动再配置 · 必须人工治理'
  }
} as const satisfies Record<AppLanguage, Record<string,string>>;
