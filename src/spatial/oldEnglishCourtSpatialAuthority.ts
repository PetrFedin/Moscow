import {
  validateSpatialModelBinaryReport,
  type SpatialModelBinaryReport
} from './spatialModelAssetContract.ts';

export const OLD_ENGLISH_COURT_SOURCE_LEDGER = [
  {
    id: 'zaryadye-old-english-court',
    label: 'Парк «Зарядье» — Старый Английский двор',
    url: 'https://welcome.zaryadyepark.ru/map'
  },
  {
    id: 'museum-of-moscow-history',
    label: 'Музей Москвы — история Старого Английского двора',
    url: 'https://mosmuseum.ru/news/p/staryiy-angliyskiy-dvor-stanet-chastyu-parka-zaryade/'
  },
  {
    id: 'museum-of-moscow-restoration',
    label: 'Музей Москвы — реставрация и музейная экспозиция',
    url: 'https://mosmuseum.ru/news/p/muzey-moskvyi-otkryil-staryiy-angliyskiy-dvor-posle-restavratsii/'
  }
] as const;

export type OldEnglishCourtSourceId = typeof OLD_ENGLISH_COURT_SOURCE_LEDGER[number]['id'];

export const OLD_ENGLISH_COURT_SPATIAL_AUTHORITY = {
  id: 'old-english-court-spatial-authority-v1',
  version: 1,
  placeId: 'old-english-court',
  modelUnits: 'meters',
  coordinateReference: 'WGS84',
  status: 'asset-intake' as const,
  requiredSourceIds: OLD_ENGLISH_COURT_SOURCE_LEDGER.map((source) => source.id)
};

export type OldEnglishCourtHistoricalLayer =
  | '1556-documented'
  | '1960s-restoration-reconstructed'
  | '1994-museum-documented';

export const oldEnglishCourtHistoricalLayers: Array<{
  id: OldEnglishCourtHistoricalLayer;
  periodId: string;
  evidence: 'documented' | 'reconstructed';
  sourceIds: OldEnglishCourtSourceId[];
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
  sourceIds: OldEnglishCourtSourceId[];
  provenanceEvidenceRef?: string;
  rightsStatus: 'unknown' | 'restricted' | 'verified';
  rightsEvidenceRef?: string;
  modelUnits: 'meters' | 'unknown';
  metricScaleStatus: 'unknown' | 'provisional' | 'verified';
  metricScaleEvidenceRef?: string;
  checksumSha256?: string;
  binaryReport?: SpatialModelBinaryReport;
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
    if (
      !candidate.id.trim()
      || !candidate.assetPath.trim()
      || !candidate.assetPath.toLowerCase().endsWith('.glb')
      || !Number.isInteger(candidate.version)
      || candidate.version < 1
    ) {
      blockers.push('model-identity-invalid');
    }
    if (candidate.rightsStatus !== 'verified' || !candidate.rightsEvidenceRef?.trim()) {
      blockers.push('model-rights-unverified');
    }
    if (candidate.modelUnits !== 'meters') {
      blockers.push('model-units-not-metric');
    }
    if (candidate.metricScaleStatus !== 'verified' || !candidate.metricScaleEvidenceRef?.trim()) {
      blockers.push('model-scale-not-verified');
    }
    if (!candidate.checksumSha256 || !SHA256_HEX.test(candidate.checksumSha256)) {
      blockers.push('model-checksum-missing');
    }

    if (!candidate.binaryReport) {
      blockers.push('model-binary-report-missing');
    } else {
      const binary = validateSpatialModelBinaryReport(candidate.binaryReport);
      for (const blocker of binary.blockers) {
        blockers.push(`model-binary:${blocker}`);
      }
      const assetFilename = candidate.assetPath.split('/').at(-1);
      if (assetFilename !== candidate.binaryReport.filename) {
        blockers.push('model-binary-filename-mismatch');
      }
      if (
        candidate.checksumSha256
        && candidate.binaryReport.sha256.toLowerCase() !== candidate.checksumSha256.toLowerCase()
      ) {
        blockers.push('model-binary-checksum-mismatch');
      }
    }

    const sourceIds = new Set(candidate.sourceIds);
    const provenanceComplete = OLD_ENGLISH_COURT_SPATIAL_AUTHORITY.requiredSourceIds
      .every((sourceId) => sourceIds.has(sourceId));
    if (!provenanceComplete) blockers.push('model-provenance-incomplete');
    if (!candidate.provenanceEvidenceRef?.trim()) blockers.push('model-provenance-evidence-missing');
  }

  return {
    authorityId: OLD_ENGLISH_COURT_SPATIAL_AUTHORITY.id,
    modelCandidateAccepted: blockers.length === 0,
    blockers
  };
}

export const currentOldEnglishCourtReadiness = evaluateOldEnglishCourtModelCandidate();
