export const PILOT_INVESTMENT_EVIDENCE_VERSION = 1 as const;

export type MeasuredMoney = {
  amountRub: number;
  basis: string;
  evidenceRef: string;
};

export type MeasuredDuration = {
  days: number;
  basis: string;
  evidenceRef: string;
};

export type MeasuredHours = {
  hours: number;
  basis: string;
  evidenceRef: string;
};

export type PilotInvestmentEvidence = {
  version: typeof PILOT_INVESTMENT_EVIDENCE_VERSION;
  proof: {
    romanovFieldVerified: boolean;
    oldEnglishCourtRepeatabilityVerified: boolean;
    visitorPilotReviewed: boolean;
    liveProviderAgreementReady: boolean;
  };
  governance: {
    publicationRightsBlockers: number;
    securityDataFlowReviewed: boolean;
    ipHandoverReviewed: boolean;
    operationsSlaReviewed: boolean;
  };
  economics: {
    nextVerifiedObjectVariableCost: MeasuredMoney | null;
    nextVerifiedObjectProductionTime: MeasuredDuration | null;
    developerHoursPerObject: MeasuredHours | null;
    institutionOperatorHoursPerObject: MeasuredHours | null;
    districtSharedSetupCost: MeasuredMoney | null;
    districtIntegrationCost: MeasuredMoney | null;
    annualOperationsCost: MeasuredMoney | null;
  };
};

export type PilotDecisionBlocker =
  | 'romanov-field-proof-missing'
  | 'second-object-repeatability-missing'
  | 'visitor-pilot-review-missing'
  | 'live-provider-agreement-missing'
  | 'publication-rights-blockers-remain'
  | 'security-data-flow-review-missing'
  | 'ip-handover-review-missing'
  | 'operations-sla-review-missing'
  | 'next-object-cost-unmeasured'
  | 'next-object-production-time-unmeasured'
  | 'developer-hours-unmeasured'
  | 'institution-operator-hours-unmeasured'
  | 'district-shared-setup-cost-unmeasured'
  | 'district-integration-cost-unmeasured'
  | 'annual-operations-cost-unmeasured';

export type DistrictScaleModel = {
  objectCount: number;
  variableObjectProductionCostRub: number;
  sharedSetupCostRub: number;
  integrationCostRub: number;
  initialDistrictDeliveryCostRub: number;
  annualOperationsCostRub: number;
  sequentialObjectProductionDays: number;
  developerHoursForObjects: number;
  institutionOperatorHoursForObjects: number;
  caveats: string[];
};

function validPositive(value: number) {
  return Number.isFinite(value) && value > 0;
}

function validNonNegativeInteger(value: number) {
  return Number.isInteger(value) && value >= 0;
}

function validateMoney(value: MeasuredMoney | null, label: string, blockers: string[]) {
  if (value === null) return;
  if (!validPositive(value.amountRub)) blockers.push(`${label}-amount-invalid`);
  if (!value.basis.trim()) blockers.push(`${label}-basis-missing`);
  if (!value.evidenceRef.trim()) blockers.push(`${label}-evidence-missing`);
}

function validateDuration(value: MeasuredDuration | null, label: string, blockers: string[]) {
  if (value === null) return;
  if (!validPositive(value.days)) blockers.push(`${label}-days-invalid`);
  if (!value.basis.trim()) blockers.push(`${label}-basis-missing`);
  if (!value.evidenceRef.trim()) blockers.push(`${label}-evidence-missing`);
}

function validateHours(value: MeasuredHours | null, label: string, blockers: string[]) {
  if (value === null) return;
  if (!validPositive(value.hours)) blockers.push(`${label}-hours-invalid`);
  if (!value.basis.trim()) blockers.push(`${label}-basis-missing`);
  if (!value.evidenceRef.trim()) blockers.push(`${label}-evidence-missing`);
}

export function validatePilotInvestmentEvidence(evidence: PilotInvestmentEvidence) {
  const blockers: string[] = [];

  if (evidence.version !== PILOT_INVESTMENT_EVIDENCE_VERSION) {
    blockers.push('investment-evidence-version-invalid');
  }
  if (!validNonNegativeInteger(evidence.governance.publicationRightsBlockers)) {
    blockers.push('publication-rights-blocker-count-invalid');
  }

  validateMoney(evidence.economics.nextVerifiedObjectVariableCost, 'next-object-cost', blockers);
  validateDuration(evidence.economics.nextVerifiedObjectProductionTime, 'next-object-time', blockers);
  validateHours(evidence.economics.developerHoursPerObject, 'developer-hours', blockers);
  validateHours(evidence.economics.institutionOperatorHoursPerObject, 'operator-hours', blockers);
  validateMoney(evidence.economics.districtSharedSetupCost, 'district-setup-cost', blockers);
  validateMoney(evidence.economics.districtIntegrationCost, 'district-integration-cost', blockers);
  validateMoney(evidence.economics.annualOperationsCost, 'annual-operations-cost', blockers);

  return {
    valid: blockers.length === 0,
    blockers
  };
}

export function getPilotDecisionReadiness(evidence: PilotInvestmentEvidence) {
  const validation = validatePilotInvestmentEvidence(evidence);
  if (!validation.valid) {
    throw new Error(`Invalid pilot investment evidence: ${validation.blockers.join('; ')}`);
  }

  const blockers: PilotDecisionBlocker[] = [];

  if (!evidence.proof.romanovFieldVerified) blockers.push('romanov-field-proof-missing');
  if (!evidence.proof.oldEnglishCourtRepeatabilityVerified) blockers.push('second-object-repeatability-missing');
  if (!evidence.proof.visitorPilotReviewed) blockers.push('visitor-pilot-review-missing');
  if (!evidence.proof.liveProviderAgreementReady) blockers.push('live-provider-agreement-missing');

  if (evidence.governance.publicationRightsBlockers > 0) {
    blockers.push('publication-rights-blockers-remain');
  }
  if (!evidence.governance.securityDataFlowReviewed) blockers.push('security-data-flow-review-missing');
  if (!evidence.governance.ipHandoverReviewed) blockers.push('ip-handover-review-missing');
  if (!evidence.governance.operationsSlaReviewed) blockers.push('operations-sla-review-missing');

  if (!evidence.economics.nextVerifiedObjectVariableCost) blockers.push('next-object-cost-unmeasured');
  if (!evidence.economics.nextVerifiedObjectProductionTime) blockers.push('next-object-production-time-unmeasured');
  if (!evidence.economics.developerHoursPerObject) blockers.push('developer-hours-unmeasured');
  if (!evidence.economics.institutionOperatorHoursPerObject) blockers.push('institution-operator-hours-unmeasured');
  if (!evidence.economics.districtSharedSetupCost) blockers.push('district-shared-setup-cost-unmeasured');
  if (!evidence.economics.districtIntegrationCost) blockers.push('district-integration-cost-unmeasured');
  if (!evidence.economics.annualOperationsCost) blockers.push('annual-operations-cost-unmeasured');

  const proofReady =
    evidence.proof.romanovFieldVerified
    && evidence.proof.oldEnglishCourtRepeatabilityVerified
    && evidence.proof.visitorPilotReviewed
    && evidence.proof.liveProviderAgreementReady;

  const governanceReady =
    evidence.governance.publicationRightsBlockers === 0
    && evidence.governance.securityDataFlowReviewed
    && evidence.governance.ipHandoverReviewed
    && evidence.governance.operationsSlaReviewed;

  const economicsReady =
    Boolean(evidence.economics.nextVerifiedObjectVariableCost)
    && Boolean(evidence.economics.nextVerifiedObjectProductionTime)
    && Boolean(evidence.economics.developerHoursPerObject)
    && Boolean(evidence.economics.institutionOperatorHoursPerObject)
    && Boolean(evidence.economics.districtSharedSetupCost)
    && Boolean(evidence.economics.districtIntegrationCost)
    && Boolean(evidence.economics.annualOperationsCost);

  return {
    proofReady,
    governanceReady,
    economicsReady,
    decisionPackReady: proofReady && governanceReady && economicsReady,
    blockers
  };
}

export function buildDistrictScaleModel(
  evidence: PilotInvestmentEvidence,
  objectCount: number
): DistrictScaleModel {
  const readiness = getPilotDecisionReadiness(evidence);
  if (!readiness.economicsReady) {
    throw new Error(
      `District scale model requires measured economics: ${readiness.blockers
        .filter((item) => item.includes('unmeasured'))
        .join('; ')}`
    );
  }
  if (!Number.isInteger(objectCount) || objectCount < 1 || objectCount > 500) {
    throw new Error('District scale model objectCount must be an integer from 1 to 500');
  }

  const economics = evidence.economics;
  const variable = economics.nextVerifiedObjectVariableCost!;
  const setup = economics.districtSharedSetupCost!;
  const integration = economics.districtIntegrationCost!;
  const annualOperations = economics.annualOperationsCost!;
  const duration = economics.nextVerifiedObjectProductionTime!;
  const developerHours = economics.developerHoursPerObject!;
  const operatorHours = economics.institutionOperatorHoursPerObject!;

  return {
    objectCount,
    variableObjectProductionCostRub: variable.amountRub,
    sharedSetupCostRub: setup.amountRub,
    integrationCostRub: integration.amountRub,
    initialDistrictDeliveryCostRub:
      variable.amountRub * objectCount
      + setup.amountRub
      + integration.amountRub,
    annualOperationsCostRub: annualOperations.amountRub,
    sequentialObjectProductionDays: duration.days * objectCount,
    developerHoursForObjects: developerHours.hours * objectCount,
    institutionOperatorHoursForObjects: operatorHours.hours * objectCount,
    caveats: [
      'This is a measured-input arithmetic model, not a procurement price or funding commitment.',
      'Sequential production days do not assume parallel work and therefore are not a delivery promise.',
      'Taxes, procurement overhead, financing cost, inflation and provider-specific commercial terms are not inferred unless included in measured input evidence.',
      'Public-value or revenue ROI is not calculated automatically.'
    ]
  };
}

export const currentPilotInvestmentEvidence: PilotInvestmentEvidence = {
  version: 1,
  proof: {
    romanovFieldVerified: false,
    oldEnglishCourtRepeatabilityVerified: false,
    visitorPilotReviewed: false,
    liveProviderAgreementReady: false
  },
  governance: {
    publicationRightsBlockers: 1,
    securityDataFlowReviewed: false,
    ipHandoverReviewed: false,
    operationsSlaReviewed: false
  },
  economics: {
    nextVerifiedObjectVariableCost: null,
    nextVerifiedObjectProductionTime: null,
    developerHoursPerObject: null,
    institutionOperatorHoursPerObject: null,
    districtSharedSetupCost: null,
    districtIntegrationCost: null,
    annualOperationsCost: null
  }
};
