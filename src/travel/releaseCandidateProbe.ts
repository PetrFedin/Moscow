import {
  evaluateMoscowReleaseEvidence,
  type ReleaseAcceptance,
  type ReleaseEvidence,
  type ReleaseProbe
} from './releaseCandidateAcceptance.ts';

export type MoscowReleaseProbeOptions = Readonly<{
  url: string;
  expectedSha: string;
  expectedBranch: string;
  expectedServiceId: string;
  timeoutMs?: number;
  fetcher?: typeof fetch;
}>;

export type MoscowReleaseProbeReport = Readonly<{
  schemaVersion: 1;
  checkedAt: string;
  origin: string;
  targetSha: string;
  observedHttpStatuses: Readonly<{
    website: number;
    release: number;
    health: number;
    readiness: number;
  }>;
  acceptance: ReleaseAcceptance;
}>;

const MAX_JSON_BYTES = 32 * 1024;
const RELEASE_ENDPOINTS = {
  website: '/',
  release: '/release',
  health: '/health',
  readiness: '/ready'
} as const;

function expectedOrigin(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Release target URL is invalid');
  }
  // This tool is deliberately confined to Render preview/service hostnames;
  // it cannot be used to probe local, private or arbitrary remote networks.
  if (url.protocol !== 'https:'
    || !/^[a-z0-9-]+\.onrender\.com$/i.test(url.hostname)
    || url.port || url.username || url.password
    || (url.pathname !== '/' && url.pathname !== '')
    || url.search || url.hash) {
    throw new Error('Release target must be the HTTPS root of a Render service');
  }
  return url.origin;
}

function assertOptions(input: MoscowReleaseProbeOptions): number {
  if (!/^[0-9a-f]{40}$/i.test(input.expectedSha)) {
    throw new Error('Release check requires the exact 40-character commit SHA');
  }
  if (!input.expectedBranch || !/^[a-zA-Z0-9._/-]{1,180}$/.test(input.expectedBranch)) {
    throw new Error('Release check requires the exact Git branch');
  }
  if (!/^srv-[a-z0-9]+$/.test(input.expectedServiceId)) {
    throw new Error('Release check requires the exact Render service ID');
  }
  const timeout = input.timeoutMs ?? 10000;
  if (!Number.isSafeInteger(timeout) || timeout < 1000 || timeout > 30000) {
    throw new Error('Release check timeout must be between 1000 and 30000 milliseconds');
  }
  return timeout;
}

async function boundedJson(response: Response): Promise<unknown> {
  const mime = response.headers.get('content-type') ?? '';
  if (!/^application\/(?:[\w.-]+\+)?json(?:;|$)/i.test(mime)) return null;
  const statedLength = Number(response.headers.get('content-length') ?? '0');
  if (statedLength > MAX_JSON_BYTES) return null;
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  for (;;) {
    const current = await reader.read();
    if (current.done) break;
    bytes += current.value.byteLength;
    if (bytes > MAX_JSON_BYTES) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(current.value);
  }
  const data = new Uint8Array(bytes);
  let cursor = 0;
  for (const chunk of chunks) {
    data.set(chunk, cursor);
    cursor += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(data));
  } catch {
    return null;
  }
}

async function readEndpoint(
  origin: string,
  path: string,
  accept: string,
  timeoutMs: number,
  requester: typeof fetch
): Promise<ReleaseProbe> {
  try {
    const response = await requester(origin + path, {
      method: 'GET',
      redirect: 'manual',
      cache: 'no-store',
      credentials: 'omit',
      headers: { accept },
      signal: AbortSignal.timeout(timeoutMs)
    });
    const contentType = response.headers.get('content-type') ?? '';
    const body = path === '/' ? undefined : await boundedJson(response);
    return { status: response.status, contentType, body };
  } catch {
    // A timeout, rejected redirect, malformed response, or network error is
    // BLOCKED, never inferred as a 200 response.
    return { status: 0 };
  }
}

/** Four read-only GET probes. Never mutates application, supplier, or visitor data. */
export async function probeMoscowRelease(
  input: MoscowReleaseProbeOptions
): Promise<MoscowReleaseProbeReport> {
  const origin = expectedOrigin(input.url);
  const timeoutMs = assertOptions(input);
  const requester = input.fetcher ?? fetch;
  const [website, release, health, readiness] = await Promise.all([
    readEndpoint(origin, RELEASE_ENDPOINTS.website, 'text/html', timeoutMs, requester),
    readEndpoint(origin, RELEASE_ENDPOINTS.release, 'application/json', timeoutMs, requester),
    readEndpoint(origin, RELEASE_ENDPOINTS.health, 'application/json', timeoutMs, requester),
    readEndpoint(origin, RELEASE_ENDPOINTS.readiness, 'application/json', timeoutMs, requester)
  ]);
  const evidence: ReleaseEvidence = {
    expectedSha: input.expectedSha,
    expectedBranch: input.expectedBranch,
    expectedServiceId: input.expectedServiceId,
    website, release, health, readiness
  };
  return {
    schemaVersion: 1,
    checkedAt: new Date().toISOString(),
    origin,
    targetSha: input.expectedSha.toLowerCase(),
    observedHttpStatuses: {
      website: website.status,
      release: release.status,
      health: health.status,
      readiness: readiness.status
    },
    acceptance: evaluateMoscowReleaseEvidence(evidence)
  };
}
