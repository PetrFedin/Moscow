/**
 * Public, non-sensitive deployment identity for release reconciliation.
 *
 * Values come only from Render's own runtime metadata. This is a diagnostic
 * label, not cryptographic attestation that a user completed a trip, nor
 * evidence of supplier confirmation. The release operator must compare it
 * with Render's deploy record and the tested GitHub Actions head SHA.
 */
export type MoscowRuntimeReleaseIdentity = Readonly<{
  schemaVersion: 1;
  kind: 'moscow-runtime-release-identity';
  commitSha: string | null;
  branch: string | null;
  repository: string | null;
  serviceId: string | null;
  source: 'render-runtime-environment' | 'unavailable';
}>;

const safeField = (input: string | undefined, pattern: RegExp, max: number): string | null => {
  const value = input?.trim() ?? '';
  return value.length > 0 && value.length <= max && pattern.test(value)
    ? value
    : null;
};

export function moscowRuntimeReleaseIdentity(
  env: Readonly<Record<string, string | undefined>>
): MoscowRuntimeReleaseIdentity {
  const renderRuntime = env.RENDER === 'true';
  const commitSha = renderRuntime
    ? safeField(env.RENDER_GIT_COMMIT, /^[a-f0-9]{40}$/i, 40)?.toLowerCase() ?? null
    : null;
  const branch = renderRuntime
    ? safeField(env.RENDER_GIT_BRANCH, /^[a-z0-9A-Z._/-]+$/, 180)
    : null;
  const repository = renderRuntime
    ? safeField(env.RENDER_GIT_REPO_SLUG, /^[a-z0-9A-Z._-]+\/[a-z0-9A-Z._-]+$/, 180)
    : null;
  const serviceId = renderRuntime
    ? safeField(env.RENDER_SERVICE_ID, /^srv-[a-z0-9]+$/, 90)
    : null;

  // Report the commit only for this repository. A copied server running in a
  // different Render project must not impersonate the Moscow release.
  const trustedRepo = repository?.toLowerCase() === 'petrfedin/moscow';
  return {
    schemaVersion: 1,
    kind: 'moscow-runtime-release-identity',
    commitSha: trustedRepo ? commitSha : null,
    branch: trustedRepo ? branch : null,
    repository,
    serviceId,
    source: trustedRepo && commitSha ? 'render-runtime-environment' : 'unavailable'
  };
}
