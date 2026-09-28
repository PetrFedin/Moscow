export const ROMANOV_P0_EVIDENCE_MANIFEST_VERSION = 1;

export type RomanovP0EvidenceManifest = {
  kind: 'romanov-p0-evidence-manifest';
  version: typeof ROMANOV_P0_EVIDENCE_MANIFEST_VERSION;
  campaignPath: string;
  sessionBundlePaths: string[];
  anchorProofPath: string;
};

export type RomanovP0EvidenceManifestValidation = {
  valid: boolean;
  blockers: string[];
};

function isSafeRelativeJsonPath(value: unknown) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || !trimmed.toLowerCase().endsWith('.json')) return false;
  if (trimmed.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(trimmed)) return false;
  const parts = trimmed.replace(/\\/g, '/').split('/');
  return !parts.includes('..');
}

export function validateRomanovP0EvidenceManifest(
  value: unknown
): RomanovP0EvidenceManifestValidation {
  const blockers: string[] = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { valid: false, blockers: ['manifest-not-object'] };
  }

  const manifest = value as Partial<RomanovP0EvidenceManifest>;
  if (manifest.kind !== 'romanov-p0-evidence-manifest') {
    blockers.push('manifest-kind-invalid');
  }
  if (manifest.version !== ROMANOV_P0_EVIDENCE_MANIFEST_VERSION) {
    blockers.push('manifest-version-invalid');
  }
  if (!isSafeRelativeJsonPath(manifest.campaignPath)) {
    blockers.push('campaign-path-invalid');
  }
  if (!isSafeRelativeJsonPath(manifest.anchorProofPath)) {
    blockers.push('anchor-proof-path-invalid');
  }
  if (
    !Array.isArray(manifest.sessionBundlePaths)
    || manifest.sessionBundlePaths.length < 4
    || manifest.sessionBundlePaths.some((path) => !isSafeRelativeJsonPath(path))
  ) {
    blockers.push('session-bundle-paths-invalid');
  } else if (new Set(manifest.sessionBundlePaths).size !== manifest.sessionBundlePaths.length) {
    blockers.push('duplicate-session-bundle-path');
  }

  return { valid: blockers.length === 0, blockers };
}

export function parseRomanovP0EvidenceManifest(
  raw: string
): RomanovP0EvidenceManifest {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('Romanov P0 evidence manifest is not valid JSON');
  }

  const validation = validateRomanovP0EvidenceManifest(value);
  if (!validation.valid) {
    throw new Error(
      `Romanov P0 evidence manifest failed: ${validation.blockers.join('; ')}`
    );
  }
  return value as RomanovP0EvidenceManifest;
}
