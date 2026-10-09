import type { VisualSensorFusionDecision } from './visualSensorFusion.ts';
import {
  temporalSceneAtTimeMachineIndex,
  validateTemporalSceneRecord,
  type TemporalAssetBinding,
  type TemporalSceneRecord,
  type TemporalSceneValidation
} from './temporalSceneAuthority.ts';

export type InstantHistoricalRevealStatus =
  | 'ready'
  | 'needs-user-confirmation'
  | 'needs-period-selection'
  | 'fallback-manual-selection'
  | 'blocked-fusion-context'
  | 'blocked-temporal-authority'
  | 'blocked-site-mismatch'
  | 'blocked-scene-unavailable'
  | 'blocked-scene-selection-conflict';

export type HistoricalRevealContextSource =
  | 'sensor-fusion-automatic'
  | 'sensor-fusion-user-assisted';

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
  packageId: string;
  contextSource: HistoricalRevealContextSource;
  fusion: {
    referenceSetId: string;
    referenceId: string;
    visualConfidence: number;
    sensorState: VisualSensorFusionDecision['sensorState'];
    locationCompatibility: VisualSensorFusionDecision['locationCompatibility'];
    headingCompatibility: VisualSensorFusionDecision['headingCompatibility'];
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

type ConfirmedFusionContext = {
  siteId: string;
  packageId: string;
  contextSource: HistoricalRevealContextSource;
  referenceSetId: string;
  referenceId: string;
  visualConfidence: number;
  sensorState: VisualSensorFusionDecision['sensorState'];
  locationCompatibility: VisualSensorFusionDecision['locationCompatibility'];
  headingCompatibility: VisualSensorFusionDecision['headingCompatibility'];
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

function resolveFusionContext(
  fusion: VisualSensorFusionDecision
): InstantHistoricalRevealDecision | ConfirmedFusionContext {
  if (fusion.status === 'blocked') {
    return {
      status: 'blocked-fusion-context',
      reason: 'sensor-fusion-blocked',
      blockingReasons: [fusion.reason]
    };
  }

  if (fusion.status === 'not-sure') {
    return {
      status: 'fallback-manual-selection',
      reason: 'sensor-fusion-not-sure'
    };
  }

  if (fusion.status === 'needs-user-confirmation') {
    return {
      status: 'needs-user-confirmation',
      reason: 'sensor-fusion-requires-user-confirmation'
    };
  }

  if (fusion.status !== 'confirmed') {
    return {
      status: 'blocked-fusion-context',
      reason: 'sensor-fusion-status-invalid'
    };
  }

  if (
    !fusion.siteId?.trim()
    || !fusion.packageId?.trim()
    || !fusion.referenceSetId?.trim()
    || !fusion.referenceId?.trim()
    || fusion.visualConfidence === undefined
    || !Number.isFinite(fusion.visualConfidence)
  ) {
    return {
      status: 'blocked-fusion-context',
      reason: 'confirmed-fusion-context-incomplete'
    };
  }

  if (
    fusion.confirmationMode !== 'automatic'
    && fusion.confirmationMode !== 'user-assisted'
  ) {
    return {
      status: 'blocked-fusion-context',
      reason: 'confirmed-fusion-mode-invalid'
    };
  }

  return {
    siteId: fusion.siteId,
    packageId: fusion.packageId,
    contextSource: fusion.confirmationMode === 'automatic'
      ? 'sensor-fusion-automatic'
      : 'sensor-fusion-user-assisted',
    referenceSetId: fusion.referenceSetId,
    referenceId: fusion.referenceId,
    visualConfidence: fusion.visualConfidence,
    sensorState: fusion.sensorState,
    locationCompatibility: fusion.locationCompatibility,
    headingCompatibility: fusion.headingCompatibility
  };
}

function isDecision(
  value: InstantHistoricalRevealDecision | ConfirmedFusionContext
): value is InstantHistoricalRevealDecision {
  return 'status' in value;
}

function buildPayload(input: {
  scene: TemporalSceneRecord;
  fusion: ConfirmedFusionContext;
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
    siteId: input.fusion.siteId,
    packageId: input.fusion.packageId,
    contextSource: input.fusion.contextSource,
    fusion: {
      referenceSetId: input.fusion.referenceSetId,
      referenceId: input.fusion.referenceId,
      visualConfidence: input.fusion.visualConfidence,
      sensorState: input.fusion.sensorState,
      locationCompatibility: input.fusion.locationCompatibility,
      headingCompatibility: input.fusion.headingCompatibility
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
  fusionDecision: VisualSensorFusionDecision;
  temporalScenes: TemporalSceneRecord[];
  temporalRegistryValidation: TemporalSceneValidation;
  selectedSceneId?: string;
  selectedTimeMachineIndex?: number;
}): InstantHistoricalRevealDecision {
  const fusion = resolveFusionContext(input.fusionDecision);
  if (isDecision(fusion)) return fusion;

  if (!input.temporalRegistryValidation.valid) {
    return {
      status: 'blocked-temporal-authority',
      reason: 'temporal-registry-invalid',
      blockingReasons: [...input.temporalRegistryValidation.blockers]
    };
  }

  const scenes = eligibleScenes(input.temporalScenes, fusion.siteId);
  if (scenes.length === 0) {
    return {
      status: 'blocked-scene-unavailable',
      reason: 'no-production-temporal-scene-for-fused-site'
    };
  }

  let byId: TemporalSceneRecord | undefined;
  if (input.selectedSceneId !== undefined) {
    byId = scenes.find((scene) => scene.id === input.selectedSceneId);
    if (!byId) {
      const foreign = input.temporalScenes.find((scene) => scene.id === input.selectedSceneId);
      return {
        status: foreign && foreign.placeId !== fusion.siteId
          ? 'blocked-site-mismatch'
          : 'blocked-scene-unavailable',
        reason: foreign && foreign.placeId !== fusion.siteId
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
      fusion.siteId,
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
        fusion
      })
    };
  }

  return {
    status: 'ready',
    reason: byId ? 'explicit-temporal-scene-selected' : 'time-machine-scene-selected',
    payload: buildPayload({
      scene: selected,
      fusion
    })
  };
}
