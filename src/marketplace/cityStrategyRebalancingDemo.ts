import type { AppLanguage } from '../i18n';
import {
  buildReallocationDecisionPack,
  createDecommitmentProposal,
  type AlternativeFundingCandidate,
  type StrategicPriority,
  type UnderperformanceReview
} from './cityStrategyRebalancingAuthority.ts';
import {
  demoCapitalProgrammeSnapshot
} from './cityCapitalProgrammeDemo.ts';

export const demoStrategicPriorities: StrategicPriority[] = [
  {
    id: 'priority-demand-gap',
    label: 'Reduce persistent unmet tourist demand',
    weight: 0.4,
    districtIds: ['varvarka-zaryadye', 'museum-quarter'],
    strategicTheme: 'demand-gap',
    evidenceRef: 'DEMO-STRATEGY-EVIDENCE-001'
  },
  {
    id: 'priority-evening-economy',
    label: 'Increase evening economy utilization',
    weight: 0.35,
    districtIds: ['central-evening-route'],
    strategicTheme: 'evening-economy',
    evidenceRef: 'DEMO-STRATEGY-EVIDENCE-002'
  },
  {
    id: 'priority-provider',
    label: 'Improve provider infrastructure reliability',
    weight: 0.25,
    districtIds: ['museum-quarter'],
    strategicTheme: 'provider-infrastructure',
    evidenceRef: 'DEMO-STRATEGY-EVIDENCE-003'
  }
];

const mixedCase = demoCapitalProgrammeSnapshot.underperforming.find(
  (item) => item.caseId === 'programme-case-museum-quarter'
);

if (!mixedCase) {
  throw new Error('demo-underperforming-case-missing');
}

export const demoUnderperformanceReview: UnderperformanceReview = {
  id: 'review:programme-case-museum-quarter',
  caseId: mixedCase.caseId,
  reason: mixedCase.reason,
  status: 'COMPLETE',
  evidenceRefs: [
    'DEMO-REVIEW-EVIDENCE-001',
    'DEMO-REVIEW-EVIDENCE-002'
  ],
  conclusion: 'DECOMMIT_PARTIAL',
  recommendedDecommitmentRub: Math.min(
    20000000,
    mixedCase.unspentCommittedRub ?? 0
  ),
  reviewRef: 'DEMO-UNDERPERFORMANCE-REVIEW-001',
  reviewedByRole: 'investment-committee'
};

const approvedDecommitment = {
  ...createDecommitmentProposal(demoUnderperformanceReview),
  state: 'APPROVED' as const,
  authorityRef: 'DEMO-DECOMMITMENT-AUTHORITY-001',
  decidedAt: '2026-10-06T14:00:00+03:00'
};

export const demoAlternativeFundingCandidates: AlternativeFundingCandidate[] = [
  {
    id: 'next-cycle-ticketing',
    mode: 'demo',
    label: 'Museum Quarter ticket-provider reliability programme · DEMO',
    districtId: 'museum-quarter',
    strategicTheme: 'provider-infrastructure',
    requiredCapitalRub: 35000000,
    evidenceConfidence: 0.82,
    implementationDays: 45,
    expectedImpactScore: 0.78,
    evidenceRefs: ['DEMO-CANDIDATE-EVIDENCE-001']
  },
  {
    id: 'next-cycle-evening-route',
    mode: 'demo',
    label: 'Expanded evening culture route · DEMO',
    districtId: 'central-evening-route',
    strategicTheme: 'evening-economy',
    requiredCapitalRub: 55000000,
    evidenceConfidence: 0.74,
    implementationDays: 60,
    expectedImpactScore: 0.71,
    evidenceRefs: ['DEMO-CANDIDATE-EVIDENCE-002']
  },
  {
    id: 'next-cycle-food-supply',
    mode: 'demo',
    label: 'Varvarka late dining supply programme · DEMO',
    districtId: 'varvarka-zaryadye',
    strategicTheme: 'demand-gap',
    requiredCapitalRub: 90000000,
    evidenceConfidence: 0.68,
    implementationDays: 90,
    expectedImpactScore: 0.76,
    evidenceRefs: ['DEMO-CANDIDATE-EVIDENCE-003']
  },
  {
    id: 'next-cycle-low-evidence',
    mode: 'demo',
    label: 'Experimental night shuttle · DEMO',
    districtId: 'central-evening-route',
    strategicTheme: 'evening-economy',
    requiredCapitalRub: 30000000,
    evidenceConfidence: 0.35,
    implementationDays: 40,
    expectedImpactScore: 0.9,
    evidenceRefs: ['DEMO-CANDIDATE-EVIDENCE-004']
  }
];

export const demoRebalancingDecisionPack = buildReallocationDecisionPack({
  id: 'demo-next-cycle-rebalancing-pack',
  snapshot: demoCapitalProgrammeSnapshot,
  priorities: demoStrategicPriorities,
  reviews: [demoUnderperformanceReview],
  proposals: [approvedDecommitment],
  candidates: demoAlternativeFundingCandidates
});

export const strategyRebalancingCopy = {
  ru: {
    kicker: 'CITY STRATEGY & CAPITAL REBALANCING BOARD · DEMO',
    title: 'Как следующий инвестиционный цикл учитывает результаты текущей программы',
    body: 'Board связывает performance программы, стратегические приоритеты, review underperformance, формальное decommitment и alternative funding shortlist. Ни одно перераспределение не исполняется автоматически.',
    priorities: 'STRATEGIC PRIORITIES',
    performance: 'PROGRAMME PERFORMANCE',
    decommitment: 'DECOMMITMENT REVIEW',
    sources: 'FUNDING SOURCES',
    candidates: 'NEXT-CYCLE CANDIDATES',
    recommendations: 'RECOMMENDED NEXT-CYCLE ALLOCATIONS',
    available: 'AVAILABLE NOW',
    blocked: 'BLOCKED POTENTIAL',
    rule: 'STRATEGY RECOMMENDATION ONLY · no automatic decommitment or funding'
  },
  en: {
    kicker: 'CITY STRATEGY & CAPITAL REBALANCING BOARD · DEMO',
    title: 'How the next investment cycle learns from current programme performance',
    body: 'The Board connects programme performance, strategic priorities, underperformance review, formal decommitment and an alternative funding shortlist. No reallocation is executed automatically.',
    priorities: 'STRATEGIC PRIORITIES',
    performance: 'PROGRAMME PERFORMANCE',
    decommitment: 'DECOMMITMENT REVIEW',
    sources: 'FUNDING SOURCES',
    candidates: 'NEXT-CYCLE CANDIDATES',
    recommendations: 'RECOMMENDED NEXT-CYCLE ALLOCATIONS',
    available: 'AVAILABLE NOW',
    blocked: 'BLOCKED POTENTIAL',
    rule: 'STRATEGY RECOMMENDATION ONLY · no automatic decommitment or funding'
  },
  zh: {
    kicker: 'CITY STRATEGY & CAPITAL REBALANCING BOARD · 演示',
    title: '下一轮投资如何从当前项目绩效中学习',
    body: 'Board 连接项目绩效、战略优先级、表现不佳项目审核、正式解除资本承诺和下一周期资金候选。任何再配置都不会自动执行。',
    priorities: '战略优先级',
    performance: '项目绩效',
    decommitment: '解除承诺审核',
    sources: '资金来源',
    candidates: '下一周期候选项目',
    recommendations: '下一周期建议配置',
    available: '当前可用',
    blocked: '受限潜在资本',
    rule: '仅供战略建议 · 不自动解除承诺或批准资金'
  }
} as const satisfies Record<AppLanguage, Record<string,string>>;
