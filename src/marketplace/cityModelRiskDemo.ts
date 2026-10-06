import type { AppLanguage } from '../i18n';
import {
  buildDriftSignals,
  buildModelRiskBoardSnapshot,
  buildPromotionGate,
  detectSegmentWeaknesses,
  evaluateChallenger,
  lineageFromLearningPolicy,
  proposeRollback,
  type ModelInventoryRecord
} from './cityModelRiskAuthority.ts';
import {
  demoAcceptedLearningPolicy,
  demoActiveLearningPolicy,
  demoLearningSegments
} from './cityStrategyLearningDemo.ts';

export const demoModelInventory: ModelInventoryRecord[] = [
  {
    id: 'district-economic-twin',
    mode: 'demo',
    modelName: 'District Economic Digital Twin',
    modelType: 'digital-twin',
    riskTier: 'TIER_1_CRITICAL',
    ownerRole: 'City Strategy Model Owner',
    currentProductionVersion: '1.1.0',
    challengerVersion: '1.2.0-rc1',
    status: 'WATCH',
    purpose: 'Scenario forecasting for district intervention and capital allocation.'
  },
  {
    id: 'marketplace-ranking',
    mode: 'demo',
    modelName: 'Marketplace Neutral Ranking',
    modelType: 'ranking',
    riskTier: 'TIER_2_MATERIAL',
    ownerRole: 'Marketplace Governance Owner',
    currentProductionVersion: '1.0.0',
    challengerVersion: null,
    status: 'ACTIVE',
    purpose: 'Organic ranking and sponsor-neutral demand allocation.'
  },
  {
    id: 'portfolio-optimizer',
    mode: 'demo',
    modelName: 'District Portfolio Optimizer',
    modelType: 'portfolio-optimizer',
    riskTier: 'TIER_1_CRITICAL',
    ownerRole: 'Capital Allocation Model Owner',
    currentProductionVersion: '1.0.0',
    challengerVersion: null,
    status: 'ACTIVE',
    purpose: 'Recommendation-only constrained capital allocation.'
  }
];

const driftBaselines = Object.fromEntries(
  demoLearningSegments.map((segment) => [
    segment.key,
    {
      directionalHitRate:
        segment.directionalHitRate === null
          ? null
          : Math.min(1, segment.directionalHitRate + 0.3),
      meanAbsoluteError:
        segment.meanAbsoluteError === null
          ? null
          : Math.max(0, segment.meanAbsoluteError - 0.08)
    }
  ])
);

export const demoModelDriftSignals = buildDriftSignals({
  modelId: 'district-economic-twin',
  version: '1.1.0',
  segments: demoLearningSegments,
  baselineBySegment: driftBaselines
});

export const demoModelSegmentWeaknesses = detectSegmentWeaknesses({
  modelId: 'district-economic-twin',
  version: '1.1.0',
  segments: demoLearningSegments
});

export const demoChallengerEvaluation = evaluateChallenger({
  id: 'challenger-eval-twin-1-2-0-rc1',
  modelId: 'district-economic-twin',
  incumbentVersion: '1.1.0',
  challengerVersion: '1.2.0-rc1',
  holdoutRef: 'DEMO-CHALLENGER-HOLDOUT-001',
  sampleSize: 120,
  incumbentDirectionalHitRate: 0.68,
  challengerDirectionalHitRate: 0.79,
  incumbentMeanAbsoluteError: 0.14,
  challengerMeanAbsoluteError: 0.1,
  segmentRegressionCount: 0,
  segmentImprovementCount: 3
});

export const demoPromotionGate = buildPromotionGate({
  modelId: 'district-economic-twin',
  evaluation: demoChallengerEvaluation,
  approvalRefs: {
    'model-owner': 'DEMO-MODEL-OWNER-APPROVAL-001',
    'technical-evidence': 'DEMO-TECH-EVIDENCE-APPROVAL-001',
    'model-risk': 'DEMO-MODEL-RISK-APPROVAL-001',
    'investment-governance': 'DEMO-INVESTMENT-GOV-APPROVAL-001'
  },
  rollbackPlanRef: 'DEMO-ROLLBACK-PLAN-001',
  monitoringPlanRef: 'DEMO-POST-PROMOTION-MONITORING-001'
});

export const demoRollbackProposal = proposeRollback({
  id: 'rollback-proposal-twin-1-1',
  modelId: 'district-economic-twin',
  currentVersion: '1.1.0',
  rollbackTargetVersion: '1.0.0',
  reason: 'MATERIAL_PERFORMANCE_DEGRADATION',
  evidenceRefs: [
    'DEMO-DRIFT-EVIDENCE-001',
    'DEMO-FORECAST-ERROR-EVIDENCE-001'
  ]
});

const learningLineage = lineageFromLearningPolicy(
  'district-economic-twin',
  [demoAcceptedLearningPolicy, demoActiveLearningPolicy]
);

export const demoModelRiskBoard = buildModelRiskBoardSnapshot({
  mode: 'demo',
  inventory: demoModelInventory,
  lineage: learningLineage,
  driftSignals: demoModelDriftSignals,
  segmentWeaknesses: demoModelSegmentWeaknesses,
  challengerEvaluations: [demoChallengerEvaluation],
  promotionGates: [demoPromotionGate],
  rollbackProposals: [demoRollbackProposal]
});

export const modelRiskCopy = {
  ru: {
    kicker: 'CITY MODEL RISK & GOVERNANCE BOARD · DEMO',
    title: 'Какая модель сейчас в production, где она слабеет и можно ли продвигать challenger',
    body: 'Board объединяет model inventory, version lineage, drift, forecast error, segment weakness, challenger evaluation, promotion gate и rollback readiness. Ни promotion, ни rollback не исполняются автоматически.',
    inventory: 'MODEL INVENTORY',
    lineage: 'POLICY LINEAGE',
    drift: 'DRIFT & SEGMENT RISK',
    challenger: 'CHALLENGER VS INCUMBENT',
    promotion: 'PROMOTION GATE',
    rollback: 'ROLLBACK',
    rule: 'NO AUTO-PROMOTION · NO AUTO-ROLLBACK · explicit governance required'
  },
  en: {
    kicker: 'CITY MODEL RISK & GOVERNANCE BOARD · DEMO',
    title: 'Which model is in production, where it weakens, and whether a challenger can be promoted',
    body: 'The Board combines model inventory, version lineage, drift, forecast error, segment weakness, challenger evaluation, promotion gate and rollback readiness. Neither promotion nor rollback executes automatically.',
    inventory: 'MODEL INVENTORY',
    lineage: 'POLICY LINEAGE',
    drift: 'DRIFT & SEGMENT RISK',
    challenger: 'CHALLENGER VS INCUMBENT',
    promotion: 'PROMOTION GATE',
    rollback: 'ROLLBACK',
    rule: 'NO AUTO-PROMOTION · NO AUTO-ROLLBACK · explicit governance required'
  },
  zh: {
    kicker: 'CITY MODEL RISK & GOVERNANCE BOARD · 演示',
    title: '哪一个模型正在生产运行、哪里变弱，以及 challenger 是否可以晋升',
    body: 'Board 汇总模型清单、版本谱系、drift、预测误差、分段弱点、challenger 评估、晋升门槛和回滚准备。晋升和回滚都不会自动执行。',
    inventory: '模型清单',
    lineage: '策略版本谱系',
    drift: 'DRIFT 与分段风险',
    challenger: 'CHALLENGER VS INCUMBENT',
    promotion: '晋升门槛',
    rollback: '回滚',
    rule: '禁止自动晋升 · 禁止自动回滚 · 必须显式治理'
  }
} as const satisfies Record<AppLanguage, Record<string,string>>;
