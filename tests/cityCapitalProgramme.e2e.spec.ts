import { expect, test } from '@playwright/test';

test('City Capital Programme Control Tower shows portfolio-wide capital and benefits', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Операции', { exact: true }).click();
  await page.getByRole('button', { name: 'Контроль спроса' }).click();
  await page.getByText('DEMO', { exact: true }).click();

  await expect(page.getByText('CITY CAPITAL PROGRAMME CONTROL TOWER · DEMO', { exact: true })).toBeVisible();
  await expect(page.getByText('PROGRAMME ENVELOPE', { exact: true })).toBeVisible();
  await expect(page.getByText('COMMITTED', { exact: true })).toBeVisible();
  await expect(page.getByText('ACTUAL SPEND', { exact: true })).toBeVisible();
  await expect(page.getByText('BENEFITS REALIZATION', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('FORECAST ACCURACY', { exact: true })).toBeVisible();
  await expect(page.getByText('UNDERPERFORMING INTERVENTIONS', { exact: true })).toBeVisible();
  await expect(page.getByText('REALLOCATION OPPORTUNITIES', { exact: true })).toBeVisible();
  await expect(page.getByText(/NO AUTO-REALLOCATION/)).toBeVisible();
});
