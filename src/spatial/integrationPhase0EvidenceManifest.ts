export const MOSCOW_PHASE0_EVIDENCE_MANIFEST_VERSION = 1 as const;

export type Phase0EvidenceFileRef = {
  path: string;
  sha256: string;
};

export type MoscowPhase0EvidenceManifest = {
  kind: 'moscow-integration-phase0-evidence';
  version: typeof MOSCOW_PHASE0_EVIDENCE_MANIFEST_VERSION;
  createdAt: string;
  romanovEvidencePackage: Phase0EvidenceFileRef;
  oldEnglishCourtRepeatabilityProof: Phase0EvidenceFileRef;
  visitorPilotReport: Phase0EvidenceFileRef;
};

export type Phase0EvidenceManifestValidation = {
  valid: boolean;
  blockers: string[];
};

const SHA256 = /^[a-f0-9]{64}$/i;

function safeRelativeJsonPath(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return false;
  const normalized = value.replace(/\\/g, '/');
  return normalized.toLowerCase().endsWith('.json')
    && !normalized.startsWith('/')
    && !/^[A-Za-z]:\//.test(normalized)
    && !normalized.split('/').includes('..');
}

function validateRef(
  value: unknown,
  label: string,
  blockers: string[]
) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    blockers.push(`${label}-ref-invalid`);
    return;
  }
  const ref = value as Record<string, unknown>;
  if (!safeRelativeJsonPath(ref.path)) blockers.push(`${label}-path-invalid`);
  if (typeof ref.sha256 !== 'string' || !SHA256.test(ref.sha256)) {
    blockers.push(`${label}-sha256-invalid`);
  }
}

export function validateMoscowPhase0EvidenceManifest(
  value: unknown
): Phase0EvidenceManifestValidation {
  const blockers: string[] = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { valid: false, blockers: ['phase0-manifest-not-object'] };
  }

  const manifest = value as Record<string, unknown>;
  if (manifest.kind !== 'moscow-integration-phase0-evidence') {
    blockers.push('phase0-manifest-kind-invalid');
  }
  if (manifest.version !== MOSCOW_PHASE0_EVIDENCE_MANIFEST_VERSION) {
    blockers.push('phase0-manifest-version-invalid');
  }
  if (
    typeof manifest.createdAt !== 'string'
    || !Number.isFinite(Date.parse(manifest.createdAt))
  ) {
    blockers.push('phase0-manifest-created-at-invalid');
  }

  validateRef(manifest.romanovEvidencePackage, 'romanov', blockers);
  validateRef(manifest.oldEnglishCourtRepeatabilityProof, 'old-english-court', blockers);
  validateRef(manifest.visitorPilotReport, 'visitor-pilot', blockers);

  const refs = [
    manifest.romanovEvidencePackage,
    manifest.oldEnglishCourtRepeatabilityProof,
    manifest.visitorPilotReport
  ].filter((item): item is Record<string, unknown> =>
    Boolean(item && typeof item === 'object' && !Array.isArray(item))
  );
  const paths = refs
    .map((item) => item.path)
    .filter((item): item is string => typeof item === 'string');
  if (new Set(paths).size !== paths.length) {
    blockers.push('phase0-manifest-evidence-path-duplicate');
  }

  return { valid: blockers.length === 0, blockers: [...new Set(blockers)] };
}

export function assertMoscowPhase0EvidenceManifest(
  value: unknown
): MoscowPhase0EvidenceManifest {
  const validation = validateMoscowPhase0EvidenceManifest(value);
  if (!validation.valid) {
    throw new Error(
      `Invalid Moscow Phase 0 evidence manifest: ${validation.blockers.join('; ')}`
    );
  }
  return value as MoscowPhase0EvidenceManifest;
}
