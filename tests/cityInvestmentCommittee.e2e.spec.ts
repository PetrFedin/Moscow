import { expect, test } from '@playwright/test';

test('City Investment Committee workspace shows end-to-end governance', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Операции', { exact: true }).click();
  await page.getByRole('button', { name: 'Контроль спроса' }).click();
  await page.getByText('DEMO', { exact: true }).click();

  await expect(page.getByText('CITY INVESTMENT COMMITTEE WORKSPACE · DEMO', { exact: true })).toBeVisible();
  await expect(page.getByText('BUSINESS CASE', { exact: true })).toBeVisible();
  await expect(page.getByText('SPONSOR / OWNER', { exact: true })).toBeVisible();
  await expect(page.getByText('PROCUREMENT PATH', { exact: true })).toBeVisible();
  await expect(page.getByText('EVIDENCE PACKAGE', { exact: true })).toBeVisible();
  await expect(page.getByText('APPROVAL STAGES', { exact: true })).toBeVisible();
  await expect(page.getByText('COMMITTED CAPITAL', { exact: true })).toBeVisible();
  await expect(page.getByText('BENEFITS REALIZATION', { exact: true })).toBeVisible();
  await expect(page.getByText(/не является реальным решением о финансировании или закупке/)).toBeVisible();
});
