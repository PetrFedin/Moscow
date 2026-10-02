import { places } from '../data/places.ts';
import type { RomanovEra } from './romanov-hotspots.ts';
import { romanovPublishedCandidate } from './romanovPublishedCandidate.ts';
import {
  temporalSceneAtTimeMachineIndex,
  validateTemporalSceneRegistry,
  type TemporalReconstructionStatus,
  type TemporalSceneRecord
} from './temporalSceneAuthority.ts';

const romanovPlace = places.find((place) => place.id === 'romanov-chambers');
if (!romanovPlace) throw new Error('Romanov place record is missing');

function elementsForEra(eraId: RomanovEra) {
  return romanovPublishedCandidate.elements.filter((element) => element.eraIds.includes(eraId));
}

function claimsForElements(elementIds: string[]) {
  const set = new Set(elementIds);
  return romanovPublishedCandidate.claims.filter((claim) =>
    claim.modelElementIds.some((elementId) => set.has(elementId))
  );
}

function sourceIdsFor(eraId: RomanovEra, elementIds: string[]) {
  const sources = new Set<string>();
  for (const element of romanovPublishedCandidate.elements) {
    if (!elementIds.includes(element.id)) continue;
    for (const sourceId of element.sourceIds) sources.add(sourceId);
  }
  for (const model of romanovPublishedCandidate.models) {
    if (model.eraId !== eraId) continue;
    for (const sourceId of model.sourceIds) sources.add(sourceId);
  }
  return [...sources];
}

function reconstructionStatusFor(elementIds: string[]): TemporalReconstructionStatus {
  const states = new Set(
    romanovPublishedCandidate.elements
      .filter((element) => elementIds.includes(element.id))
      .map((element) => element.trust)
  );
  if (states.size > 1) return 'mixed';
  const only = [...states][0];
  return only === 'documented' || only === 'reconstructed' || only === 'hypothesis'
    ? only
    : 'mixed';
}

function modelBindingsFor(eraId: RomanovEra) {
  return romanovPublishedCandidate.models
    .filter((model) => model.eraId === eraId)
    .map((model) => ({
      kind: 'model3d' as const,
      id: model.id,
      trustMode: model.trustMode
    }));
}

const elements1857 = elementsForEra('1857').map((element) => element.id);
const elementsRestoration = elementsForEra('1859').map((element) => element.id);

export const romanovTemporalScenes: TemporalSceneRecord[] = [
  {
    id: 'romanov-pre-restoration-1857',
    placeId: 'romanov-chambers',
    version: 1,
    periodLabelRu: 'До реставрации · 1857',
    periodLabelEn: 'Before restoration · 1857',
    extent: { kind: 'exact-year', year: 1857 },
    confidence: 'not-assessed',
    reconstructionStatus: reconstructionStatusFor(elements1857),
    interpretationMode: 'public-research',
    sourceIds: sourceIdsFor('1857', elements1857),
    claimIds: claimsForElements(elements1857).map((claim) => claim.id),
    evidenceElementIds: elements1857,
    assetBindings: modelBindingsFor('1857'),
    experiencePeriodIds: ['romanov-1857'],
    runtimeEraId: '1857',
    timeMachineIndexes: [0],
    publicationState: 'production-candidate'
  },
  {
    id: 'romanov-restoration-reference-state',
    placeId: 'romanov-chambers',
    version: 1,
    periodLabelRu: 'Реставрация Рихтера / архивная опора · 1859 / 1883',
    periodLabelEn: 'Richter restoration / archival reference · 1859 / 1883',
    extent: { kind: 'reference-points', years: [1859, 1883] },
    confidence: 'not-assessed',
    reconstructionStatus: reconstructionStatusFor(elementsRestoration),
    interpretationMode: 'composite-research',
    sourceIds: sourceIdsFor('1859', elementsRestoration),
    claimIds: claimsForElements(elementsRestoration).map((claim) => claim.id),
    evidenceElementIds: elementsRestoration,
    assetBindings: modelBindingsFor('1859'),
    experiencePeriodIds: ['romanov-1883'],
    runtimeEraId: '1859',
    timeMachineIndexes: [1, 2],
    publicationState: 'production-candidate'
  }
];

const authority = {
  sourceIds: new Set(romanovPublishedCandidate.sources.map((source) => source.id)),
  claimIds: new Set(romanovPublishedCandidate.claims.map((claim) => claim.id)),
  evidenceElementIds: new Set(romanovPublishedCandidate.elements.map((element) => element.id)),
  assetIds: new Set(romanovPublishedCandidate.models.map((model) => model.id)),
  assetSourceIds: new Map(
    romanovPublishedCandidate.models.map((model) => [model.id, model.sourceIds] as const)
  ),
  experiencePeriodIds: new Set(romanovPlace.periods.map((period) => period.id))
};

export const romanovTemporalSceneValidation = validateTemporalSceneRegistry(
  romanovTemporalScenes,
  authority
);

export function getRomanovTemporalSceneAtTimeIndex(index: number) {
  const exact = temporalSceneAtTimeMachineIndex(romanovTemporalScenes, 'romanov-chambers', index);
  if (exact) return exact;

  const active = romanovTemporalScenes.filter((scene) =>
    scene.placeId === 'romanov-chambers'
    && scene.publicationState !== 'superseded'
    && (scene.timeMachineIndexes?.length ?? 0) > 0
  );
  const maximumIndex = Math.max(
    ...active.flatMap((scene) => scene.timeMachineIndexes ?? [])
  );
  if (!Number.isFinite(maximumIndex)) return null;

  const rounded = Math.max(0, Math.round(index));
  return rounded > maximumIndex
    ? active.find((scene) => scene.timeMachineIndexes?.includes(maximumIndex)) ?? null
    : null;
}

export function getRomanovRuntimeEraAtTimeIndex(index: number): RomanovEra | null {
  const scene = getRomanovTemporalSceneAtTimeIndex(index);
  return scene?.runtimeEraId === '1857' || scene?.runtimeEraId === '1859'
    ? scene.runtimeEraId
    : null;
}
