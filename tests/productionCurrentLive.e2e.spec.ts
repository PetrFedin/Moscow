import { expect, test } from '@playwright/test';

function moscowDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

async function ensureRussian(page: import('@playwright/test').Page) {
  const enButton = page.getByText('EN', { exact: true });
  if (await enButton.count() && await enButton.first().isVisible().catch(() => false)) {
    await enButton.first().click();
  }
}

test('production Day Composer consumes two-source current truth without replay labels', async ({
  page,
  request
}) => {
  const readyResponse = await request.get('/ready', { timeout: 30_000 });
  expect(readyResponse.status()).toBe(200);
  const ready = await readyResponse.json() as {
    ready?: boolean;
    refreshMode?: string;
    freshEntityCount?: number;
    entityCount?: number;
    lastPublisher?: {
      runId?: string;
      sha?: string;
      eventName?: string;
    };
  };
  expect(ready.ready).toBe(true);
  expect(ready.refreshMode).toBe('push');
  expect(ready.freshEntityCount).toBeGreaterThanOrEqual(2);
  expect(ready.entityCount).toBeGreaterThanOrEqual(2);
  expect(ready.lastPublisher?.runId).toBeTruthy();
  expect(ready.lastPublisher?.sha).toMatch(/^[0-9a-f]{40}$/);

  const currentResponse = await request.get('/live-city/current.json', {
    timeout: 30_000
  });
  expect(currentResponse.status()).toBe(200);
  const current = await currentResponse.json() as {
    schemaVersion?: number;
    kind?: string;
    destinationId?: string;
    refreshedAt?: string;
    sourceSnapshots?: Array<{
      providerId?: string;
      payloadSha256?: string;
    }>;
    mergedFeed?: {
      providers?: Array<{ id?: string }>;
      entities?: Array<{
        id?: string;
        providerId?: string;
        operationalStatus?: string;
      }>;
    };
    disruptions?: unknown[];
  };

  expect(current.schemaVersion).toBe(1);
  expect(current.kind).toBe('live-city-current-snapshot');
  expect(current.destinationId).toBe('moscow');
  expect(Date.parse(current.refreshedAt ?? '')).not.toBeNaN();

  const sourceProviderIds = new Set(
    (current.sourceSnapshots ?? []).map((item) => item.providerId)
  );
  expect(sourceProviderIds.has('tretyakov-official')).toBe(true);
  expect(sourceProviderIds.has('tretyakov-programme-official')).toBe(true);
  expect(current.sourceSnapshots?.every((item) =>
    /^[0-9a-f]{64}$/.test(item.payloadSha256 ?? '')
  )).toBe(true);

  const feedProviderIds = new Set(
    (current.mergedFeed?.providers ?? []).map((item) => item.id)
  );
  expect(feedProviderIds.has('tretyakov-official')).toBe(true);
  expect(feedProviderIds.has('tretyakov-programme-official')).toBe(true);

  const venue = current.mergedFeed?.entities?.find(
    (item) => item.id === 'new-tretyakov-live'
  );
  expect(venue?.providerId).toBe('tretyakov-official');
  expect(venue?.operationalStatus).toBe('open');
  expect(Array.isArray(current.disruptions)).toBe(true);

  const dayDate = moscowDate();
  await page.addInitScript(({ date }) => {
    window.localStorage.setItem('moscow:v1:personal-trip', JSON.stringify({
      schemaVersion: 1,
      id: 'personal-trip:production-current-live',
      destinationId: 'moscow',
      title: 'Production current live truth',
      startDate: date,
      endDate: date,
      days: [date],
      items: [{
        id: 'new-tretyakov-current',
        dayDate: date,
        title: 'Новая Третьяковка',
        kind: 'museum',
        source: 'provider',
        destinationNodeId: 'new-tretyakov',
        plannedStartAt: `${date}T17:00:00+03:00`,
        plannedEndAt: `${date}T19:00:00+03:00`,
        status: 'planned'
      }],
      visits: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }, { date: dayDate });

  await page.goto('/');
  await ensureRussian(page);
  await page.getByText('Поездка', { exact: true }).last().click();

  await expect(page.getByText('DAY COMPOSER · V2', { exact: true })).toBeVisible();
  await expect(page.getByText('Новая Третьяковка', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('LIVE · FRESH · OPEN', { exact: true })).toBeVisible({
    timeout: 30_000
  });
  await expect(page.getByText(/Государственная Третьяковская галерея · 2026-/)).toBeVisible();
  await expect(page.getByText(/EVIDENCE REPLAY/)).toHaveCount(0);
  await expect(page.getByText(/NOT CURRENT/)).toHaveCount(0);

  await page.screenshot({
    path: 'test-results/production-current-live.png',
    fullPage: true
  });
});
