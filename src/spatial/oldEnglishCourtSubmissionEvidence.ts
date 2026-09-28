import {
  OLD_ENGLISH_COURT_SPATIAL_AUTHORITY,
  type OldEnglishCourtSourceId
} from './oldEnglishCourtSpatialAuthority.ts';

export const OLD_ENGLISH_COURT_EVIDENCE_VERSION = 1;

type ModelEvidenceIdentity = {
  modelId: string;
  modelVersion: number;
  checksumSha256: string;
};

export type OldEnglishCourtProvenanceEvidence = ModelEvidenceIdentity & {
  kind: 'old-english-court-provenance-evidence';
  version: typeof OLD_ENGLISH_COURT_EVIDENCE_VERSION;
  mappings: Array<{
    sourceId: OldEnglishCourtSourceId;
    supports: string[];
    evidenceClass: 'documented' | 'reconstructed' | 'hypothesis';
  }>;
  unresolvedGeometry: string[];
};

export type OldEnglishCourtRightsEvidence = ModelEvidenceIdentity & {
  kind: 'old-english-court-rights-evidence';
  version: typeof OLD_ENGLISH_COURT_EVIDENCE_VERSION;
  modelRightsBasis: 'owned' | 'commissioned' | 'licensed' | 'public-domain';
  rightsHolder: string;
  publicationUseVerified: true;
  thirdPartyInputs: Array<{
    label: string;
    rightsStatus: 'verified';
    evidenceRef: string;
  }>;
};

export type OldEnglishCourtMetricScaleEvidence = ModelEvidenceIdentity & {
  kind: 'old-english-court-metric-scale-evidence';
  version: typeof OLD_ENGLISH_COURT_EVIDENCE_VERSION;
  modelUnits: 'meters';
  metersPerModelUnit: 1;
  measuredReferences: Array<{
    label: string;
    sourceRef: string;
    measuredMeters: number;
    modelDistanceMeters: number;
  }>;
};

export type OldEnglishCourtStructuredEvidence = {
  provenance: OldEnglishCourtProvenanceEvidence;
  rights: OldEnglishCourtRightsEvidence;
  metricScale: OldEnglishCourtMetricScaleEvidence;
};

export type OldEnglishCourtEvidenceValidation = {
  valid: boolean;
  blockers: string[];
};

const SHA256_HEX = /^[a-f0-9]{64}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateIdentity(
  value: Record<string, unknown>,
  expected: ModelEvidenceIdentity,
  blockers: string[],
  prefix: string
) {
  if (value.modelId !== expected.modelId) blockers.push(`${prefix}-model-id-mismatch`);
  if (value.modelVersion !== expected.modelVersion) blockers.push(`${prefix}-model-version-mismatch`);
  if (
    !isText(value.checksumSha256)
    || !SHA256_HEX.test(String(value.checksumSha256))
    || String(value.checksumSha256).toLowerCase() !== expected.checksumSha256.toLowerCase()
  ) {
    blockers.push(`${prefix}-checksum-mismatch`);
  }
}

export function validateOldEnglishCourtProvenanceEvidence(
  value: unknown,
  expected: ModelEvidenceIdentity
): OldEnglishCourtEvidenceValidation {
  const blockers: string[] = [];
  if (!isRecord(value)) return { valid: false, blockers: ['provenance-not-object'] };

  if (value.kind !== 'old-english-court-provenance-evidence') blockers.push('provenance-kind-invalid');
  if (value.version !== OLD_ENGLISH_COURT_EVIDENCE_VERSION) blockers.push('provenance-version-invalid');
  validateIdentity(value, expected, blockers, 'provenance');

  if (!Array.isArray(value.mappings) || value.mappings.length === 0) {
    blockers.push('provenance-mappings-missing');
  } else {
    const requiredSources = new Set(OLD_ENGLISH_COURT_SPATIAL_AUTHORITY.requiredSourceIds);
    const coveredSources = new Set<string>();

    for (const [index, mapping] of value.mappings.entries()) {
      if (!isRecord(mapping)) {
        blockers.push(`provenance-mapping-invalid:${index}`);
        continue;
      }
      if (!isText(mapping.sourceId) || !requiredSources.has(String(mapping.sourceId) as OldEnglishCourtSourceId)) {
        blockers.push(`provenance-source-invalid:${index}`);
      } else {
        coveredSources.add(String(mapping.sourceId));
      }
      if (
        !Array.isArray(mapping.supports)
        || mapping.supports.length === 0
        || mapping.supports.some((item) => !isText(item))
      ) {
        blockers.push(`provenance-supports-missing:${index}`);
      }
      if (
        mapping.evidenceClass !== 'documented'
        && mapping.evidenceClass !== 'reconstructed'
        && mapping.evidenceClass !== 'hypothesis'
      ) {
        blockers.push(`provenance-evidence-class-invalid:${index}`);
      }
    }

    for (const sourceId of requiredSources) {
      if (!coveredSources.has(sourceId)) blockers.push(`provenance-source-unmapped:${sourceId}`);
    }
  }

  if (
    !Array.isArray(value.unresolvedGeometry)
    || value.unresolvedGeometry.some((item) => !isText(item))
  ) {
    blockers.push('provenance-unresolved-geometry-invalid');
  }

  return { valid: blockers.length === 0, blockers };
}

export function validateOldEnglishCourtRightsEvidence(
  value: unknown,
  expected: ModelEvidenceIdentity
): OldEnglishCourtEvidenceValidation {
  const blockers: string[] = [];
  if (!isRecord(value)) return { valid: false, blockers: ['rights-not-object'] };

  if (value.kind !== 'old-english-court-rights-evidence') blockers.push('rights-kind-invalid');
  if (value.version !== OLD_ENGLISH_COURT_EVIDENCE_VERSION) blockers.push('rights-version-invalid');
  validateIdentity(value, expected, blockers, 'rights');

  if (
    value.modelRightsBasis !== 'owned'
    && value.modelRightsBasis !== 'commissioned'
    && value.modelRightsBasis !== 'licensed'
    && value.modelRightsBasis !== 'public-domain'
  ) {
    blockers.push('rights-basis-invalid');
  }
  if (!isText(value.rightsHolder)) blockers.push('rights-holder-missing');
  if (value.publicationUseVerified !== true) blockers.push('rights-publication-use-unverified');

  if (!Array.isArray(value.thirdPartyInputs)) {
    blockers.push('rights-third-party-inputs-invalid');
  } else {
    for (const [index, input] of value.thirdPartyInputs.entries()) {
      if (!isRecord(input)) {
        blockers.push(`rights-third-party-input-invalid:${index}`);
        continue;
      }
      if (!isText(input.label)) blockers.push(`rights-third-party-label-missing:${index}`);
      if (input.rightsStatus !== 'verified') blockers.push(`rights-third-party-unverified:${index}`);
      if (!isText(input.evidenceRef)) blockers.push(`rights-third-party-evidence-missing:${index}`);
    }
  }

  return { valid: blockers.length === 0, blockers };
}

export function validateOldEnglishCourtMetricScaleEvidence(
  value: unknown,
  expected: ModelEvidenceIdentity
): OldEnglishCourtEvidenceValidation {
  const blockers: string[] = [];
  if (!isRecord(value)) return { valid: false, blockers: ['metric-evidence-not-object'] };

  if (value.kind !== 'old-english-court-metric-scale-evidence') blockers.push('metric-evidence-kind-invalid');
  if (value.version !== OLD_ENGLISH_COURT_EVIDENCE_VERSION) blockers.push('metric-evidence-version-invalid');
  validateIdentity(value, expected, blockers, 'metric-evidence');

  if (value.modelUnits !== 'meters') blockers.push('metric-evidence-units-invalid');
  if (value.metersPerModelUnit !== 1) blockers.push('metric-evidence-scale-not-one');

  if (!Array.isArray(value.measuredReferences) || value.measuredReferences.length === 0) {
    blockers.push('metric-evidence-references-missing');
  } else {
    for (const [index, reference] of value.measuredReferences.entries()) {
      if (!isRecord(reference)) {
        blockers.push(`metric-evidence-reference-invalid:${index}`);
        continue;
      }
      if (!isText(reference.label)) blockers.push(`metric-evidence-label-missing:${index}`);
      if (!isText(reference.sourceRef)) blockers.push(`metric-evidence-source-missing:${index}`);
      if (
        typeof reference.measuredMeters !== 'number'
        || !Number.isFinite(reference.measuredMeters)
        || reference.measuredMeters <= 0
      ) {
        blockers.push(`metric-evidence-measured-distance-invalid:${index}`);
      }
      if (
        typeof reference.modelDistanceMeters !== 'number'
        || !Number.isFinite(reference.modelDistanceMeters)
        || reference.modelDistanceMeters <= 0
      ) {
        blockers.push(`metric-evidence-model-distance-invalid:${index}`);
      }
    }
  }

  return { valid: blockers.length === 0, blockers };
}

export function validateOldEnglishCourtStructuredEvidence(
  evidence: OldEnglishCourtStructuredEvidence,
  expected: ModelEvidenceIdentity
): OldEnglishCourtEvidenceValidation {
  const blockers = [
    ...validateOldEnglishCourtProvenanceEvidence(evidence.provenance, expected).blockers,
    ...validateOldEnglishCourtRightsEvidence(evidence.rights, expected).blockers,
    ...validateOldEnglishCourtMetricScaleEvidence(evidence.metricScale, expected).blockers
  ];
  return { valid: blockers.length === 0, blockers };
}
