import type { AppLanguage } from '../i18n';
import {
  appendAuditEvent,
  createAuditLedger,
  decisionAuditCompleteness,
  replayDecision,
  verifyAuditLedger,
  type AuditLedger
} from './urbanDecisionAuditLedger.ts';

let ledger: AuditLedger = createAuditLedger({
  id: 'demo-urban-decision-ledger',
  mode: 'demo'
});

const decisionId = 'decision-varvarka-capital-cycle-001';

function append(
  eventId: string,
  eventType: Parameters<typeof appendAuditEvent>[0]['eventType'],
  occurredAt: string,
  actorId: string,
  role: string | null,
  state: string,
  summary: string,
  evidenceRefs: Parameters<typeof appendAuditEvent>[0]['payload']['evidenceRefs'],
  extra: Partial<Parameters<typeof appendAuditEvent>[0]['payload']> = {}
) {
  ledger = appendAuditEvent({
    ledger,
    eventId,
    eventType,
    occurredAt,
    actor: {
      actorType: role ? 'ROLE' : 'SYSTEM',
      actorId,
      role
    },
    payload: {
      decisionId,
      programmeId: 'demo-moscow-tourism-capital-programme',
      districtId: 'varvarka-zaryadye',
      modelId: extra.modelId ?? null,
      modelVersion: extra.modelVersion ?? null,
      policyVersion: extra.policyVersion ?? null,
      scenarioId: extra.scenarioId ?? null,
      amountRub: extra.amountRub ?? null,
      state,
      summary,
      evidenceRefs
    }
  });
}

append(
  'audit-001',
  'DATA_SNAPSHOT_FROZEN',
  '2026-10-06T09:00:00+03:00',
  'system:data-authority',
  null,
  'BASELINE_FROZEN',
  'Demand, supply and provider state snapshot frozen for decision analysis.',
  [{ ref: 'DEMO-DATA-SNAPSHOT-001', kind: 'data' }]
);

append(
  'audit-002',
  'MODEL_VERSION_BOUND',
  '2026-10-06T09:05:00+03:00',
  'city-strategy-model-owner',
  'model-owner',
  'MODEL_BOUND',
  'District Economic Twin version and policy version bound to the decision.',
  [
    { ref: 'DEMO-MODEL-EVIDENCE-001', kind: 'model' },
    { ref: 'DEMO-POLICY-ACTIVATION-001', kind: 'governance' }
  ],
  {
    modelId: 'district-economic-twin',
    modelVersion: '1.1.0',
    policyVersion: '1.1.0'
  }
);

append(
  'audit-003',
  'SCENARIO_CREATED',
  '2026-10-06T09:20:00+03:00',
  'city-strategy-analyst',
  'technical-evidence',
  'SCENARIO_READY',
  'Scenario comparison prepared for the district intervention.',
  [{ ref: 'DEMO-SCENARIO-EVIDENCE-001', kind: 'scenario' }],
  {
    modelId: 'district-economic-twin',
    modelVersion: '1.1.0',
    policyVersion: '1.1.0',
    scenarioId: 'scenario-add-3-restaurants'
  }
);

append(
  'audit-004',
  'DECISION_PROPOSED',
  '2026-10-06T10:00:00+03:00',
  'investment-committee-secretariat',
  'investment-governance',
  'PROPOSED',
  'Capital intervention decision pack submitted for approval.',
  [{ ref: 'DEMO-DECISION-PACK-001', kind: 'governance' }],
  { scenarioId: 'scenario-add-3-restaurants' }
);

for (const [index, role] of [
  'business-owner',
  'finance',
  'procurement-legal',
  'technical-evidence',
  'investment-committee'
].entries()) {
  append(
    `audit-approval-${index + 1}`,
    'APPROVAL_RECORDED',
    `2026-10-06T1${index}:15:00+03:00`,
    `demo-role-${role}`,
    role,
    'APPROVED',
    `${role} approval recorded.`,
    [{ ref: `DEMO-APPROVAL-${index + 1}`, kind: 'approval' }]
  );
}

append(
  'audit-010',
  'CAPITAL_COMMITTED',
  '2026-10-06T14:00:00+03:00',
  'city-finance-authority',
  'finance',
  'CAPITAL_COMMITTED',
  'Capital commitment recorded after approval chain completed.',
  [
    { ref: 'DEMO-CAPITAL-COMMITMENT-001', kind: 'capital' },
    { ref: 'DEMO-APPROVAL-COMMITTEE-001', kind: 'approval' }
  ],
  { amountRub: 180000000 }
);

append(
  'audit-011',
  'EXECUTION_EVIDENCE_RECORDED',
  '2026-11-15T12:00:00+03:00',
  'programme-delivery-owner',
  'business-owner',
  'EXECUTION_ACCEPTED',
  'Execution milestone accepted with evidence.',
  [{ ref: 'DEMO-EXECUTION-EVIDENCE-001', kind: 'execution' }]
);

append(
  'audit-012',
  'OUTCOME_RECORDED',
  '2026-12-15T12:00:00+03:00',
  'benefits-evidence-authority',
  'technical-evidence',
  'OUTCOME_MEASURED',
  'Post-launch outcome and forecast comparison recorded.',
  [{ ref: 'DEMO-OUTCOME-EVIDENCE-001', kind: 'outcome' }]
);

append(
  'audit-013',
  'LEARNING_RECORDED',
  '2026-12-20T12:00:00+03:00',
  'strategy-learning-authority',
  'model-risk',
  'LEARNING_CAPTURED',
  'Forecast error incorporated into learning segment evidence.',
  [{ ref: 'DEMO-LEARNING-RECORD-001', kind: 'learning' }]
);

append(
  'audit-014',
  'MODEL_CHANGE_ACCEPTED',
  '2027-01-10T12:00:00+03:00',
  'model-risk-board',
  'model-risk',
  'MODEL_CHANGE_ACCEPTED',
  'Calibration proposal accepted after review and holdout validation.',
  [
    { ref: 'DEMO-MODEL-ACCEPTANCE-001', kind: 'model' },
    { ref: 'DEMO-HOLDOUT-EVALUATION-001', kind: 'governance' }
  ],
  {
    modelId: 'district-economic-twin',
    modelVersion: '1.2.0',
    policyVersion: '1.2.0'
  }
);

append(
  'audit-015',
  'MODEL_CHANGE_ACTIVATED',
  '2027-01-15T12:00:00+03:00',
  'model-governance-authority',
  'investment-governance',
  'MODEL_CHANGE_ACTIVE',
  'Accepted model version explicitly activated for the next investment cycle.',
  [
    { ref: 'DEMO-POLICY-ACTIVATION-002', kind: 'model' },
    { ref: 'DEMO-PROMOTION-DECISION-001', kind: 'governance' }
  ],
  {
    modelId: 'district-economic-twin',
    modelVersion: '1.2.0',
    policyVersion: '1.2.0'
  }
);

export const demoUrbanAuditLedger = ledger;
export const demoUrbanAuditIntegrity = verifyAuditLedger(ledger);
export const demoUrbanDecisionReplay = replayDecision(ledger, decisionId);
export const demoUrbanDecisionCompleteness =
  decisionAuditCompleteness(demoUrbanDecisionReplay);

export const urbanAuditCopy = {
  ru: {
    kicker: 'URBAN EVIDENCE & DECISION AUDIT LEDGER · DEMO',
    title: 'Полная доказательная история решения — от данных до следующей версии модели',
    body: 'Ledger связывает data snapshot, model/policy version, scenario, approvals, capital, execution, outcome, learning и model change в append-only hash chain. Любое изменение прошлого ломает integrity verification.',
    integrity: 'LEDGER INTEGRITY',
    timeline: 'DECISION TIMELINE',
    replay: 'DECISION REPLAY',
    completeness: 'AUDIT COMPLETENESS',
    rule: 'APPEND-ONLY · HISTORY CANNOT BE REWRITTEN WITHOUT DETECTION'
  },
  en: {
    kicker: 'URBAN EVIDENCE & DECISION AUDIT LEDGER · DEMO',
    title: 'A complete evidence history of a decision — from data to the next model version',
    body: 'The Ledger binds data snapshot, model/policy version, scenario, approvals, capital, execution, outcome, learning and model change into an append-only hash chain. Any history tampering breaks integrity verification.',
    integrity: 'LEDGER INTEGRITY',
    timeline: 'DECISION TIMELINE',
    replay: 'DECISION REPLAY',
    completeness: 'AUDIT COMPLETENESS',
    rule: 'APPEND-ONLY · HISTORY CANNOT BE REWRITTEN WITHOUT DETECTION'
  },
  zh: {
    kicker: 'URBAN EVIDENCE & DECISION AUDIT LEDGER · 演示',
    title: '从数据到下一模型版本的完整决策证据历史',
    body: 'Ledger 将数据快照、模型/策略版本、场景、审批、资本、执行、结果、学习和模型变更绑定到 append-only hash chain。任何篡改历史都会破坏完整性验证。',
    integrity: '账本完整性',
    timeline: '决策时间线',
    replay: '决策回放',
    completeness: '审计完整度',
    rule: '仅追加 · 任何重写历史都会被检测'
  }
} as const satisfies Record<AppLanguage, Record<string,string>>;
