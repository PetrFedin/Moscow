import type { VisualLandmarkDecision } from './visualLandmarkReference.ts';
import {
  temporalSceneAtTimeMachineIndex,
  validateTemporalSceneRecord,
  type TemporalAssetBinding,
  type TemporalSceneRecord,
  type TemporalSceneValidation
} from './temporalSceneAuthority.ts';

export type VisualRecognitionReleaseDecision = {
  releasable: boolean;
  reasons: string[];
};

export type InstantHistoricalRevealStatus =
  | 'ready'
  | 'needs-user-confirmation'
  | 'needs-period-selection'
  | 'fallback-manual-selection'
  | 'blocked-unverified-site'
  | 'blocked-recognition-quality'
  | 'blocked-temporal-authority'
  | 'blocked-site-mismatch'
  | 'blocked-scene-unavailable'
  | 'blocked-scene-selection-conflict';

export type HistoricalRevealContextSource =
  | 'strict-visual-match'
  | 'user-confirmed-visual';

export type HistoricalRevealSceneOption = {
  id: string;
  version: number;
  periodLabelRu: string;
  periodLabelEn: string;
  extent: TemporalSceneRecord['extent'];
  confidence: TemporalSceneRecord['confidence'];
  reconstructionStatus: TemporalSceneRecord['reconstructionStatus'];
  interpretationMode: TemporalSceneRecord['interpretationMode'];
  timeMachineIndexes: number[];
};

export type InstantHistoricalRevealPayload = {
  siteId: string;
  contextSource: HistoricalRevealContextSource;
  visual: {
    referenceId?: string;
    confidence?: number;
  };
  scene: {
    id: string;
    version: number;
    periodLabelRu: string;
    periodLabelEn: string;
    extent: TemporalSceneRecord['extent'];
    confidence: TemporalSceneRecord['confidence'];
    reconstructionStatus: TemporalSceneRecord['reconstructionStatus'];
    interpretationMode: TemporalSceneRecord['interpretationMode'];
  };
  evidence: {
    sourceIds: string[];
    claimIds: string[];
    evidenceElementIds: string[];
  };
  assets: {
    overlays: TemporalAssetBinding[];
    reconstructions: TemporalAssetBinding[];
    audio: TemporalAssetBinding[];
    other: TemporalAssetBinding[];
  };
};

export type InstantHistoricalRevealDecision = {
  status: InstantHistoricalRevealStatus;
  reason: string;
  payload?: InstantHistoricalRevealPayload;
  sceneOptions?: HistoricalRevealSceneOption[];
  blockingReasons?: string[];
};

function cloneExtent(extent: TemporalSceneRecord['extent']): TemporalSceneRecord['extent'] {
  switch (extent.kind) {
    case 'exact-date':
      return { kind: 'exact-date', date: { ...extent.date } };
    case 'exact-year':
      return { kind: 'exact-year', year: extent.year };
    case 'bounded-range':
    case 'approximate-range':
      return {
        kind: extent.kind,
        from: { ...extent.from },
        to: { ...extent.to }
      };
    case 'reference-points':
      return { kind: 'reference-points', years: [...extent.years] };
    case 'undated':
      return { kind: 'undated' };
  }
}

function cloneBinding(binding: TemporalAssetBinding): TemporalAssetBinding {
  return { ...binding };
}

function sceneOption(scene: TemporalSceneRecord): HistoricalRevealSceneOption {
  return {
    id: scene.id,
    version: scene.version,
    periodLabelRu: scene.periodLabelRu,
    periodLabelEn: scene.periodLabelEn,
    extent: cloneExtent(scene.extent),
    confidence: scene.confidence,
    reconstructionStatus: scene.reconstructionStatus,
    interpretationMode: scene.interpretationMode,
    timeMachineIndexes: [...(scene.timeMachineIndexes ?? [])]
  };
}

function eligibleScenes(scenes: TemporalSceneRecord[], siteId: string) {
  return scenes.filter((scene) =>
    scene.placeId === siteId
    && scene.publicationState === 'production-candidate'
    && validateTemporalSceneRecord(scene).valid
  );
}

function resolveVisualContext(input: {
  visualDecision: VisualLandmarkDecision;
  recognitionRelease: VisualRecognitionReleaseDecision;
  confirmedSiteId?: string;
}): InstantHistoricalRevealDecision | {
  siteId: string;
  contextSource: HistoricalRevealContextSource;
  referenceId?: string;
  confidence?: number;
} {
  const decision = input.visualDecision;

  if (decision.status === 'blocked-unverified-site') {
    return {
      status: 'blocked-unverified-site',
      reason: 'visual-site-not-field-verified'
    };
  }

  if (decision.status === 'not-sure') {
    return {
      status: 'fallback-manual-selection',
      reason: 'visual-recognition-not-sure'
    };
  }

  if (!decision.siteId?.trim()) {
    return {
      status: 'blocked-site-mismatch',
      reason: 'visual-decision-site-missing'
    };
  }

  if (!input.recognitionRelease.releasable) {
    const unverified = input.recognitionRelease.reasons.includes('site-not-field-verified');
    return {
      status: unverified ? 'blocked-unverified-site' : 'blocked-recognition-quality',
      reason: unverified ? 'visual-release-site-not-field-verified' : 'visual-recognition-release-blocked',
      blockingReasons: [...input.recognitionRelease.reasons]
    };
  }

  if (decision.status === 'needs-user-confirmation') {
    if (!input.confirmedSiteId) {
      return {
        status: 'needs-user-confirmation',
        reason: 'visual-candidate-requires-user-confirmation'
      };
    }
    if (input.confirmedSiteId !== decision.siteId) {
      return {
        status: 'blocked-site-mismatch',
        reason: 'user-confirmed-different-site'
      };
    }
    return {
      siteId: decision.siteId,
      contextSource: 'user-confirmed-visual',
      ...(decision.referenceId ? { referenceId: decision.referenceId } : {}),
      ...(decision.confidence !== undefined ? { confidence: decision.confidence } : {})
    };
  }

  if (decision.status !== 'matched') {
    return {
      status: 'fallback-manual-selection',
      reason: 'visual-decision-not-revealable'
    };
  }

  return {
    siteId: decision.siteId,
    contextSource: 'strict-visual-match',
    ...(decision.referenceId ? { referenceId: decision.referenceId } : {}),
    ...(decision.confidence !== undefined ? { confidence: decision.confidence } : {})
  };
}

function isDecision(
  value: ReturnType<typeof resolveVisualContext>
): value is InstantHistoricalRevealDecision {
  return 'status' in value;
}

function buildPayload(input: {
  scene: TemporalSceneRecord;
  siteId: string;
  contextSource: HistoricalRevealContextSource;
  referenceId?: string;
  confidence?: number;
}): InstantHistoricalRevealPayload {
  const overlays = input.scene.assetBindings
    .filter((asset) => asset.kind === 'archive-image' || asset.kind === 'iiif')
    .map(cloneBinding);
  const reconstructions = input.scene.assetBindings
    .filter((asset) => asset.kind === 'model3d')
    .map(cloneBinding);
  const audio = input.scene.assetBindings
    .filter((asset) => asset.kind === 'audio')
    .map(cloneBinding);
  const other = input.scene.assetBindings
    .filter((asset) => !['archive-image', 'iiif', 'model3d', 'audio'].includes(asset.kind))
    .map(cloneBinding);

  return {
    siteId: input.siteId,
    contextSource: input.contextSource,
    visual: {
      ...(input.referenceId ? { referenceId: input.referenceId } : {}),
      ...(input.confidence !== undefined ? { confidence: input.confidence } : {})
    },
    scene: {
      id: input.scene.id,
      version: input.scene.version,
      periodLabelRu: input.scene.periodLabelRu,
      periodLabelEn: input.scene.periodLabelEn,
      extent: cloneExtent(input.scene.extent),
      confidence: input.scene.confidence,
      reconstructionStatus: input.scene.reconstructionStatus,
      interpretationMode: input.scene.interpretationMode
    },
    evidence: {
      sourceIds: [...input.scene.sourceIds],
      claimIds: [...input.scene.claimIds],
      evidenceElementIds: [...input.scene.evidenceElementIds]
    },
    assets: {
      overlays,
      reconstructions,
      audio,
      other
    }
  };
}

export function buildInstantHistoricalReveal(input: {
  visualDecision: VisualLandmarkDecision;
  recognitionRelease: VisualRecognitionReleaseDecision;
  temporalScenes: TemporalSceneRecord[];
  temporalRegistryValidation: TemporalSceneValidation;
  confirmedSiteId?: string;
  selectedSceneId?: string;
  selectedTimeMachineIndex?: number;
}): InstantHistoricalRevealDecision {
  if (!input.temporalRegistryValidation.valid) {
    return {
      status: 'blocked-temporal-authority',
      reason: 'temporal-registry-invalid',
      blockingReasons: [...input.temporalRegistryValidation.blockers]
    };
  }

  const visual = resolveVisualContext({
    visualDecision: input.visualDecision,
    recognitionRelease: input.recognitionRelease,
    confirmedSiteId: input.confirmedSiteId
  });
  if (isDecision(visual)) return visual;

  const scenes = eligibleScenes(input.temporalScenes, visual.siteId);
  if (scenes.length === 0) {
    return {
      status: 'blocked-scene-unavailable',
      reason: 'no-production-temporal-scene-for-visual-site'
    };
  }

  let byId: TemporalSceneRecord | undefined;
  if (input.selectedSceneId !== undefined) {
    byId = scenes.find((scene) => scene.id === input.selectedSceneId);
    if (!byId) {
      const foreign = input.temporalScenes.find((scene) => scene.id === input.selectedSceneId);
      return {
        status: foreign && foreign.placeId !== visual.siteId
          ? 'blocked-site-mismatch'
          : 'blocked-scene-unavailable',
        reason: foreign && foreign.placeId !== visual.siteId
          ? 'selected-temporal-scene-belongs-to-different-site'
          : 'selected-temporal-scene-not-production-eligible'
      };
    }
  }

  let byIndex: TemporalSceneRecord | undefined;
  if (input.selectedTimeMachineIndex !== undefined) {
    if (!Number.isFinite(input.selectedTimeMachineIndex)) {
      return {
        status: 'blocked-scene-unavailable',
        reason: 'selected-time-machine-index-invalid'
      };
    }
    byIndex = temporalSceneAtTimeMachineIndex(
      scenes,
      visual.siteId,
      input.selectedTimeMachineIndex
    ) ?? undefined;
    if (!byIndex) {
      return {
        status: 'blocked-scene-unavailable',
        reason: 'selected-time-machine-index-has-no-production-scene'
      };
    }
  }

  if (byId && byIndex && byId.id !== byIndex.id) {
    return {
      status: 'blocked-scene-selection-conflict',
      reason: 'scene-id-and-time-index-resolve-differently'
    };
  }

  const selected = byId ?? byIndex;
  if (!selected) {
    if (scenes.length > 1) {
      return {
        status: 'needs-period-selection',
        reason: 'multiple-production-temporal-scenes',
        sceneOptions: scenes.map(sceneOption)
      };
    }

    return {
      status: 'ready',
      reason: 'single-production-temporal-scene',
      payload: buildPayload({
        scene: scenes[0]!,
        siteId: visual.siteId,
        contextSource: visual.contextSource,
        ...(visual.referenceId ? { referenceId: visual.referenceId } : {}),
        ...(visual.confidence !== undefined ? { confidence: visual.confidence } : {})
      })
    };
  }

  return {
    status: 'ready',
    reason: byId ? 'explicit-temporal-scene-selected' : 'time-machine-scene-selected',
    payload: buildPayload({
      scene: selected,
      siteId: visual.siteId,
      contextSource: visual.contextSource,
      ...(visual.referenceId ? { referenceId: visual.referenceId } : {}),
      ...(visual.confidence !== undefined ? { confidence: visual.confidence } : {})
    })
  };
}
