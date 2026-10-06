import { expect, test } from '@playwright/test';

test('partner operating layer exposes the full evidence chain', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Операции', { exact: true }).click();

  await expect(page.getByText('PARTNER & INVESTOR OPERATING LAYER', { exact: true })).toBeVisible();
  await expect(page.getByText('Partner onboarding', { exact: true })).toBeVisible();
  await expect(page.getByText('Traveler handoff', { exact: true })).toBeVisible();
  await expect(page.getByText('Provider confirmation', { exact: true })).toBeVisible();
  await expect(page.getByText('Attribution', { exact: true })).toBeVisible();
  await expect(page.getByText('Revenue ledger', { exact: true })).toBeVisible();
  await expect(page.getByText('Settlement evidence', { exact: true })).toBeVisible();
  await expect(page.getByText(/ещё не подтверждены/)).toBeVisible();
});

test('investor operating layer keeps unproven metrics unmeasured', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Операции', { exact: true }).click();
  await page.getByRole('button', { name: 'Операции инвестора' }).click();

  await expect(page.getByText('MRR', { exact: true })).toBeVisible();
  await expect(page.getByText('ARR', { exact: true })).toBeVisible();
  await expect(page.getByText('Partner retention', { exact: true })).toBeVisible();
  await expect(page.getByText('НЕ ИЗМЕРЕНО', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/только из фактических договоров и ledger/i)).toBeVisible();
});
