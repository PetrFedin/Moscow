import http from 'node:http';
import { createHash } from 'node:crypto';

import {
  buildTretyakovNewLiveAdapter,
  TRETYAKOV_NEW_SOURCE_URL
} from '../src/integrations/tretyakovLiveCityAdapter.ts';
import {
  buildTretyakovProgrammeAdapter,
  TRETYAKOV_PROGRAMME_SOURCE_URL
} from '../src/integrations/tretyakovProgrammeAdapter.ts';
import { projectLiveDestinationFeed } from '../src/travel/liveDestinationAuthority.ts';
import { runLiveCityRefreshRuntime } from '../src/travel/liveCityRefreshRuntime.ts';

const PORT = Number(process.env.PORT || 3002);
const REFRESH_INTERVAL_MS = Math.max(
  60_000,
  Number(process.env.LIVE_CITY_REFRESH_INTERVAL_MS || 20 * 60_000)
);
const venueUrl = process.env.TRETYAKOV_LIVE_URL?.trim() || TRETYAKOV_NEW_SOURCE_URL;
const programmeUrl = process.env.TRETYAKOV_PROGRAMME_URL?.trim() || TRETYAKOV_PROGRAMME_SOURCE_URL;

let currentSnapshot = null;
let refreshInFlight = null;
let lastRefreshError = null;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function json(res, status, body, cacheControl = 'no-store') {
  const payload = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(payload.length),
    'cache-control': cacheControl,
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'content-type'
  });
  res.end(payload);
}

async function fetchHtml(sourceUrl, userAgent) {
  const fetchedAt = new Date().toISOString();
  const response = await fetch(sourceUrl, {
    method: 'GET',
    headers: {
      'user-agent': userAgent,
      'accept': 'text/html,application/xhtml+xml'
    }
  });
  const rawHtml = await response.text();
  if (!response.ok) {
    throw new Error(`Live city publication HTTP ${response.status} for ${sourceUrl}`);
  }
  return {
    fetchedAt,
    rawHtml,
    payloadSha256: sha256(rawHtml)
  };
}

async function buildCurrentSnapshot() {
  const [venueFetch, programmeFetch] = await Promise.all([
    fetchHtml(venueUrl, 'MoscowCityJourneyOS/1.0 live-city-authority'),
    fetchHtml(programmeUrl, 'MoscowCityJourneyOS/1.0 live-programme-authority')
  ]);

  const venueAdapter = buildTretyakovNewLiveAdapter(venueUrl);
  const programmeAdapter = buildTretyakovProgrammeAdapter(programmeUrl);
  const refreshedAt = new Date().toISOString();

  const refresh = runLiveCityRefreshRuntime({
    refreshedAt,
    sources: [
      {
        adapter: venueAdapter,
        snapshot: {
          schemaVersion: 1,
          providerId: venueAdapter.provider.id,
          snapshotId: `tretyakov:new:${venueFetch.fetchedAt}`,
          sourceUrl: venueUrl,
          fetchedAt: venueFetch.fetchedAt,
          payloadSha256: venueFetch.payloadSha256,
          payload: venueFetch.rawHtml
        }
      },
      {
        adapter: programmeAdapter,
        snapshot: {
          schemaVersion: 1,
          providerId: programmeAdapter.provider.id,
          snapshotId: `tretyakov:programme:${programmeFetch.fetchedAt}`,
          sourceUrl: programmeUrl,
          fetchedAt: programmeFetch.fetchedAt,
          payloadSha256: programmeFetch.payloadSha256,
          payload: programmeFetch.rawHtml
        }
      }
    ]
  });

  return {
    schemaVersion: 1,
    kind: 'live-city-current-snapshot',
    destinationId: refresh.destinationId,
    refreshedAt: refresh.refreshedAt,
    sourceSnapshots: refresh.ingestionRecords.map((record) => ({
      providerId: record.providerId,
      snapshotId: record.snapshotId,
      fetchedAt: record.fetchedAt,
      payloadSha256: record.payloadSha256,
      snapshotFreshness: record.snapshotFreshness
    })),
    mergedFeed: refresh.mergedFeed,
    disruptions: refresh.disruptions
  };
}

async function refreshCurrentSnapshot() {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = buildCurrentSnapshot()
    .then((snapshot) => {
      currentSnapshot = snapshot;
      lastRefreshError = null;
      console.log(JSON.stringify({
        event: 'live-city-snapshot-refreshed',
        refreshedAt: snapshot.refreshedAt,
        providers: snapshot.sourceSnapshots.map((item) => ({
          providerId: item.providerId,
          payloadSha256: item.payloadSha256
        })),
        disruptionCount: snapshot.disruptions.length
      }));
      return snapshot;
    })
    .catch((error) => {
      lastRefreshError = error instanceof Error ? error.message : String(error);
      console.error(JSON.stringify({
        event: 'live-city-snapshot-refresh-failed',
        error: lastRefreshError
      }));
      throw error;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

function readiness(nowIso) {
  if (!currentSnapshot) {
    return {
      ready: false,
      reason: 'no-current-snapshot'
    };
  }

  const projection = projectLiveDestinationFeed(currentSnapshot.mergedFeed, nowIso);
  const freshEntities = projection.entities.filter((entity) => entity.freshness === 'fresh');
  return {
    ready: freshEntities.length > 0,
    reason: freshEntities.length > 0 ? 'fresh-current-truth' : 'current-truth-expired',
    refreshedAt: currentSnapshot.refreshedAt,
    freshEntityCount: freshEntities.length,
    entityCount: projection.entities.length
  };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'content-type'
    });
    return res.end();
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    return json(res, 200, {
      ok: true,
      service: 'moscow-live-city-authority',
      time: new Date().toISOString(),
      refreshInFlight: Boolean(refreshInFlight),
      lastRefreshError
    });
  }

  if (req.method === 'GET' && url.pathname === '/ready') {
    const state = readiness(new Date().toISOString());
    return json(res, state.ready ? 200 : 503, {
      ...state,
      lastRefreshError
    });
  }

  if (req.method === 'GET' && url.pathname === '/live-city/current.json') {
    if (!currentSnapshot) {
      return json(res, 503, {
        ok: false,
        error: 'current-live-snapshot-unavailable'
      });
    }
    return json(res, 200, currentSnapshot, 'public, max-age=60, stale-while-revalidate=120');
  }

  return json(res, 404, { ok: false });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(JSON.stringify({
    event: 'moscow-live-city-authority-started',
    port: PORT,
    refreshIntervalMs: REFRESH_INTERVAL_MS,
    venueUrl,
    programmeUrl
  }));

  void refreshCurrentSnapshot().catch(() => undefined);
  setInterval(() => {
    void refreshCurrentSnapshot().catch(() => undefined);
  }, REFRESH_INTERVAL_MS);
});
