import {
  assertLiveDestinationFeed,
  projectLiveDestinationFeed,
  type LiveDestinationFeed
} from './liveDestinationAuthority.ts';

export const CURRENT_LIVE_CITY_SNAPSHOT_VERSION = 1 as const;

export type CurrentLiveCitySnapshot = {
  schemaVersion: typeof CURRENT_LIVE_CITY_SNAPSHOT_VERSION;
  kind: 'live-city-current-snapshot';
  destinationId: string;
  refreshedAt: string;
  mergedFeed: LiveDestinationFeed;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function parseCurrentLiveCitySnapshot(value: unknown): CurrentLiveCitySnapshot {
  if (!isRecord(value)) throw new Error('Current live city snapshot must be an object');
  if (value.schemaVersion !== CURRENT_LIVE_CITY_SNAPSHOT_VERSION) {
    throw new Error('Unsupported current live city snapshot version');
  }
  if (value.kind !== 'live-city-current-snapshot') {
    throw new Error('Invalid current live city snapshot kind');
  }
  if (typeof value.destinationId !== 'string' || !value.destinationId.trim()) {
    throw new Error('Current live city snapshot destinationId is required');
  }
  if (typeof value.refreshedAt !== 'string' || !Number.isFinite(Date.parse(value.refreshedAt))) {
    throw new Error('Current live city snapshot refreshedAt is invalid');
  }

  const mergedFeed = assertLiveDestinationFeed(value.mergedFeed);
  if (mergedFeed.destinationId !== value.destinationId) {
    throw new Error('Current live city snapshot destination mismatch');
  }

  return {
    schemaVersion: CURRENT_LIVE_CITY_SNAPSHOT_VERSION,
    kind: 'live-city-current-snapshot',
    destinationId: value.destinationId,
    refreshedAt: value.refreshedAt,
    mergedFeed
  };
}

export async function loadCurrentLiveCityProjection(input: {
  url: string;
  nowIso: string;
  fetchImpl?: typeof fetch;
}) {
  if (!/^https:\/\//i.test(input.url)) {
    throw new Error('Current live city snapshot URL must use HTTPS');
  }
  if (!Number.isFinite(Date.parse(input.nowIso))) {
    throw new Error('Current live city projection requires a valid nowIso');
  }

  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl(input.url, {
    method: 'GET',
    headers: { accept: 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`Current live city snapshot HTTP ${response.status}`);
  }

  const snapshot = parseCurrentLiveCitySnapshot(await response.json());
  return {
    snapshot,
    projection: projectLiveDestinationFeed(snapshot.mergedFeed, input.nowIso)
  };
}
