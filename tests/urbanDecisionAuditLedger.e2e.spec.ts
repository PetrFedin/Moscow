import { expect, test } from '@playwright/test';

test('Urban Decision Audit Ledger exposes complete institutional memory', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Операции', { exact: true }).click();
  await page.getByRole('button', { name: 'Контроль спроса' }).click();
  await page.getByRole('button', { name: 'DEMO', exact: true }).click();

  await expect(page.getByText('URBAN EVIDENCE & DECISION AUDIT LEDGER · DEMO', { exact: true })).toBeVisible();
  await expect(page.getByText('LEDGER INTEGRITY', { exact: true })).toBeVisible();
  await expect(page.getByText('DECISION REPLAY', { exact: true })).toBeVisible();
  await expect(page.getByText('DECISION TIMELINE', { exact: true })).toBeVisible();
  await expect(page.getByText('AUDIT COMPLETENESS', { exact: true })).toBeVisible();
  await expect(page.getByText(/APPEND-ONLY/)).toBeVisible();
});
