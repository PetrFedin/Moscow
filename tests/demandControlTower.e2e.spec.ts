import { expect, test } from '@playwright/test';

test('Demand Control Tower fails closed in ACTUAL and shows DEMO opportunity separately', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Операции', { exact: true }).click();
  await page.getByRole('button', { name: 'Контроль спроса' }).click();

  await expect(page.getByText('DEMAND MARKETPLACE CONTROL TOWER', { exact: true })).toBeVisible();
  await expect(page.getByText(/Пока нет достаточного ACTUAL demand evidence/)).toBeVisible();

  await page.getByText('DEMO', { exact: true }).click();
  await expect(page.getByText('OPPORTUNITY', { exact: true })).toBeVisible();
  await expect(page.getByText(/partner-acquisition/).first().first()).toBeVisible();
  await expect(page.getByText(/does-not-authorize-investment-or-construction/).first()).toBeVisible();
});

test('Demand Control Tower exposes supply coverage and partner quality', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Операции', { exact: true }).click();
  await page.getByRole('button', { name: 'Контроль спроса' }).click();
  await page.getByText('DEMO', { exact: true }).click();

  await expect(page.getByText('Покрытие предложения', { exact: true }).first().first()).toBeVisible();
  await expect(page.getByText('Качество партнёров', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('demo-partner-zaryadye-dining', { exact: true })).toBeVisible();
  await expect(page.getByText(/Opportunity ≠ инвестиционное решение/)).toBeVisible();
});
