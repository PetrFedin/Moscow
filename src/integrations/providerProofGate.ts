import { validateRealProviderAdmission, type RealProviderAdmission } from './realProviderAdmission.ts';
import {
  validateRealProviderEvidenceRun,
  type RealProviderEvidenceRun
} from './realProviderEvidenceRun.ts';
import { verifyJourneyEvidencePack } from './journeyEvidencePack.ts';

export const PROVIDER_PROOF_GATE_VERSION = 1 as const;

export type ProviderProofGate = {
  version: typeof PROVIDER_PROOF_GATE_VERSION;
  providerId: string;
  status: 'blocked' | 'pass';
  evidenceSigningAuthority: 'locked' | 'available';
  checkpoints: {
    runtimeCredentialsConfigured: boolean;
    admissionPassed: boolean;
    realEvidenceRunPassed: boolean;
    journeyEvidenceIntegrity: boolean;
  };
  blockers: string[];
};

function sameAdmissionAuthority(a: RealProviderAdmission, b: RealProviderAdmission) {
  return a.providerId === b.providerId
    && a.adapterId === b.adapterId
    && a.destinationId === b.destinationId
    && a.sourceUrl === b.sourceUrl
    && a.credentials.mode === b.credentials.mode
    && a.credentials.secretRef === b.credentials.secretRef
    && a.credentials.evidenceRef === b.credentials.evidenceRef
    && a.capabilityEvidenceRef === b.capabilityEvidenceRef
    && a.schemaMapping.providerSchemaVersion === b.schemaMapping.providerSchemaVersion
    && a.schemaMapping.mappingVersion === b.schemaMapping.mappingVersion
    && a.schemaMapping.evidenceRef === b.schemaMapping.evidenceRef
    && [...a.discoveredCapabilities].sort().join('|')
      === [...b.discoveredCapabilities].sort().join('|');
}

export function evaluateProviderProofGate(input: {
  providerId: string;
  runtimeCredentialsConfigured?: boolean;
  admission?: RealProviderAdmission | null;
  evidenceRun?: RealProviderEvidenceRun | null;
}): ProviderProofGate {
  const providerId = input.providerId.trim();
  const blockers: string[] = [];
  const runtimeCredentialsConfigured = Boolean(input.runtimeCredentialsConfigured);
  const effectiveAdmission = input.admission ?? input.evidenceRun?.admission ?? null;

  if (
    input.admission
    && input.evidenceRun
    && !sameAdmissionAuthority(input.admission, input.evidenceRun.admission)
  ) {
    blockers.push('provider-admission-evidence-mismatch');
  }

  let admissionPassed = false;
  if (!effectiveAdmission) {
    blockers.push('real-provider-admission-evidence-missing');
  } else {
    const admission = validateRealProviderAdmission(effectiveAdmission);
    admissionPassed = admission.status === 'admitted' && admission.providerId === providerId;
    if (admission.providerId !== providerId) blockers.push('provider-admission-provider-mismatch');
    blockers.push(...admission.blockers.map((blocker) => `provider-admission:${blocker}`));
  }

  let realEvidenceRunPassed = false;
  let journeyEvidenceIntegrity = false;
  if (!input.evidenceRun) {
    blockers.push('real-provider-evidence-run-missing');
  } else {
    if (input.evidenceRun.providerId !== providerId) blockers.push('evidence-run-provider-mismatch');
    const run = validateRealProviderEvidenceRun(input.evidenceRun);
    realEvidenceRunPassed = run.status === 'pass' && input.evidenceRun.providerId === providerId;
    blockers.push(...run.blockers.map((blocker) => `real-provider-run:${blocker}`));

    const pack = verifyJourneyEvidencePack(input.evidenceRun.journeyEvidencePack);
    journeyEvidenceIntegrity = pack.valid;
    if (!pack.valid) blockers.push('journey-evidence-pack-integrity-failed');
  }

  if (!providerId) blockers.push('provider-id-missing');

  const realProviderPass =
    Boolean(providerId)
    && admissionPassed
    && realEvidenceRunPassed
    && journeyEvidenceIntegrity
    && blockers.length === 0;

  if (!runtimeCredentialsConfigured && !realProviderPass) {
    blockers.push('provider-runtime-credentials-not-configured');
  }

  return {
    version: PROVIDER_PROOF_GATE_VERSION,
    providerId,
    status: realProviderPass ? 'pass' : 'blocked',
    evidenceSigningAuthority: realProviderPass ? 'available' : 'locked',
    checkpoints: {
      runtimeCredentialsConfigured,
      admissionPassed,
      realEvidenceRunPassed,
      journeyEvidenceIntegrity
    },
    blockers: [...new Set(blockers)]
  };
}
