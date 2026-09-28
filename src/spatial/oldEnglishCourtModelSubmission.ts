import {
  OLD_ENGLISH_COURT_SPATIAL_AUTHORITY,
  evaluateOldEnglishCourtModelCandidate,
  type OldEnglishCourtModelCandidate,
  type OldEnglishCourtSourceId
} from './oldEnglishCourtSpatialAuthority.ts';
import type { SpatialModelBinaryReport } from './spatialModelAssetContract.ts';

export const OLD_ENGLISH_COURT_MODEL_SUBMISSION_VERSION = 2;

export type OldEnglishCourtModelSubmissionManifest = {
  kind: 'old-english-court-model-submission';
  version: typeof OLD_ENGLISH_COURT_MODEL_SUBMISSION_VERSION;
  id: string;
  modelVersion: number;
  assetPath: string;
  binaryReportPath: string;
  sourceIds: OldEnglishCourtSourceId[];
  provenanceEvidenceRef: string;
  rightsStatus: 'verified';
  rightsEvidenceRef: string;
  modelUnits: 'meters';
  metricScaleStatus: 'verified';
  metricScaleEvidenceRef: string;
  checksumSha256: string;
};

export type OldEnglishCourtModelSubmissionValidation = {
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

function isBundleRelativePath(value: unknown, extension: string) {
  if (!isText(value)) return false;
  const normalized = value.replace(/\\/g, '/');
  return !normalized.startsWith('/')
    && !/^[A-Za-z]:\//.test(normalized)
    && !normalized.split('/').includes('..')
    && normalized.toLowerCase().endsWith(extension);
}

export function validateOldEnglishCourtModelSubmissionManifest(
  value: unknown
): OldEnglishCourtModelSubmissionValidation {
  const blockers: string[] = [];
  if (!isRecord(value)) return { valid: false, blockers: ['submission-not-object'] };

  if (value.kind !== 'old-english-court-model-submission') {
    blockers.push('submission-kind-invalid');
  }
  if (value.version !== OLD_ENGLISH_COURT_MODEL_SUBMISSION_VERSION) {
    blockers.push('submission-version-invalid');
  }
  if (!isText(value.id)) blockers.push('submission-id-missing');
  if (!Number.isInteger(value.modelVersion) || Number(value.modelVersion) < 1) {
    blockers.push('submission-model-version-invalid');
  }
  if (!isBundleRelativePath(value.assetPath, '.glb')) {
    blockers.push('submission-asset-path-invalid');
  }
  if (!isBundleRelativePath(value.binaryReportPath, '.json')) {
    blockers.push('submission-binary-report-path-invalid');
  }

  const sourceIds = Array.isArray(value.sourceIds)
    ? value.sourceIds.filter((item): item is string => typeof item === 'string')
    : [];
  if (
    !Array.isArray(value.sourceIds)
    || sourceIds.length !== value.sourceIds.length
    || sourceIds.length === 0
    || new Set(sourceIds).size !== sourceIds.length
  ) {
    blockers.push('submission-source-ids-invalid');
  } else {
    const required = new Set(OLD_ENGLISH_COURT_SPATIAL_AUTHORITY.requiredSourceIds);
    const supplied = new Set(sourceIds);
    if (
      supplied.size !== required.size
      || [...required].some((sourceId) => !supplied.has(sourceId))
    ) {
      blockers.push('submission-source-ledger-mismatch');
    }
  }

  if (!isBundleRelativePath(value.provenanceEvidenceRef, '.json')) {
    blockers.push('submission-provenance-evidence-missing');
  }
  if (value.rightsStatus !== 'verified') blockers.push('submission-rights-not-verified');
  if (!isBundleRelativePath(value.rightsEvidenceRef, '.json')) {
    blockers.push('submission-rights-evidence-missing');
  }
  if (value.modelUnits !== 'meters') blockers.push('submission-model-units-not-meters');
  if (value.metricScaleStatus !== 'verified') blockers.push('submission-scale-not-verified');
  if (!isBundleRelativePath(value.metricScaleEvidenceRef, '.json')) {
    blockers.push('submission-scale-evidence-missing');
  }
  if (!isText(value.checksumSha256) || !SHA256_HEX.test(String(value.checksumSha256))) {
    blockers.push('submission-checksum-invalid');
  }

  return { valid: blockers.length === 0, blockers };
}

export function parseOldEnglishCourtModelSubmissionManifest(
  raw: string
): OldEnglishCourtModelSubmissionManifest {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('Old English Court model submission is not valid JSON');
  }

  const validation = validateOldEnglishCourtModelSubmissionManifest(value);
  if (!validation.valid) {
    throw new Error(
      `Old English Court model submission failed: ${validation.blockers.join('; ')}`
    );
  }
  return value as OldEnglishCourtModelSubmissionManifest;
}

export function buildOldEnglishCourtModelCandidateFromSubmission(
  manifest: OldEnglishCourtModelSubmissionManifest,
  binaryReport: SpatialModelBinaryReport
): OldEnglishCourtModelCandidate {
  const manifestValidation = validateOldEnglishCourtModelSubmissionManifest(manifest);
  if (!manifestValidation.valid) {
    throw new Error(
      `Old English Court model submission failed: ${manifestValidation.blockers.join('; ')}`
    );
  }

  const candidate: OldEnglishCourtModelCandidate = {
    id: manifest.id,
    version: manifest.modelVersion,
    assetPath: manifest.assetPath,
    sourceIds: [...manifest.sourceIds],
    provenanceEvidenceRef: manifest.provenanceEvidenceRef,
    rightsStatus: manifest.rightsStatus,
    rightsEvidenceRef: manifest.rightsEvidenceRef,
    modelUnits: manifest.modelUnits,
    metricScaleStatus: manifest.metricScaleStatus,
    metricScaleEvidenceRef: manifest.metricScaleEvidenceRef,
    checksumSha256: manifest.checksumSha256,
    binaryReport
  };

  const readiness = evaluateOldEnglishCourtModelCandidate(candidate);
  if (!readiness.modelCandidateAccepted) {
    throw new Error(
      `Old English Court model candidate rejected: ${readiness.blockers.join('; ')}`
    );
  }
  return candidate;
}
