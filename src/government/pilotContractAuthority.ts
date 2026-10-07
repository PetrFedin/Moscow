import type { PilotDecisionBlocker } from './pilotInvestmentDecision';

export type PilotContractSectionId =
  | 'scope'
  | 'deliverables'
  | 'responsibility'
  | 'acceptance'
  | 'payments'
  | 'handover';

export type PilotResponsibilityRole =
  | 'contractor'
  | 'city-business-owner'
  | 'heritage-authority'
  | 'integration-data-owner'
  | 'pilot-operator'
  | 'joint-governance'
  | 'city-operations-owner';

export type PilotPaymentMilestoneId =
  | 'mobilization'
  | 'software-acceptance'
  | 'pilot-evidence-acceptance'
  | 'handover-acceptance'
  | 'scale-pack-acceptance';

export type PilotDeliveryObligation = {
  blocker: PilotDecisionBlocker;
  contractSection: PilotContractSectionId;
  responsibleRole: PilotResponsibilityRole;
  evidenceCode: string;
  acceptanceClauseId: string;
  paymentMilestone: PilotPaymentMilestoneId;
};

export const PILOT_PAYMENT_MILESTONES: Record<
  PilotPaymentMilestoneId,
  { requiresAcceptedEvidence: boolean }
> = {
  mobilization: { requiresAcceptedEvidence: false },
  'software-acceptance': { requiresAcceptedEvidence: true },
  'pilot-evidence-acceptance': { requiresAcceptedEvidence: true },
  'handover-acceptance': { requiresAcceptedEvidence: true },
  'scale-pack-acceptance': { requiresAcceptedEvidence: true }
};

export const PILOT_DELIVERY_OBLIGATIONS: PilotDeliveryObligation[] = [
  {
    blocker: 'romanov-field-proof-missing',
    contractSection: 'acceptance',
    responsibleRole: 'contractor',
    evidenceCode: 'ROMANOV-FIELD-EVIDENCE',
    acceptanceClauseId: 'ACC-PHYSICAL-01',
    paymentMilestone: 'pilot-evidence-acceptance'
  },
  {
    blocker: 'second-object-repeatability-missing',
    contractSection: 'acceptance',
    responsibleRole: 'contractor',
    evidenceCode: 'OEC-REPEATABILITY-EVIDENCE',
    acceptanceClauseId: 'ACC-REPEAT-02',
    paymentMilestone: 'pilot-evidence-acceptance'
  },
  {
    blocker: 'visitor-pilot-review-missing',
    contractSection: 'acceptance',
    responsibleRole: 'pilot-operator',
    evidenceCode: 'VISITOR-PILOT-FINAL-REPORT',
    acceptanceClauseId: 'ACC-VISITOR-03',
    paymentMilestone: 'pilot-evidence-acceptance'
  },
  {
    blocker: 'live-provider-agreement-missing',
    contractSection: 'responsibility',
    responsibleRole: 'integration-data-owner',
    evidenceCode: 'PROVIDER-AUTHORITY-OR-HANDOFF',
    acceptanceClauseId: 'ACC-INTEGRATION-04',
    paymentMilestone: 'pilot-evidence-acceptance'
  },
  {
    blocker: 'publication-rights-blockers-remain',
    contractSection: 'handover',
    responsibleRole: 'heritage-authority',
    evidenceCode: 'RIGHTS-CLEARANCE-REGISTER',
    acceptanceClauseId: 'ACC-RIGHTS-05',
    paymentMilestone: 'handover-acceptance'
  },
  {
    blocker: 'security-data-flow-review-missing',
    contractSection: 'responsibility',
    responsibleRole: 'joint-governance',
    evidenceCode: 'SECURITY-DATA-FLOW-REVIEW',
    acceptanceClauseId: 'ACC-SECURITY-06',
    paymentMilestone: 'software-acceptance'
  },
  {
    blocker: 'ip-handover-review-missing',
    contractSection: 'handover',
    responsibleRole: 'joint-governance',
    evidenceCode: 'IP-HANDOVER-MATRIX',
    acceptanceClauseId: 'ACC-IP-07',
    paymentMilestone: 'handover-acceptance'
  },
  {
    blocker: 'operations-sla-review-missing',
    contractSection: 'handover',
    responsibleRole: 'city-operations-owner',
    evidenceCode: 'OPERATIONS-SLA-REVIEW',
    acceptanceClauseId: 'ACC-OPS-08',
    paymentMilestone: 'handover-acceptance'
  },
  {
    blocker: 'next-object-cost-unmeasured',
    contractSection: 'payments',
    responsibleRole: 'contractor',
    evidenceCode: 'MEASURED-OBJECT-COST',
    acceptanceClauseId: 'ACC-ECON-09',
    paymentMilestone: 'scale-pack-acceptance'
  },
  {
    blocker: 'next-object-production-time-unmeasured',
    contractSection: 'payments',
    responsibleRole: 'contractor',
    evidenceCode: 'MEASURED-OBJECT-LEAD-TIME',
    acceptanceClauseId: 'ACC-ECON-10',
    paymentMilestone: 'scale-pack-acceptance'
  },
  {
    blocker: 'developer-hours-unmeasured',
    contractSection: 'payments',
    responsibleRole: 'contractor',
    evidenceCode: 'MEASURED-DEVELOPER-HOURS',
    acceptanceClauseId: 'ACC-ECON-11',
    paymentMilestone: 'scale-pack-acceptance'
  },
  {
    blocker: 'institution-operator-hours-unmeasured',
    contractSection: 'payments',
    responsibleRole: 'heritage-authority',
    evidenceCode: 'MEASURED-INSTITUTION-HOURS',
    acceptanceClauseId: 'ACC-ECON-12',
    paymentMilestone: 'scale-pack-acceptance'
  },
  {
    blocker: 'district-shared-setup-cost-unmeasured',
    contractSection: 'payments',
    responsibleRole: 'joint-governance',
    evidenceCode: 'MEASURED-DISTRICT-SETUP-COST',
    acceptanceClauseId: 'ACC-ECON-13',
    paymentMilestone: 'scale-pack-acceptance'
  },
  {
    blocker: 'district-integration-cost-unmeasured',
    contractSection: 'payments',
    responsibleRole: 'integration-data-owner',
    evidenceCode: 'MEASURED-DISTRICT-INTEGRATION-COST',
    acceptanceClauseId: 'ACC-ECON-14',
    paymentMilestone: 'scale-pack-acceptance'
  },
  {
    blocker: 'annual-operations-cost-unmeasured',
    contractSection: 'payments',
    responsibleRole: 'city-operations-owner',
    evidenceCode: 'MEASURED-ANNUAL-OPERATIONS-COST',
    acceptanceClauseId: 'ACC-ECON-15',
    paymentMilestone: 'scale-pack-acceptance'
  }
];

const byBlocker = new Map(
  PILOT_DELIVERY_OBLIGATIONS.map((item) => [item.blocker, item])
);

export function getPilotDeliveryObligation(blocker: PilotDecisionBlocker) {
  return byBlocker.get(blocker) ?? null;
}
