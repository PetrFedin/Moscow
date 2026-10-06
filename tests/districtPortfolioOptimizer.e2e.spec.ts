import { expect, test } from '@playwright/test';

test('District Portfolio Optimizer compares interventions under budget', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Операции', { exact: true }).click();
  await page.getByRole('button', { name: 'Контроль спроса' }).click();
  await page.getByText('DEMO', { exact: true }).click();

  await expect(page.getByText('DISTRICT PORTFOLIO OPTIMIZER · DEMO', { exact: true })).toBeVisible();
  await expect(page.getByText(/300/).first()).toBeVisible();
  await expect(page.getByText('CAPITAL ALLOCATION SHORTLIST', { exact: true })).toBeVisible();
  await expect(page.getByText('EXPECTED PORTFOLIO IMPACT', { exact: true })).toBeVisible();
  await expect(page.getByText(/RECOMMENDATION ONLY/)).toBeVisible();
});
