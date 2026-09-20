export const OLD_ENGLISH_COURT_SPATIAL_AUTHORITY = {
  id: 'old-english-court-spatial-authority-v1',
  version: 1,
  placeId: 'old-english-court',
  modelUnits: 'meters',
  coordinateReference: 'WGS84',
  status: 'asset-intake' as const,
  requiredSourceIds: [
    'zaryadye-old-english-court',
    'museum-of-moscow-history',
    'museum-of-moscow-restoration'
  ] as const
};

export type OldEnglishCourtHistoricalLayer =
  | '1556-documented'
  | '1960s-restoration-reconstructed'
  | '1994-museum-documented';

export const oldEnglishCourtHistoricalLayers: Array<{
  id: OldEnglishCourtHistoricalLayer;
  periodId: string;
  evidence: 'documented' | 'reconstructed';
  sourceIds: string[];
}> = [
  {
    id: '1556-documented',
    periodId: 'english-court-1556',
    evidence: 'documented',
    sourceIds: ['zaryadye-old-english-court', 'museum-of-moscow-history']
  },
  {
    id: '1960s-restoration-reconstructed',
    periodId: 'english-court-1960s',
    evidence: 'reconstructed',
    sourceIds: ['museum-of-moscow-history', 'museum-of-moscow-restoration']
  },
  {
    id: '1994-museum-documented',
    periodId: 'english-court-1994',
    evidence: 'documented',
    sourceIds: ['museum-of-moscow-restoration']
  }
];

export type OldEnglishCourtModelCandidate = {
  id: string;
  version: number;
  assetPath: string;
  sourceIds: string[];
  rightsStatus: 'unknown' | 'restricted' | 'verified';
  rightsEvidenceRef?: string;
  modelUnits: 'meters' | 'unknown';
  metricScaleStatus: 'unknown' | 'provisional' | 'verified';
  checksumSha256?: string;
};

export type OldEnglishCourtSpatialReadiness = {
  authorityId: typeof OLD_ENGLISH_COURT_SPATIAL_AUTHORITY.id;
  modelCandidateAccepted: boolean;
  blockers: string[];
};

const SHA256_HEX = /^[a-f0-9]{64}$/i;

export function evaluateOldEnglishCourtModelCandidate(
  candidate?: OldEnglishCourtModelCandidate | null
): OldEnglishCourtSpatialReadiness {
  const blockers: string[] = [];

  if (!candidate) {
    blockers.push('model-asset-missing');
  } else {
    if (!candidate.id.trim() || !candidate.assetPath.trim() || !Number.isInteger(candidate.version) || candidate.version < 1) {
      blockers.push('model-identity-invalid');
    }
    if (candidate.rightsStatus !== 'verified' || !candidate.rightsEvidenceRef?.trim()) {
      blockers.push('model-rights-unverified');
    }
    if (candidate.modelUnits !== 'meters') {
      blockers.push('model-units-not-metric');
    }
    if (candidate.metricScaleStatus !== 'verified') {
      blockers.push('model-scale-not-verified');
    }
    if (!candidate.checksumSha256 || !SHA256_HEX.test(candidate.checksumSha256)) {
      blockers.push('model-checksum-missing');
    }

    const sourceIds = new Set(candidate.sourceIds);
    const provenanceComplete = OLD_ENGLISH_COURT_SPATIAL_AUTHORITY.requiredSourceIds
      .every((sourceId) => sourceIds.has(sourceId));
    if (!provenanceComplete) blockers.push('model-provenance-incomplete');
  }

  return {
    authorityId: OLD_ENGLISH_COURT_SPATIAL_AUTHORITY.id,
    modelCandidateAccepted: blockers.length === 0,
    blockers
  };
}

export const currentOldEnglishCourtReadiness = evaluateOldEnglishCourtModelCandidate();
