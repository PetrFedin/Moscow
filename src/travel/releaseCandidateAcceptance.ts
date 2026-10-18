/**
 * A release is not accepted merely because a GitHub branch has green CI.
 * These predicates evaluate evidence from the running service, not claims
 * inferred from a pull request, a deploy button or a screenshot filename.
 */
export type ReleaseProbe = Readonly<{
  status: number;
  body?: unknown;
  contentType?: string;
}>;
export type ReleaseEvidence = Readonly<{
  expectedSha: string;
  expectedBranch?: string;
  expectedServiceId?: string;
  website: ReleaseProbe;
  release: ReleaseProbe;
  health: ReleaseProbe;
  readiness: ReleaseProbe;
}>;
export type ReleaseCheck = Readonly<{
  name: 'website' | 'release-sha' | 'health' | 'live-city-readiness';
  status: 'PASS' | 'BLOCKED';
  reason: string;
}>;
export type ReleaseAcceptance = Readonly<{
  releaseReady: boolean;
  testedSha: string;
  checks: readonly ReleaseCheck[];
}>;

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}
function validSha(value: string): boolean {
  return /^[a-f\d]{40}$/i.test(value);
}
function check(name: ReleaseCheck['name'], ok: boolean, reason: string): ReleaseCheck {
  return { name, status: ok ? 'PASS' : 'BLOCKED', reason };
}

export function evaluateMoscowReleaseEvidence(input: ReleaseEvidence): ReleaseAcceptance {
  if (!validSha(input.expectedSha)) {
    throw new Error('Expected commit SHA must be exactly 40 hexadecimal characters');
  }
  if (input.expectedBranch !== undefined
    && (!input.expectedBranch.trim() || input.expectedBranch.length > 180)) {
    throw new Error('Expected branch is invalid');
  }
  if (input.expectedServiceId !== undefined
    && !/^srv-[a-z0-9]+$/.test(input.expectedServiceId)) {
    throw new Error('Expected Render service ID is invalid');
  }

  const release = object(input.release.body);
  const health = object(input.health.body);
  const readiness = object(input.readiness.body);
  const observedSha = typeof release?.commitSha === 'string' ? release.commitSha : null;
  const websiteOk = input.website.status === 200
    && /^text\/html(?:;|$)/i.test(input.website.contentType?.trim() ?? '');
  const shaOk = input.release.status === 200
    && release?.schemaVersion === 1
    && release?.kind === 'moscow-runtime-release-identity'
    && release?.source === 'render-runtime-environment'
    && typeof release?.repository === 'string'
    && release.repository.toLowerCase() === 'petrfedin/moscow'
    && observedSha?.toLowerCase() === input.expectedSha.toLowerCase()
    && (input.expectedBranch === undefined || release.branch === input.expectedBranch)
    && (input.expectedServiceId === undefined || release.serviceId === input.expectedServiceId);
  const healthOk = input.health.status === 200
    && health?.ok === true
    && health?.service === 'moscow-live-city-authority';
  const readinessOk = input.readiness.status === 200
    && readiness?.ready === true
    && readiness?.reason === 'fresh-current-truth'
    && typeof readiness?.freshEntityCount === 'number'
    && Number.isSafeInteger(readiness.freshEntityCount)
    && readiness.freshEntityCount > 0;

  const checks: ReleaseCheck[] = [
    check('website', websiteOk, websiteOk ? 'Web entrypoint responds with HTML' : 'Website is not a verified HTML 200 response'),
    check('release-sha', Boolean(shaOk), shaOk ? 'Runtime Render SHA and required identity match' : 'Exact runtime SHA/repository/branch/service proof missing or mismatched'),
    check('health', healthOk, healthOk ? 'Authority server responds as healthy' : 'Authority server health is unproven'),
    check('live-city-readiness', readinessOk,
      readinessOk ? 'City truth contains currently fresh entities' : 'Fresh current city truth is unavailable or unproven')
  ];
  return {
    releaseReady: checks.every(item => item.status === 'PASS'),
    testedSha: input.expectedSha.toLowerCase(),
    checks
  };
}
