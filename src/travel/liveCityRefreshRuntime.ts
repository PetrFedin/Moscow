import {
  mergeLiveDestinationFeeds,
  ingestLiveProviderSnapshot,
  type LiveProviderAdapter,
  type LiveProviderIngestionRecord,
  type LiveProviderSnapshot
} from './liveProviderIngestion.ts';
import {
  projectLiveDestinationFeed,
  type LiveDestinationFeed,
  type LiveDestinationProjectionEntity
} from './liveDestinationAuthority.ts';
import {
  applyJourneyRuntimeEvent,
  type DestinationJourneyRuntime
} from './destinationJourneyRuntime.ts';

export const LIVE_CITY_REFRESH_RUNTIME_VERSION = 1 as const;

export type LiveCityRefreshSource = {
  // Heterogeneous provider aggregation boundary: each adapter/snapshot pair
  // retains its payload contract before entering the merged runtime.
  adapter: LiveProviderAdapter<any>;
  snapshot: LiveProviderSnapshot<any>;
};

export type LiveCityDisruptionReason =
  | 'closed'
  | 'cancelled'
  | 'rescheduled'
  | 'stale';

export type LiveCityDisruption = {
  entityId: string;
  canonicalDestinationNodeId?: string;
  providerId: string;
  providerName: string;
  reason: LiveCityDisruptionReason;
  evidenceRef: string;
  observedAt: string;
  detectedAt: string;
};

export type LiveCityRefreshRuntimeResult = {
  version: typeof LIVE_CITY_REFRESH_RUNTIME_VERSION;
  destinationId: string;
  refreshedAt: string;
  ingestionRecords: LiveProviderIngestionRecord[];
  mergedFeed: LiveDestinationFeed;
  projection: ReturnType<typeof projectLiveDestinationFeed>;
  disruptions: LiveCityDisruption[];
};

function disruptionReason(entity: LiveDestinationProjectionEntity): LiveCityDisruptionReason | undefined {
  if (entity.freshness !== 'fresh') return 'stale';
  if (entity.operationalStatus === 'closed' || entity.operationalStatus === 'temporarily-closed') {
    return 'closed';
  }
  if (entity.operationalStatus === 'cancelled') return 'cancelled';
  if (entity.operationalStatus === 'rescheduled') return 'rescheduled';
  return undefined;
}

function evidenceRefFor(input: {
  entity: LiveDestinationProjectionEntity;
  recordByProviderId: Map<string, LiveProviderIngestionRecord>;
}) {
  const record = input.recordByProviderId.get(input.entity.providerId);
  if (!record) {
    throw new Error(`Missing ingestion record for provider: ${input.entity.providerId}`);
  }
  return `live-provider:${record.providerId}:${record.snapshotId}:${record.payloadSha256}`;
}

export function runLiveCityRefreshRuntime(input: {
  sources: LiveCityRefreshSource[];
  refreshedAt: string;
}): LiveCityRefreshRuntimeResult {
  if (input.sources.length === 0) throw new Error('Live city refresh requires at least one provider source');
  if (!Number.isFinite(Date.parse(input.refreshedAt))) {
    throw new Error('Live city refresh requires a valid refreshedAt timestamp');
  }

  const ingested = input.sources.map(({ adapter, snapshot }) =>
    ingestLiveProviderSnapshot({
      adapter,
      snapshot,
      normalizedAt: input.refreshedAt
    })
  );

  const mergedFeed = mergeLiveDestinationFeeds(
    ingested.map((item) => item.feed),
    input.refreshedAt
  );
  const projection = projectLiveDestinationFeed(mergedFeed, input.refreshedAt);
  const recordByProviderId = new Map(
    ingested.map((item) => [item.record.providerId, item.record] as const)
  );

  const disruptions = projection.entities.flatMap((entity): LiveCityDisruption[] => {
    const reason = disruptionReason(entity);
    if (!reason) return [];
    return [{
      entityId: entity.id,
      ...(entity.canonicalDestinationNodeId
        ? { canonicalDestinationNodeId: entity.canonicalDestinationNodeId }
        : {}),
      providerId: entity.providerId,
      providerName: entity.providerName,
      reason,
      evidenceRef: evidenceRefFor({ entity, recordByProviderId }),
      observedAt: entity.observedAt,
      detectedAt: input.refreshedAt
    }];
  });

  return {
    version: LIVE_CITY_REFRESH_RUNTIME_VERSION,
    destinationId: mergedFeed.destinationId,
    refreshedAt: input.refreshedAt,
    ingestionRecords: ingested.map((item) => item.record),
    mergedFeed,
    projection,
    disruptions
  };
}

export function applyLiveCityDisruptionsToJourneyRuntime(input: {
  runtime: DestinationJourneyRuntime;
  refresh: Pick<LiveCityRefreshRuntimeResult, 'disruptions' | 'refreshedAt'>;
}): DestinationJourneyRuntime {
  let runtime = input.runtime;

  for (const disruption of input.refresh.disruptions) {
    const block = runtime.blocks.find((item) =>
      item.authority.kind === 'live-destination'
      && (
        item.authority.entityId === disruption.entityId
        || item.authority.entityId === disruption.canonicalDestinationNodeId
      )
    );
    if (!block) continue;

    runtime = applyJourneyRuntimeEvent(runtime, {
      type: 'provider-invalidated',
      blockId: block.id,
      reason: disruption.reason,
      evidenceRef: disruption.evidenceRef,
      at: disruption.detectedAt
    });
  }

  return runtime;
}
