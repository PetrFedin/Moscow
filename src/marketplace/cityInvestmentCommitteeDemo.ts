import type { AppLanguage } from '../i18n';
import { demoDistrictPortfolio } from './districtPortfolioDemo.ts';
import {
  buildBenefitsRealizationReview,
  buildBusinessCaseFromPortfolio,
  createCapitalCommitment,
  executionCapitalStatus,
  investmentCommitteeWorkspaceState,
  type CommitteeApprovalStage,
  type ExecutionMilestone,
  type InvestmentCommitteeWorkspace
} from './cityInvestmentCommitteeAuthority.ts';
import { verifyCapitalPortfolio } from './districtPortfolioOptimizer.ts';

const demoBusinessCase = buildBusinessCaseFromPortfolio({
  id: 'demo-investment-case-varvarka-001',
  title: 'Varvarka–Zaryadye demand activation portfolio · DEMO',
  districtId: 'varvarka-zaryadye',
  portfolio: demoDistrictPortfolio,
  executiveSponsor: 'DEMO · Executive Sponsor',
  businessOwner: 'DEMO · District Business Owner',
  budgetSources: [
    {
      type: 'city-budget',
      amountRub: 100000000,
      authorityRef: 'DEMO-BUDGET-AUTHORITY-001'
    },
    {
      type: 'institution-budget',
      amountRub: 45000000,
      authorityRef: 'DEMO-BUDGET-AUTHORITY-002'
    },
    {
      type: 'mixed',
      amountRub: 140000000,
      authorityRef: 'DEMO-BUDGET-AUTHORITY-003'
    }
  ],
  procurementPath: {
    status: 'CONFIRMED',
    routeLabel: 'DEMO · confirmed procurement route after legal review',
    reviewRef: 'DEMO-PROCUREMENT-LEGAL-REVIEW-001',
    approvedByRole: 'procurement-legal',
    confirmedAt: '2026-10-06T10:00:00+03:00'
  },
  evidencePackage: [
    {
      id: 'demand-baseline',
      evidenceClass: 'demand-baseline',
      required: true,
      evidenceRef: 'DEMO-DEMAND-BASELINE-001',
      accepted: true
    },
    {
      id: 'digital-twin',
      evidenceClass: 'digital-twin',
      required: true,
      evidenceRef: 'DEMO-TWIN-PACK-001',
      accepted: true
    },
    {
      id: 'portfolio-comparison',
      evidenceClass: 'portfolio-comparison',
      required: true,
      evidenceRef: 'DEMO-PORTFOLIO-COMPARE-001',
      accepted: true
    },
    {
      id: 'cost-basis',
      evidenceClass: 'cost-basis',
      required: true,
      evidenceRef: 'DEMO-COST-BASIS-001',
      accepted: true
    },
    {
      id: 'procurement-review',
      evidenceClass: 'procurement-review',
      required: true,
      evidenceRef: 'DEMO-PROCUREMENT-LEGAL-REVIEW-001',
      accepted: true
    },
    {
      id: 'benefits-measurement',
      evidenceClass: 'benefits-measurement',
      required: true,
      evidenceRef: 'DEMO-BENEFITS-METHOD-001',
      accepted: true
    }
  ]
});

const demoApprovals: CommitteeApprovalStage[] = [
  {
    id: 'business-owner',
    order: 1,
    role: 'business-owner',
    label: 'Business case owner review',
    required: true,
    status: 'APPROVED',
    decisionRef: 'DEMO-APPROVAL-BO-001',
    decidedAt: '2026-10-06T10:15:00+03:00',
    conditions: []
  },
  {
    id: 'finance',
    order: 2,
    role: 'finance',
    label: 'Funding and affordability review',
    required: true,
    status: 'APPROVED',
    decisionRef: 'DEMO-APPROVAL-FIN-001',
    decidedAt: '2026-10-06T10:30:00+03:00',
    conditions: []
  },
  {
    id: 'procurement-legal',
    order: 3,
    role: 'procurement-legal',
    label: 'Procurement and legal review',
    required: true,
    status: 'APPROVED',
    decisionRef: 'DEMO-APPROVAL-LEGAL-001',
    decidedAt: '2026-10-06T10:45:00+03:00',
    conditions: []
  },
  {
    id: 'technical-evidence',
    order: 4,
    role: 'technical-evidence',
    label: 'Technical evidence review',
    required: true,
    status: 'APPROVED',
    decisionRef: 'DEMO-APPROVAL-TECH-001',
    decidedAt: '2026-10-06T11:00:00+03:00',
    conditions: []
  },
  {
    id: 'investment-committee',
    order: 5,
    role: 'investment-committee',
    label: 'Investment committee decision',
    required: true,
    status: 'APPROVED',
    decisionRef: 'DEMO-APPROVAL-COMMITTEE-001',
    decidedAt: '2026-10-06T11:30:00+03:00',
    conditions: []
  }
];

const demoCommitment = createCapitalCommitment({
  businessCase: demoBusinessCase,
  approvals: demoApprovals,
  amountRub: demoBusinessCase.requestedCapitalRub,
  committedAt: '2026-10-06T11:45:00+03:00',
  authorityRef: 'DEMO-CAPITAL-COMMITMENT-001'
});

const demoExecution: ExecutionMilestone[] = demoDistrictPortfolio.selected.map((item, index) => ({
  id: `execution-${item.option.id}`,
  label: item.option.scenario.interventions[0]?.label ?? item.option.id,
  plannedCapitalRub: item.option.requiredCapitalRub,
  actualCapitalRub: item.option.requiredCapitalRub - (index + 1) * 1000000,
  status: 'ACCEPTED',
  evidenceRefs: [`DEMO-EXECUTION-EVIDENCE-${index + 1}`],
  acceptanceRef: `DEMO-EXECUTION-ACCEPT-${index + 1}`
}));

const demoPortfolioVerification = verifyCapitalPortfolio({
  portfolio: demoDistrictPortfolio,
  optionVerification: demoDistrictPortfolio.selected.map((item, index) => ({
    optionId: item.option.id,
    result: index === demoDistrictPortfolio.selected.length - 1
      ? 'MISSED_DIRECTION'
      : 'VERIFIED_DIRECTIONALLY',
    actualCapitalRub: demoExecution[index]?.actualCapitalRub ?? null
  }))
});

const demoBenefitsReview = buildBenefitsRealizationReview({
  businessCase: demoBusinessCase,
  evidenceRefs: ['DEMO-POST-INVESTMENT-EVIDENCE-001'],
  observed: {
    unmetIntentDelta: demoBusinessCase.expectedBenefits.unmetIntentDelta === null
      ? null
      : demoBusinessCase.expectedBenefits.unmetIntentDelta * 0.9,
    footfallIndexDelta: demoBusinessCase.expectedBenefits.footfallIndexDelta === null
      ? null
      : demoBusinessCase.expectedBenefits.footfallIndexDelta * 0.8,
    confirmedDemandDelta: demoBusinessCase.expectedBenefits.confirmedDemandDelta === null
      ? null
      : demoBusinessCase.expectedBenefits.confirmedDemandDelta * 0.7,
    partnerGrossContributionDeltaRub:
      demoBusinessCase.expectedBenefits.partnerGrossContributionDeltaRub === null
        ? null
        : demoBusinessCase.expectedBenefits.partnerGrossContributionDeltaRub * 0.75
  },
  portfolioVerification: demoPortfolioVerification
});

export const demoInvestmentCommitteeWorkspace: InvestmentCommitteeWorkspace = {
  businessCase: demoBusinessCase,
  approvals: demoApprovals,
  commitment: demoCommitment,
  execution: demoExecution,
  portfolioVerification: demoPortfolioVerification,
  benefitsReview: demoBenefitsReview
};

export const demoInvestmentCommitteeState =
  investmentCommitteeWorkspaceState(demoInvestmentCommitteeWorkspace);

export const demoExecutionCapital =
  executionCapitalStatus(demoCommitment, demoExecution);

export const investmentCommitteeCopy = {
  ru: {
    kicker: 'CITY INVESTMENT COMMITTEE WORKSPACE · DEMO',
    title: 'От portfolio shortlist до формального capital commitment и benefits realization',
    body: 'Workspace связывает business case, владельцев, источники бюджета, legal/procurement review, evidence package, approval stages, execution и итоговую проверку эффекта.',
    businessCase: 'BUSINESS CASE',
    ownership: 'SPONSOR / OWNER',
    budget: 'BUDGET SOURCE',
    procurement: 'PROCUREMENT PATH',
    evidence: 'EVIDENCE PACKAGE',
    approvals: 'APPROVAL STAGES',
    capital: 'COMMITTED CAPITAL',
    execution: 'EXECUTION',
    benefits: 'BENEFITS REALIZATION',
    rule: 'DEMO ONLY · не является реальным решением о финансировании или закупке'
  },
  en: {
    kicker: 'CITY INVESTMENT COMMITTEE WORKSPACE · DEMO',
    title: 'From portfolio shortlist to formal capital commitment and benefits realization',
    body: 'The workspace connects the business case, owners, funding sources, legal/procurement review, evidence package, approval stages, execution and benefits verification.',
    businessCase: 'BUSINESS CASE',
    ownership: 'SPONSOR / OWNER',
    budget: 'BUDGET SOURCE',
    procurement: 'PROCUREMENT PATH',
    evidence: 'EVIDENCE PACKAGE',
    approvals: 'APPROVAL STAGES',
    capital: 'COMMITTED CAPITAL',
    execution: 'EXECUTION',
    benefits: 'BENEFITS REALIZATION',
    rule: 'DEMO ONLY · not a real funding or procurement decision'
  },
  zh: {
    kicker: 'CITY INVESTMENT COMMITTEE WORKSPACE · 演示',
    title: '从投资组合候选到正式资本承诺与效益实现',
    body: 'Workspace 连接 business case、负责人、资金来源、法律/采购审核、证据包、审批阶段、执行与效益验证。',
    businessCase: '商业案例',
    ownership: 'SPONSOR / OWNER',
    budget: '资金来源',
    procurement: '采购路径',
    evidence: '证据包',
    approvals: '审批阶段',
    capital: '已承诺资本',
    execution: '执行',
    benefits: '效益实现',
    rule: '仅供演示 · 不构成真实融资或采购决定'
  }
} as const satisfies Record<AppLanguage, Record<string,string>>;
