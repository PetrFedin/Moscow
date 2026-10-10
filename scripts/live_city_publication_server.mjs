import http from 'node:http';
import {
  createHash,
  createPublicKey,
  verify as verifySignature
} from 'node:crypto';
import {
  readFile,
  rename,
  stat,
  writeFile
} from 'node:fs/promises';
import path from 'node:path';

import {
  buildTretyakovNewLiveAdapter,
  TRETYAKOV_NEW_SOURCE_URL
} from '../src/integrations/tretyakovLiveCityAdapter.ts';
import {
  buildTretyakovProgrammeAdapter,
  TRETYAKOV_PROGRAMME_SOURCE_URL
} from '../src/integrations/tretyakovProgrammeAdapter.ts';
import {
  buildValhallaRoutingFeed,
  buildValhallaWalkingRequest,
  normalizeValhallaWalkingRoute,
  VALHALLA_DEFAULT_BASE_URL
} from '../src/integrations/valhallaRoutingAdapter.ts';
import { projectLiveDestinationFeed } from '../src/travel/liveDestinationAuthority.ts';
import { runLiveCityRefreshRuntime } from '../src/travel/liveCityRefreshRuntime.ts';
import {
  assertGitHubActionsPublisherClaims,
  LIVE_CITY_PUBLISH_AUDIENCE,
  parsePublishedLiveCitySnapshot
} from '../src/travel/liveCityPublicationAuthority.ts';

const PORT = Number(process.env.PORT || 3000);
const REFRESH_INTERVAL_MS = Math.max(
  60_000,
  Number(process.env.LIVE_CITY_REFRESH_INTERVAL_MS || 20 * 60_000)
);
const PROVIDER_FETCH_TIMEOUT_MS = Math.max(
  5_000,
  Number(process.env.LIVE_CITY_PROVIDER_FETCH_TIMEOUT_MS || 20_000)
);
const ROUTING_PROVIDER_FETCH_TIMEOUT_MS = Math.max(
  5_000,
  Number(process.env.ROUTING_PROVIDER_FETCH_TIMEOUT_MS || 15_000)
);
const ROUTING_OBSERVATION_TTL_MS = Math.max(
  60_000,
  Number(process.env.ROUTING_OBSERVATION_TTL_MS || 15 * 60_000)
);
const REFRESH_MODE = process.env.LIVE_CITY_REFRESH_MODE?.trim() === 'push'
  ? 'push'
  : 'pull';
const venueUrl = process.env.TRETYAKOV_LIVE_URL?.trim() || TRETYAKOV_NEW_SOURCE_URL;
const programmeUrl = process.env.TRETYAKOV_PROGRAMME_URL?.trim() || TRETYAKOV_PROGRAMME_SOURCE_URL;
const valhallaBaseUrl = process.env.VALHALLA_URL?.trim() || VALHALLA_DEFAULT_BASE_URL;
const valhallaRouteUrl = valhallaBaseUrl.replace(/\/$/, '') + '/route';
const valhallaClientId = process.env.VALHALLA_CLIENT_ID?.trim() || 'moscow-city-journey-os';
if (!/^https:\/\//i.test(valhallaBaseUrl)) {
  throw new Error('VALHALLA_URL must use HTTPS');
}
const SERVE_WEB_DIST = process.env.SERVE_WEB_DIST === '1';
const WEB_DIST_DIR = path.resolve(process.env.WEB_DIST_DIR?.trim() || 'dist');
const SNAPSHOT_CACHE_PATH = path.resolve(
  process.env.LIVE_CITY_SNAPSHOT_CACHE_PATH?.trim() || '/tmp/moscow-live-city-current.json'
);
const GITHUB_OIDC_CONFIGURATION_URL =
  'https://token.actions.githubusercontent.com/.well-known/openid-configuration';

let currentSnapshot = null;
let refreshInFlight = null;
let lastRefreshError = null;
let lastPublisher = null;
let oidcKeyCache = {
  expiresAtMs: 0,
  jwksUri: '',
  keys: []
};

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
    'access-control-allow-methods': 'GET, PUT, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type'
  });
  res.end(payload);
}

function readBody(req, maxBytes = 5 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error('payload-too-large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}


function routingRequestError(message) {
  const error = new Error(message);
  error.code = 'ROUTING_REQUEST_INVALID';
  return error;
}

function routingText(url, key) {
  const value = url.searchParams.get(key)?.trim() || '';
  if (!value || value.length > 160) {
    throw routingRequestError(`Invalid routing query: ${key}`);
  }
  return value;
}

function routingNumber(url, key, min, max) {
  const raw = url.searchParams.get(key);
  const value = raw === null ? Number.NaN : Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw routingRequestError(`Invalid routing query: ${key}`);
  }
  return value;
}

function walkingRouteEndpoints(url) {
  const from = {
    id: routingText(url, 'fromId'),
    latitude: routingNumber(url, 'fromLat', -90, 90),
    longitude: routingNumber(url, 'fromLon', -180, 180)
  };
  const to = {
    id: routingText(url, 'toId'),
    latitude: routingNumber(url, 'toLat', -90, 90),
    longitude: routingNumber(url, 'toLon', -180, 180)
  };
  if (from.id === to.id) {
    throw routingRequestError('Routing endpoints must differ');
  }
  return { from, to };
}

async function currentWalkingRoutingSnapshot(url) {
  const { from, to } = walkingRouteEndpoints(url);
  const fetchedAt = new Date().toISOString();
  const startedAtMs = Date.now();
  const request = buildValhallaWalkingRequest(from, to);

  console.log(JSON.stringify({
    event: 'current-routing-provider-fetch-started',
    providerId: 'valhalla',
    fromId: from.id,
    toId: to.id,
    fetchedAt,
    timeoutMs: ROUTING_PROVIDER_FETCH_TIMEOUT_MS
  }));

  try {
    const response = await fetch(valhallaRouteUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-client-id': valhallaClientId
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(ROUTING_PROVIDER_FETCH_TIMEOUT_MS)
    });
    const rawText = await response.text();
    if (!response.ok) {
      throw new Error(`Valhalla HTTP ${response.status}: ${rawText.slice(0, 240)}`);
    }

    let raw;
    try {
      raw = JSON.parse(rawText);
    } catch {
      throw new Error('Valhalla response JSON is invalid');
    }

    const expiresAt = new Date(
      Date.parse(fetchedAt) + ROUTING_OBSERVATION_TTL_MS
    ).toISOString();
    const observation = normalizeValhallaWalkingRoute({
      raw,
      sourceUrl: valhallaRouteUrl,
      from,
      to,
      fetchedAt,
      expiresAt,
      observationId: `valhalla:${from.id}:${to.id}:walk:${fetchedAt}`
    });
    const generatedAt = new Date().toISOString();
    const feed = buildValhallaRoutingFeed({
      sourceUrl: valhallaBaseUrl,
      generatedAt,
      observations: [observation]
    });
    const rawResponseSha256 = sha256(rawText);

    console.log(JSON.stringify({
      event: 'current-routing-provider-fetch-succeeded',
      providerId: 'valhalla',
      fromId: from.id,
      toId: to.id,
      durationMinutes: observation.durationMinutes,
      distanceMeters: observation.distanceMeters,
      rawResponseSha256,
      durationMs: Date.now() - startedAtMs
    }));

    return {
      schemaVersion: 1,
      kind: 'citywide-routing-current-snapshot',
      destinationId: 'moscow',
      fetchedAt,
      rawResponseSha256,
      request: {
        mode: 'walk',
        from,
        to
      },
      feed
    };
  } catch (error) {
    console.error(JSON.stringify({
      event: 'current-routing-provider-fetch-failed',
      providerId: 'valhalla',
      fromId: from.id,
      toId: to.id,
      durationMs: Date.now() - startedAtMs,
      error: error instanceof Error ? error.message : String(error)
    }));
    throw error;
  }
}

const MIME_BY_EXT = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2']
]);

async function fileExists(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function serveStaticWeb(pathname, res) {
  if (!SERVE_WEB_DIST) return false;

  const decoded = decodeURIComponent(pathname);
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const candidate = path.resolve(WEB_DIST_DIR, relative);

  if (!candidate.startsWith(WEB_DIST_DIR + path.sep) && candidate !== path.join(WEB_DIST_DIR, 'index.html')) {
    return false;
  }

  let filePath = candidate;
  if (!(await fileExists(filePath))) {
    if (path.extname(relative)) return false;
    filePath = path.join(WEB_DIST_DIR, 'index.html');
    if (!(await fileExists(filePath))) return false;
  }

  const body = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'content-type': MIME_BY_EXT.get(ext) || 'application/octet-stream',
    'content-length': String(body.length),
    'cache-control': ext === '.html'
      ? 'no-cache'
      : 'public, max-age=31536000, immutable'
  });
  res.end(body);
  return true;
}

async function fetchJson(url, timeoutMs = 8_000) {
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) throw new Error(`OIDC metadata HTTP ${response.status}`);
  return response.json();
}

async function githubOidcKey(kid) {
  const nowMs = Date.now();
  if (nowMs >= oidcKeyCache.expiresAtMs || !oidcKeyCache.keys.length) {
    const configuration = await fetchJson(GITHUB_OIDC_CONFIGURATION_URL);
    if (!configuration || typeof configuration.jwks_uri !== 'string') {
      throw new Error('GitHub OIDC JWKS URI missing');
    }
    const jwks = await fetchJson(configuration.jwks_uri);
    if (!jwks || !Array.isArray(jwks.keys)) {
      throw new Error('GitHub OIDC JWKS invalid');
    }
    oidcKeyCache = {
      expiresAtMs: nowMs + 60 * 60_000,
      jwksUri: configuration.jwks_uri,
      keys: jwks.keys
    };
  }

  const key = oidcKeyCache.keys.find((item) => item && item.kid === kid);
  if (!key) {
    oidcKeyCache.expiresAtMs = 0;
    throw new Error(`GitHub OIDC signing key not found: ${kid}`);
  }
  return key;
}

function decodeJwtJson(segment, label) {
  try {
    return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
  } catch {
    throw new Error(`GitHub OIDC ${label} is invalid`);
  }
}

async function verifyGitHubActionsPublisherToken(token) {
  const segments = String(token || '').split('.');
  if (segments.length !== 3) throw new Error('GitHub OIDC token format invalid');

  const [encodedHeader, encodedPayload, encodedSignature] = segments;
  const header = decodeJwtJson(encodedHeader, 'header');
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    throw new Error('GitHub OIDC header invalid');
  }

  const jwk = await githubOidcKey(header.kid);
  const publicKey = createPublicKey({ key: jwk, format: 'jwk' });
  const verified = verifySignature(
    'RSA-SHA256',
    Buffer.from(`${encodedHeader}.${encodedPayload}`),
    publicKey,
    Buffer.from(encodedSignature, 'base64url')
  );
  if (!verified) throw new Error('GitHub OIDC signature invalid');

  const claims = decodeJwtJson(encodedPayload, 'payload');
  return assertGitHubActionsPublisherClaims(claims);
}

async function cacheCurrentSnapshot(snapshot) {
  const tempPath = `${SNAPSHOT_CACHE_PATH}.tmp`;
  await writeFile(tempPath, JSON.stringify(snapshot) + '\n', 'utf8');
  await rename(tempPath, SNAPSHOT_CACHE_PATH);
}

async function loadCachedSnapshot() {
  try {
    const raw = JSON.parse(await readFile(SNAPSHOT_CACHE_PATH, 'utf8'));
    currentSnapshot = parsePublishedLiveCitySnapshot(raw, new Date().toISOString(), 30 * 60_000);
    console.log(JSON.stringify({
      event: 'live-city-published-snapshot-cache-restored',
      refreshedAt: currentSnapshot.refreshedAt,
      cachePath: SNAPSHOT_CACHE_PATH
    }));
  } catch (error) {
    if (error && error.code === 'ENOENT') return;
    console.error(JSON.stringify({
      event: 'live-city-published-snapshot-cache-rejected',
      cachePath: SNAPSHOT_CACHE_PATH,
      error: error instanceof Error ? error.message : String(error)
    }));
  }
}

async function fetchHtml(sourceUrl, userAgent) {
  const fetchedAt = new Date().toISOString();
  const startedAtMs = Date.now();

  console.log(JSON.stringify({
    event: 'live-city-provider-fetch-started',
    sourceUrl,
    fetchedAt,
    timeoutMs: PROVIDER_FETCH_TIMEOUT_MS
  }));

  try {
    const response = await fetch(sourceUrl, {
      method: 'GET',
      headers: {
        'user-agent': userAgent,
        'accept': 'text/html,application/xhtml+xml'
      },
      signal: AbortSignal.timeout(PROVIDER_FETCH_TIMEOUT_MS)
    });

    const rawHtml = await response.text();
    if (!response.ok) {
      throw new Error(`Live city publication HTTP ${response.status} for ${sourceUrl}`);
    }

    const result = {
      fetchedAt,
      rawHtml,
      payloadSha256: sha256(rawHtml)
    };

    console.log(JSON.stringify({
      event: 'live-city-provider-fetch-succeeded',
      sourceUrl,
      fetchedAt,
      payloadSha256: result.payloadSha256,
      durationMs: Date.now() - startedAtMs
    }));

    return result;
  } catch (error) {
    console.error(JSON.stringify({
      event: 'live-city-provider-fetch-failed',
      sourceUrl,
      fetchedAt,
      durationMs: Date.now() - startedAtMs,
      error: error instanceof Error ? error.message : String(error)
    }));
    throw error;
  }
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
      sourceUrl: record.sourceUrl,
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
    .then(async (snapshot) => {
      currentSnapshot = snapshot;
      await cacheCurrentSnapshot(snapshot);
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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, PUT, OPTIONS',
      'access-control-allow-headers': 'authorization, content-type'
    });
    return res.end();
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    return json(res, 200, {
      ok: true,
      service: 'moscow-live-city-authority',
      time: new Date().toISOString(),
      refreshMode: REFRESH_MODE,
      refreshInFlight: Boolean(refreshInFlight),
      lastRefreshError,
      lastPublisher
    });
  }

  if (req.method === 'GET' && url.pathname === '/ready') {
    const state = readiness(new Date().toISOString());
    return json(res, state.ready ? 200 : 503, {
      ...state,
      refreshMode: REFRESH_MODE,
      lastRefreshError,
      lastPublisher
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


  if (req.method === 'GET' && url.pathname === '/routing/walk') {
    try {
      const snapshot = await currentWalkingRoutingSnapshot(url);
      return json(res, 200, snapshot, 'no-store');
    } catch (error) {
      const code = error && typeof error === 'object' ? error.code : undefined;
      if (code === 'ROUTING_REQUEST_INVALID') {
        return json(res, 400, {
          ok: false,
          error: error instanceof Error ? error.message : 'invalid-routing-request'
        });
      }
      const timeout = error instanceof Error
        && (error.name === 'TimeoutError' || /timed? ?out/i.test(error.message));
      return json(res, timeout ? 504 : 502, {
        ok: false,
        error: timeout
          ? 'routing-provider-timeout'
          : 'routing-provider-unavailable'
      });
    }
  }

  if (req.method === 'PUT' && url.pathname === '/live-city/publish') {
    if (REFRESH_MODE !== 'push') return json(res, 404, { ok: false });

    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : '';

    let claims;
    try {
      claims = await verifyGitHubActionsPublisherToken(token);
    } catch (error) {
      console.error(JSON.stringify({
        event: 'live-city-publish-auth-rejected',
        error: error instanceof Error ? error.message : String(error)
      }));
      return json(res, 401, { ok: false, error: 'publisher-unauthorized' });
    }

    let parsedBody;
    try {
      const rawBody = await readBody(req);
      parsedBody = JSON.parse(rawBody.toString('utf8'));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return json(res, message === 'payload-too-large' ? 413 : 400, {
        ok: false,
        error: message === 'payload-too-large' ? message : 'invalid-json'
      });
    }

    let snapshot;
    try {
      snapshot = parsePublishedLiveCitySnapshot(parsedBody, new Date().toISOString());
      if (
        currentSnapshot
        && Date.parse(snapshot.refreshedAt) <= Date.parse(currentSnapshot.refreshedAt)
      ) {
        return json(res, 409, {
          ok: false,
          error: 'snapshot-not-newer',
          currentRefreshedAt: currentSnapshot.refreshedAt
        });
      }
      await cacheCurrentSnapshot(snapshot);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(JSON.stringify({
        event: 'live-city-publish-payload-rejected',
        runId: claims.run_id,
        sha: claims.sha,
        error: message
      }));
      return json(res, 422, { ok: false, error: message });
    }

    currentSnapshot = snapshot;
    lastRefreshError = null;
    lastPublisher = {
      runId: claims.run_id,
      runAttempt: claims.run_attempt || null,
      sha: claims.sha,
      eventName: claims.event_name,
      publishedAt: new Date().toISOString()
    };

    console.log(JSON.stringify({
      event: 'live-city-snapshot-published',
      refreshedAt: snapshot.refreshedAt,
      runId: claims.run_id,
      sha: claims.sha,
      providerIds: snapshot.sourceSnapshots.map((item) => item.providerId),
      disruptionCount: snapshot.disruptions.length
    }));

    return json(res, 202, {
      ok: true,
      refreshedAt: snapshot.refreshedAt,
      publisherRunId: claims.run_id
    });
  }

  if (req.method === 'GET' && await serveStaticWeb(url.pathname, res)) {
    return;
  }

  return json(res, 404, { ok: false });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(JSON.stringify({
    event: 'moscow-live-city-authority-started',
    port: PORT,
    refreshMode: REFRESH_MODE,
    refreshIntervalMs: REFRESH_INTERVAL_MS,
    venueUrl,
    programmeUrl,
    providerFetchTimeoutMs: PROVIDER_FETCH_TIMEOUT_MS,
    routingProvider: {
      id: 'valhalla',
      baseUrl: valhallaBaseUrl,
      fetchTimeoutMs: ROUTING_PROVIDER_FETCH_TIMEOUT_MS,
      observationTtlMs: ROUTING_OBSERVATION_TTL_MS
    },
    publishAudience: LIVE_CITY_PUBLISH_AUDIENCE,
    serveWebDist: SERVE_WEB_DIST,
    webDistDir: SERVE_WEB_DIST ? WEB_DIST_DIR : null,
    snapshotCachePath: SNAPSHOT_CACHE_PATH
  }));

  void loadCachedSnapshot();
  if (REFRESH_MODE === 'pull') {
    void refreshCurrentSnapshot().catch(() => undefined);
    setInterval(() => {
      void refreshCurrentSnapshot().catch(() => undefined);
    }, REFRESH_INTERVAL_MS);
  }
});
