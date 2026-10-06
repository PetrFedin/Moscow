import { expect, test } from '@playwright/test';

test('City Strategy Learning Loop shows forecast learning and policy governance', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Операции', { exact: true }).click();
  await page.getByRole('button', { name: 'Контроль спроса' }).click();
  await page.getByText('DEMO', { exact: true }).click();

  await expect(page.getByText('CITY STRATEGY LEARNING LOOP · DEMO', { exact: true })).toBeVisible();
  await expect(page.getByText('FORECAST HISTORY', { exact: true })).toBeVisible();
  await expect(page.getByText('LEARNING SEGMENTS', { exact: true })).toBeVisible();
  await expect(page.getByText('CALIBRATION PROPOSAL', { exact: true })).toBeVisible();
  await expect(page.getByText('POLICY VERSION', { exact: true })).toBeVisible();
  await expect(page.getByText('NEXT-CYCLE CONFIDENCE', { exact: true })).toBeVisible();
  await expect(page.getByText(/NO AUTO-LEARNING IN PRODUCTION/)).toBeVisible();
});
