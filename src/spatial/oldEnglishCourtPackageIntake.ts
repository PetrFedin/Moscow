import { places } from '../data/places.ts';
import { localizePlaces } from '../data/places.en.ts';
import {
  isProductionAudioTrack,
  varvarkaAudioCatalog
} from '../features/audio/varvarkaAudioCatalog.ts';
import {
  OLD_ENGLISH_COURT_SOURCE_LEDGER,
  OLD_ENGLISH_COURT_SPATIAL_AUTHORITY,
  evaluateOldEnglishCourtModelCandidate,
  oldEnglishCourtHistoricalLayers,
  type OldEnglishCourtModelCandidate
} from './oldEnglishCourtSpatialAuthority.ts';
import {
  validateSpatialPackageIntake,
  type SpatialPackageIntake,
  type SpatialPackageIntakeRequirement
} from './spatialPackageIntake.ts';

const placeRu = places.find((place) => place.id === 'old-english-court');
const placeEn = localizePlaces(places, 'en').find((place) => place.id === 'old-english-court');

if (!placeRu || !placeEn) {
  throw new Error('Old English Court place data is missing');
}

const periodRu = new Map(placeRu.periods.map((period) => [period.id, period]));
const periodEn = new Map(placeEn.periods.map((period) => [period.id, period]));

const audioTracks = varvarkaAudioCatalog.filter((track) => track.placeId === 'old-english-court');
const productionAudioTracks = audioTracks.filter(isProductionAudioTrack);

const baseRequirements: SpatialPackageIntakeRequirement[] = [
  {
    id: 'oec-model-asset',
    kind: 'model-asset',
    stage: 'package-promotion',
    status: 'missing',
    required: true,
    note: 'A real production GLB must pass the independent Old English Court model intake.'
  },
  {
    id: 'oec-model-rights',
    kind: 'model-rights',
    stage: 'package-promotion',
    status: 'missing',
    required: true,
    note: 'Model reuse/publication rights require explicit evidence separate from factual source citations.'
  },
  {
    id: 'oec-metric-authority',
    kind: 'metric-authority',
    stage: 'package-promotion',
    status: 'missing',
    required: true,
    note: 'Metric authority must be created for Old English Court and must not reuse Romanov metric authority.'
  },
  {
    id: 'oec-control-point-authority',
    kind: 'control-point-authority',
    stage: 'package-promotion',
    status: 'missing',
    required: true,
    note: 'Facade control points must be registered specifically for Old English Court.'
  },
  {
    id: 'oec-archive-asset',
    kind: 'archive-asset',
    stage: 'tourist-experience',
    status: 'missing',
    required: true,
    note: 'Archive Time Lens remains fail-closed until a licensed/evidence-backed visual asset exists.'
  },
  {
    id: 'oec-survey-evidence',
    kind: 'survey-evidence',
    stage: 'field-release',
    status: 'missing',
    required: true
  },
  {
    id: 'oec-field-matrix',
    kind: 'field-matrix',
    stage: 'field-release',
    status: 'missing',
    required: true
  },
  {
    id: 'oec-persistent-anchor',
    kind: 'persistent-anchor',
    stage: 'field-release',
    status: 'missing',
    required: true
  },
  {
    id: 'oec-human-audio',
    kind: 'human-audio',
    stage: 'tourist-experience',
    status: productionAudioTracks.length === audioTracks.length && audioTracks.length > 0
      ? 'ready'
      : 'recording-pending',
    required: false,
    evidenceRefs: productionAudioTracks.length === audioTracks.length && audioTracks.length > 0
      ? audioTracks.map((track) => track.id)
      : undefined,
    note: 'RU/EN scripts exist, but human masters remain an experience-quality dependency rather than a spatial-package promotion gate.'
  }
];

export const oldEnglishCourtPackageIntake: SpatialPackageIntake = {
  schemaVersion: 1,
  id: 'old-english-court-spatial-intake-v1',
  placeId: OLD_ENGLISH_COURT_SPATIAL_AUTHORITY.placeId,
  titleRu: placeRu.title,
  titleEn: placeEn.title,
  version: 1,
  authorityNamespace: 'old-english-court',
  status: 'asset-intake',
  sources: OLD_ENGLISH_COURT_SOURCE_LEDGER.map((source) => ({
    id: source.id,
    label: source.label,
    url: source.url,
    reuseRights: 'reference-only' as const
  })),
  layers: oldEnglishCourtHistoricalLayers.map((layer) => {
    const ru = periodRu.get(layer.periodId);
    const en = periodEn.get(layer.periodId);
    if (!ru || !en) throw new Error(`Old English Court period is missing: ${layer.periodId}`);

    return {
      id: layer.id,
      periodId: layer.periodId,
      trust: layer.evidence,
      titleRu: ru.label,
      titleEn: en.label,
      claimRu: ru.summary,
      claimEn: en.summary,
      sourceIds: [...layer.sourceIds]
    };
  }),
  requirements: baseRequirements,
  languages: ['ru', 'en']
};

export const oldEnglishCourtPackageIntakeValidation =
  validateSpatialPackageIntake(oldEnglishCourtPackageIntake);

function replaceRequirements(
  intake: SpatialPackageIntake,
  replacements: SpatialPackageIntakeRequirement[]
): SpatialPackageIntake {
  const byId = new Map(replacements.map((requirement) => [requirement.id, requirement]));
  return {
    ...intake,
    requirements: intake.requirements.map((requirement) => byId.get(requirement.id) ?? requirement)
  };
}

/**
 * Consumes only the existing Old English Court model-intake authority.
 *
 * A passing model can satisfy model asset/rights intake, but it deliberately
 * cannot invent metric or control-point authorities. Package promotion remains
 * blocked until those object-specific authorities are created from real evidence.
 */
export function evaluateOldEnglishCourtPackageIntake(
  candidate?: OldEnglishCourtModelCandidate | null
) {
  const modelReadiness = evaluateOldEnglishCourtModelCandidate(candidate);
  let intake = oldEnglishCourtPackageIntake;

  if (candidate && modelReadiness.modelCandidateAccepted) {
    intake = replaceRequirements(intake, [
      {
        id: 'oec-model-asset',
        kind: 'model-asset',
        stage: 'package-promotion',
        status: 'ready',
        required: true,
        evidenceRefs: [
          candidate.assetPath,
          `sha256:${candidate.checksumSha256}`,
          candidate.provenanceEvidenceRef!,
          candidate.metricScaleEvidenceRef!
        ]
      },
      {
        id: 'oec-model-rights',
        kind: 'model-rights',
        stage: 'package-promotion',
        status: 'ready',
        required: true,
        evidenceRefs: [candidate.rightsEvidenceRef!]
      }
    ]);
  }

  const validation = validateSpatialPackageIntake(intake);
  return { intake, validation, modelReadiness };
}
