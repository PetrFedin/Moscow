import {
  parseCurrentLiveCitySnapshot,
  type CurrentLiveCitySnapshot
} from './currentLiveCityClient.ts';

export const LIVE_CITY_PUBLISH_AUDIENCE = 'moscow-live-city-publish-v1' as const;
export const LIVE_CITY_PUBLISH_REPOSITORY = 'PetrFedin/Moscow' as const;
export const LIVE_CITY_PUBLISH_REPOSITORY_ID = '1371430954' as const;
export const LIVE_CITY_PUBLISH_REF = 'refs/heads/main' as const;
export const LIVE_CITY_PUBLISH_WORKFLOW_REF =
  'PetrFedin/Moscow/.github/workflows/current-live-city-refresh.yml@refs/heads/main' as const;

const REQUIRED_PROVIDER_IDS = [
  'tretyakov-official',
  'tretyakov-programme-official'
] as const;

export type GitHubActionsPublisherClaims = {
  iss: 'https://token.actions.githubusercontent.com';
  aud: string | string[];
  sub: string;
  repository: typeof LIVE_CITY_PUBLISH_REPOSITORY;
  repository_id: typeof LIVE_CITY_PUBLISH_REPOSITORY_ID;
  ref: typeof LIVE_CITY_PUBLISH_REF;
  sha: string;
  workflow_ref: typeof LIVE_CITY_PUBLISH_WORKFLOW_REF;
  event_name: 'push' | 'schedule' | 'workflow_dispatch';
  run_id: string;
  run_attempt?: string;
  iat: number;
  nbf?: number;
  exp: number;
};

export type PublishedLiveCitySourceSnapshot = {
  providerId: string;
  sourceUrl: string;
  fetchedAt: string;
  finalUrl?: string;
  contentType?: string;
  payloadSha256: string;
};

export type PublishedLiveCitySnapshot = CurrentLiveCitySnapshot & {
  sourceSnapshots: PublishedLiveCitySourceSnapshot[];
  disruptions: unknown[];
  ingestionRecords?: unknown[];
  projection?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function numericClaim(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function audienceContains(value: unknown, expected: string) {
  if (typeof value === 'string') return value === expected;
  return Array.isArray(value) && value.some((item) => item === expected);
}

export function validateGitHubActionsPublisherClaims(
  value: unknown,
  nowEpochSeconds = Math.floor(Date.now() / 1000)
) {
  const blockers: string[] = [];
  if (!isRecord(value)) {
    return { valid: false, blockers: ['oidc-claims-not-object'] };
  }

  if (value.iss !== 'https://token.actions.githubusercontent.com') {
    blockers.push('oidc-issuer-invalid');
  }
  if (!audienceContains(value.aud, LIVE_CITY_PUBLISH_AUDIENCE)) {
    blockers.push('oidc-audience-invalid');
  }
  if (value.sub !== `repo:${LIVE_CITY_PUBLISH_REPOSITORY}:ref:${LIVE_CITY_PUBLISH_REF}`) {
    blockers.push('oidc-subject-invalid');
  }
  if (value.repository !== LIVE_CITY_PUBLISH_REPOSITORY) {
    blockers.push('oidc-repository-invalid');
  }
  if (String(value.repository_id ?? '') !== LIVE_CITY_PUBLISH_REPOSITORY_ID) {
    blockers.push('oidc-repository-id-invalid');
  }
  if (value.ref !== LIVE_CITY_PUBLISH_REF) blockers.push('oidc-ref-invalid');
  if (!isText(value.sha) || !/^[0-9a-f]{40}$/i.test(value.sha)) {
    blockers.push('oidc-sha-invalid');
  }
  if (value.workflow_ref !== LIVE_CITY_PUBLISH_WORKFLOW_REF) {
    blockers.push('oidc-workflow-ref-invalid');
  }
  if (
    value.event_name !== 'push'
    && value.event_name !== 'schedule'
    && value.event_name !== 'workflow_dispatch'
  ) {
    blockers.push('oidc-event-invalid');
  }
  if (!isText(value.run_id)) blockers.push('oidc-run-id-missing');

  const issuedAt = numericClaim(value.iat);
  const notBefore = value.nbf === undefined ? null : numericClaim(value.nbf);
  const expiresAt = numericClaim(value.exp);

  if (issuedAt === null || issuedAt < nowEpochSeconds - 10 * 60 || issuedAt > nowEpochSeconds + 60) {
    blockers.push('oidc-issued-at-invalid');
  }
  if (value.nbf !== undefined && (notBefore === null || notBefore > nowEpochSeconds + 60)) {
    blockers.push('oidc-not-before-invalid');
  }
  if (
    expiresAt === null
    || expiresAt <= nowEpochSeconds
    || expiresAt > nowEpochSeconds + 10 * 60
  ) {
    blockers.push('oidc-expiry-invalid');
  }

  return {
    valid: blockers.length === 0,
    blockers: [...new Set(blockers)]
  };
}

export function assertGitHubActionsPublisherClaims(
  value: unknown,
  nowEpochSeconds = Math.floor(Date.now() / 1000)
): GitHubActionsPublisherClaims {
  const validation = validateGitHubActionsPublisherClaims(value, nowEpochSeconds);
  if (!validation.valid) {
    throw new Error(`Invalid GitHub Actions publisher claims: ${validation.blockers.join('; ')}`);
  }
  return value as GitHubActionsPublisherClaims;
}

export function parsePublishedLiveCitySnapshot(
  value: unknown,
  nowIso: string,
  maximumAgeMs = 10 * 60_000
): PublishedLiveCitySnapshot {
  if (!isRecord(value)) throw new Error('Published live city snapshot must be an object');
  const nowMs = Date.parse(nowIso);
  if (!Number.isFinite(nowMs)) throw new Error('Published live city validation requires a valid nowIso');

  const parsed = parseCurrentLiveCitySnapshot(value);
  const refreshedAtMs = Date.parse(parsed.refreshedAt);
  if (refreshedAtMs > nowMs + 60_000) {
    throw new Error('Published live city snapshot is from the future');
  }
  if (nowMs - refreshedAtMs > maximumAgeMs) {
    throw new Error('Published live city snapshot is too old');
  }

  if (!Array.isArray(value.sourceSnapshots) || value.sourceSnapshots.length === 0) {
    throw new Error('Published live city source snapshots are required');
  }

  const sourceSnapshots = value.sourceSnapshots.map((raw, index): PublishedLiveCitySourceSnapshot => {
    if (!isRecord(raw)) throw new Error(`Published source snapshot is invalid: ${index}`);
    if (!isText(raw.providerId)) throw new Error(`Published source providerId is missing: ${index}`);
    if (!isText(raw.sourceUrl) || !/^https:\/\//i.test(raw.sourceUrl)) {
      throw new Error(`Published source URL is invalid: ${index}`);
    }
    if (!isText(raw.fetchedAt) || !Number.isFinite(Date.parse(raw.fetchedAt))) {
      throw new Error(`Published source fetchedAt is invalid: ${index}`);
    }
    if (!isText(raw.payloadSha256) || !/^[0-9a-f]{64}$/i.test(raw.payloadSha256)) {
      throw new Error(`Published source SHA-256 is invalid: ${index}`);
    }

    return {
      providerId: raw.providerId,
      sourceUrl: raw.sourceUrl,
      fetchedAt: raw.fetchedAt,
      ...(isText(raw.finalUrl) ? { finalUrl: raw.finalUrl } : {}),
      ...(isText(raw.contentType) ? { contentType: raw.contentType } : {}),
      payloadSha256: raw.payloadSha256
    };
  });

  const sourceProviderIds = new Set(sourceSnapshots.map((item) => item.providerId));
  const feedProviderIds = new Set(parsed.mergedFeed.providers.map((item) => item.id));
  for (const providerId of REQUIRED_PROVIDER_IDS) {
    if (!sourceProviderIds.has(providerId)) {
      throw new Error(`Published source provider is missing: ${providerId}`);
    }
    if (!feedProviderIds.has(providerId)) {
      throw new Error(`Published feed provider is missing: ${providerId}`);
    }
  }

  if (!Array.isArray(value.disruptions)) {
    throw new Error('Published live city disruptions must be an array');
  }

  return {
    ...parsed,
    sourceSnapshots,
    disruptions: value.disruptions,
    ...(Array.isArray(value.ingestionRecords)
      ? { ingestionRecords: value.ingestionRecords }
      : {}),
    ...(value.projection !== undefined ? { projection: value.projection } : {})
  };
}
