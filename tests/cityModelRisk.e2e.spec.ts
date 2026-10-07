import { expect, test } from '@playwright/test';

test('City Model Risk Board shows inventory drift challenger promotion and rollback', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Операции', { exact: true }).click();
  await page.getByRole('button', { name: 'Контроль спроса' }).click();
  await page.getByRole('button', { name: 'DEMO', exact: true }).click();

  await expect(page.getByText('CITY MODEL RISK & GOVERNANCE BOARD · DEMO', { exact: true })).toBeVisible();
  await expect(page.getByText('MODEL INVENTORY', { exact: true })).toBeVisible();
  await expect(page.getByText('POLICY LINEAGE', { exact: true })).toBeVisible();
  await expect(page.getByText('DRIFT & SEGMENT RISK', { exact: true })).toBeVisible();
  await expect(page.getByText('CHALLENGER VS INCUMBENT', { exact: true })).toBeVisible();
  await expect(page.getByText('PROMOTION GATE', { exact: true })).toBeVisible();
  await expect(page.getByText('ROLLBACK', { exact: true })).toBeVisible();
  await expect(page.getByText(/NO AUTO-PROMOTION/)).toBeVisible();
});
