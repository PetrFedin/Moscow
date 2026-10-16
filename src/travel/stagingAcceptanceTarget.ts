/**
 * Isolated manual staging checks must never silently target the live Moscow
 * preview. All dates, tickets and notes in these browser tests are synthetic
 * and must remain in a fresh Playwright browser profile (local storage).
 */
export type MoscowStagingTarget = Readonly<{
  url: string;
  expectedSha: string;
  expectedBranch: string;
  expectedServiceId: string;
}>;
export function parseMoscowStagingTarget(
  env: Readonly<Record<string, string | undefined>>
): MoscowStagingTarget {
  const raw = env.MOSCOW_STAGING_URL?.trim() ?? '';
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('MOSCOW_STAGING_URL must identify a dedicated Render preview');
  }
  if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.onrender\.com$/i.test(url.hostname)
    || url.username || url.password || url.port || url.search || url.hash
    || (url.pathname !== '/' && url.pathname !== '')) {
    throw new Error('MOSCOW_STAGING_URL must be an HTTPS Render service root');
  }
  if (url.hostname.toLowerCase() === 'moscow-mobile-preview.onrender.com') {
    throw new Error('The public Moscow preview is not the dedicated staging target');
  }
  const expectedSha = env.MOSCOW_STAGING_SHA?.trim().toLowerCase() ?? '';
  const expectedBranch = env.MOSCOW_STAGING_BRANCH?.trim() ?? '';
  const expectedServiceId = env.MOSCOW_STAGING_SERVICE_ID?.trim() ?? '';
  if (!/^[0-9a-f]{40}$/.test(expectedSha)) {
    throw new Error('MOSCOW_STAGING_SHA requires a full commit SHA');
  }
  if (!/^[a-zA-Z0-9._/-]{1,180}$/.test(expectedBranch)
    || expectedBranch === 'main' || expectedBranch === 'master') {
    throw new Error('MOSCOW_STAGING_BRANCH must be a non-production branch');
  }
  if (!/^srv-[a-z0-9]+$/.test(expectedServiceId)) {
    throw new Error('MOSCOW_STAGING_SERVICE_ID requires an exact Render service ID');
  }
  return {
    url: url.origin + '/',
    expectedSha,
    expectedBranch,
    expectedServiceId
  };
}
