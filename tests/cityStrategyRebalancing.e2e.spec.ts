import { expect, test } from '@playwright/test';

test('City Strategy and Capital Rebalancing Board shows next-cycle governance', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Операции', { exact: true }).click();
  await page.getByRole('button', { name: 'Контроль спроса' }).click();
  await page.getByText('DEMO', { exact: true }).click();

  await expect(page.getByText('CITY STRATEGY & CAPITAL REBALANCING BOARD · DEMO', { exact: true })).toBeVisible();
  await expect(page.getByText('STRATEGIC PRIORITIES', { exact: true })).toBeVisible();
  await expect(page.getByText('DECOMMITMENT REVIEW', { exact: true })).toBeVisible();
  await expect(page.getByText('FUNDING SOURCES', { exact: true })).toBeVisible();
  await expect(page.getByText('NEXT-CYCLE CANDIDATES', { exact: true })).toBeVisible();
  await expect(page.getByText('RECOMMENDED NEXT-CYCLE ALLOCATIONS', { exact: true })).toBeVisible();
  await expect(page.getByText(/STRATEGY RECOMMENDATION ONLY/)).toBeVisible();
});

test('Strategy Board visibly separates available and blocked capital', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Операции', { exact: true }).click();
  await page.getByRole('button', { name: 'Контроль спроса' }).click();
  await page.getByText('DEMO', { exact: true }).click();

  await expect(page.getByText('AVAILABLE', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('BLOCKED', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/candidate-confidence-below-threshold/)).toBeVisible();
});
