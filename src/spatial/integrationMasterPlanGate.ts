import type { PilotStudyReport } from '../analytics/pilotStudy.ts';
import {
  currentGovernmentDeliveryManifest,
  evaluateGovernmentDeliveryReadiness,
  type GovernmentDeliveryManifest
} from '../government/governmentDeliveryManifest.ts';
import type { RomanovP0EvidencePackage } from './romanovP0EvidencePackage.ts';

export const MOSCOW_INTEGRATION_MASTER_PLAN_VERSION = '2026-10-01' as const;

export type MoscowIntegrationPhaseId =
  | 'MOSCOW-INT-00'
  | 'MOSCOW-INT-01'
  | 'MOSCOW-INT-02'
  | 'MOSCOW-INT-03'
  | 'MOSCOW-INT-04'
  | 'MOSCOW-INT-05'
  | 'MOSCOW-INT-06'
  | 'MOSCOW-INT-07'
  | 'MOSCOW-INT-08'
  | 'MOSCOW-INT-09';

export type OldEnglishCourtRepeatabilityProof = {
  version: 1;
  placeId: 'old-english-court';
  releaseState: 'field-verified-spatial-scene';
  authorityNamespace: 'old-english-court';
  romanovEvidenceReused: false;
  modelEvidenceRef: string;
  metricAuthorityRef: string;
  controlPointAuthorityRef: string;
  surveyEvidenceRef: string;
  fieldMatrixEvidenceRef: string;
  persistentAnchorEvidenceRef: string;
};

export type MoscowIntegrationPhase0Input = {
  romanovEvidence?: RomanovP0EvidencePackage | null;
  oldEnglishCourtEvidence?: OldEnglishCourtRepeatabilityProof | null;
  visitorPilotReport?: PilotStudyReport | null;
  visitorPilotEvidenceRef?: string | null;
  governmentManifest?: GovernmentDeliveryManifest;
};

export type MoscowIntegrationPhase0Gate = {
  planVersion: typeof MOSCOW_INTEGRATION_MASTER_PLAN_VERSION;
  phaseId: 'MOSCOW-INT-00';
  status: 'blocked' | 'pass';
  evidence: {
    romanovFieldExperience: boolean;
    oldEnglishCourtRepeatability: boolean;
    physicalSpatialAccuracy: boolean;
    supervisedUserPilot: boolean;
    governmentEvidencePackage: boolean;
  };
  blockers: string[];
  nextRequiredEvidence: string[];
  guardrails: {
    massIngestionAllowed: boolean;
    spatialScalingAllowed: boolean;
    yandexMapKitPrimaryRenderer: true;
    externalProviderProofIndependent: true;
  };
};

export const MOSCOW_INTEGRATION_PHASES: ReadonlyArray<{
  id: MoscowIntegrationPhaseId;
  title: string;
}> = [
  { id: 'MOSCOW-INT-00', title: 'Field proof gate' },
  { id: 'MOSCOW-INT-01', title: 'Destination Package v2' },
  { id: 'MOSCOW-INT-02', title: 'H3 + Turf' },
  { id: 'MOSCOW-INT-03', title: 'Historical Map Authority — GeoTIFF + Proj4' },
  { id: 'MOSCOW-INT-04', title: 'IIIF historical media' },
  { id: 'MOSCOW-INT-05', title: 'Field Verification Mode' },
  { id: 'MOSCOW-INT-06', title: '3D admission' },
  { id: 'MOSCOW-INT-07', title: 'Curated routing' },
  { id: 'MOSCOW-INT-08', title: 'Spatial Trigger Narrative' },
  { id: 'MOSCOW-INT-09', title: 'City-scale 3D gate' }
];

function text(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export function validateOldEnglishCourtRepeatabilityProof(
  proof?: OldEnglishCourtRepeatabilityProof | null
) {
  const blockers: string[] = [];
  if (!proof) return { valid: false, blockers: ['old-english-court-repeatability-evidence-missing'] };

  if (proof.version !== 1) blockers.push('old-english-court-repeatability-version-invalid');
  if (proof.placeId !== 'old-english-court') blockers.push('old-english-court-place-id-invalid');
  if (proof.releaseState !== 'field-verified-spatial-scene') blockers.push('old-english-court-field-release-not-verified');
  if (proof.authorityNamespace !== 'old-english-court') blockers.push('old-english-court-authority-namespace-invalid');
  if (proof.romanovEvidenceReused !== false) blockers.push('old-english-court-romanov-evidence-reuse-forbidden');

  for (const [label, value] of [
    ['model', proof.modelEvidenceRef],
    ['metric-authority', proof.metricAuthorityRef],
    ['control-point-authority', proof.controlPointAuthorityRef],
    ['survey', proof.surveyEvidenceRef],
    ['field-matrix', proof.fieldMatrixEvidenceRef],
    ['persistent-anchor', proof.persistentAnchorEvidenceRef]
  ] as const) {
    if (!text(value)) blockers.push(`old-english-court-${label}-evidence-missing`);
  }

  return { valid: blockers.length === 0, blockers };
}

function romanovFieldReady(pkg?: RomanovP0EvidencePackage | null) {
  return Boolean(
    pkg
      && pkg.releaseReady
      && pkg.releaseGate.state === 'field-verified-spatial-scene'
      && pkg.packageBlockers.length === 0
  );
}

function romanovPhysicalAccuracyReady(pkg?: RomanovP0EvidencePackage | null) {
  return Boolean(
    pkg
      && pkg.releaseReady
      && pkg.releaseGate.calibrationPlacementMeasured
      && pkg.releaseGate.metricAuthorityCurrent
      && pkg.releaseGate.metricScaleAuthoritative
      && pkg.releaseGate.fieldMatrixComplete
      && pkg.releaseGate.persistentAnchorVerified
  );
}

function visitorPilotReady(report?: PilotStudyReport | null, evidenceRef?: string | null) {
  return Boolean(
    report
      && report.completeForFirstReview
      && report.plannedParticipantSlots >= 20
      && report.plannedParticipantSlots <= 50
      && report.receivedObserverNotes === report.plannedParticipantSlots
      && report.interpretation.representativeSurvey === false
      && text(evidenceRef)
  );
}

function governmentPackageReady(manifest: GovernmentDeliveryManifest) {
  const readiness = evaluateGovernmentDeliveryReadiness({ manifest });
  const approval = readiness.stages.find((stage) => stage.id === 'technical-pilot-approval');
  return Boolean(approval?.ready);
}

export function evaluateMoscowIntegrationPhase0(
  input: MoscowIntegrationPhase0Input = {}
): MoscowIntegrationPhase0Gate {
  const governmentManifest = input.governmentManifest ?? currentGovernmentDeliveryManifest;
  const romanovFieldExperience = romanovFieldReady(input.romanovEvidence);
  const physicalSpatialAccuracy = romanovPhysicalAccuracyReady(input.romanovEvidence);
  const oldEnglishValidation = validateOldEnglishCourtRepeatabilityProof(input.oldEnglishCourtEvidence);
  const oldEnglishCourtRepeatability = oldEnglishValidation.valid;
  const supervisedUserPilot = visitorPilotReady(
    input.visitorPilotReport,
    input.visitorPilotEvidenceRef
  );
  const governmentEvidencePackage = governmentPackageReady(governmentManifest);

  const blockers: string[] = [];
  if (!romanovFieldExperience) blockers.push('romanov-field-experience-not-proven');
  if (!physicalSpatialAccuracy) blockers.push('physical-spatial-accuracy-not-proven');
  if (!oldEnglishCourtRepeatability) blockers.push(...oldEnglishValidation.blockers);
  if (!supervisedUserPilot) blockers.push('supervised-user-pilot-not-proven');
  if (!governmentEvidencePackage) blockers.push('government-evidence-package-not-ready');

  const status = blockers.length === 0 ? 'pass' : 'blocked';

  return {
    planVersion: MOSCOW_INTEGRATION_MASTER_PLAN_VERSION,
    phaseId: 'MOSCOW-INT-00',
    status,
    evidence: {
      romanovFieldExperience,
      oldEnglishCourtRepeatability,
      physicalSpatialAccuracy,
      supervisedUserPilot,
      governmentEvidencePackage
    },
    blockers: [...new Set(blockers)],
    nextRequiredEvidence: [
      ...(!romanovFieldExperience ? ['Real Romanov P0 evidence archive from physical field sessions'] : []),
      ...(!physicalSpatialAccuracy ? ['Romanov measured spatial residuals + verified calibration/anchor evidence'] : []),
      ...(!oldEnglishCourtRepeatability ? ['Old English Court object-specific field-verified repeatability proof'] : []),
      ...(!supervisedUserPilot ? ['Reviewed 20–50 participant supervised pilot report + evidence reference'] : []),
      ...(!governmentEvidencePackage ? ['Government technical-pilot approval artifact package'] : [])
    ],
    guardrails: {
      massIngestionAllowed: status === 'pass',
      spatialScalingAllowed: status === 'pass',
      yandexMapKitPrimaryRenderer: true,
      externalProviderProofIndependent: true
    }
  };
}

export type MoscowIntegrationPhaseState = {
  id: MoscowIntegrationPhaseId;
  title: string;
  status: 'complete' | 'available' | 'locked-by-phase-0' | 'locked-by-prerequisite';
  blocker?: string;
};

export function buildMoscowIntegrationRoadmap(input?: {
  phase0?: MoscowIntegrationPhase0Gate;
  completedPhaseIds?: MoscowIntegrationPhaseId[];
}) {
  const phase0 = input?.phase0 ?? evaluateMoscowIntegrationPhase0();
  const completed = new Set(input?.completedPhaseIds ?? []);

  if (phase0.status !== 'pass' && completed.size > 0) {
    throw new Error('Integration phases cannot be marked complete before MOSCOW-INT-00 passes');
  }

  const states: MoscowIntegrationPhaseState[] = [];
  for (let index = 0; index < MOSCOW_INTEGRATION_PHASES.length; index += 1) {
    const phase = MOSCOW_INTEGRATION_PHASES[index]!;
    if (phase.id === 'MOSCOW-INT-00') {
      states.push({
        ...phase,
        status: phase0.status === 'pass' ? 'complete' : 'available',
        ...(phase0.status === 'blocked' ? { blocker: phase0.blockers.join('; ') } : {})
      });
      continue;
    }

    if (phase0.status !== 'pass') {
      states.push({ ...phase, status: 'locked-by-phase-0', blocker: 'MOSCOW-INT-00' });
      continue;
    }

    const previous = MOSCOW_INTEGRATION_PHASES[index - 1]!;
    if (completed.has(phase.id)) {
      if (previous.id !== 'MOSCOW-INT-00' && !completed.has(previous.id)) {
        throw new Error(`Integration phase completion must be contiguous: ${phase.id}`);
      }
      states.push({ ...phase, status: 'complete' });
      continue;
    }

    const previousComplete = previous.id === 'MOSCOW-INT-00'
      ? phase0.status === 'pass'
      : completed.has(previous.id);

    states.push(previousComplete
      ? { ...phase, status: 'available' }
      : { ...phase, status: 'locked-by-prerequisite', blocker: previous.id });
  }

  return {
    planVersion: MOSCOW_INTEGRATION_MASTER_PLAN_VERSION,
    phase0,
    phases: states,
    nextPhase: states.find((phase) => phase.status === 'available')?.id ?? null
  };
}

export const currentMoscowIntegrationPhase0 = evaluateMoscowIntegrationPhase0();
export const currentMoscowIntegrationRoadmap = buildMoscowIntegrationRoadmap({
  phase0: currentMoscowIntegrationPhase0
});
