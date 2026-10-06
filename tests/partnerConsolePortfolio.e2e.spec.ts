import { expect, test } from '@playwright/test';

test('Partner Console sandbox shows full lifecycle and demo boundary', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Операции', { exact: true }).click();

  await expect(page.getByText('PARTNER CONSOLE · SANDBOX', { exact: true })).toBeVisible();
  await expect(page.getByText(/DEMO SCENARIO/)).toBeVisible();

  await page.getByText('Инвентарь', { exact: true }).click();
  await expect(page.getByText('Lunch table · 13:30', { exact: true })).toBeVisible();

  await page.getByText('Транзакции', { exact: true }).click();
  await expect(page.getByText('DEMO-TX-001', { exact: true })).toBeVisible();

  await page.getByText('Выручка', { exact: true }).click();
  await expect(page.getByText(/demo-ledger-001/i)).toBeVisible();

  await page.getByText('Сверка', { exact: true }).click();
  await expect(page.getByText(/DEMO-RECON-001/)).toBeVisible();
});

test('Investor Portfolio keeps ACTUAL separate from DEMO', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Операции', { exact: true }).click();
  await page.getByRole('button', { name: 'Операции инвестора' }).click();

  await expect(page.getByText('INVESTOR PORTFOLIO VIEW', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Фактические данные' })).toBeVisible();
  await expect(page.getByText('НЕ ИЗМЕРЕНО', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Демо сценарий' }).click();
  await expect(page.getByText(/DEMO SCENARIO/)).toBeVisible();
  await expect(page.getByText('DEMO', { exact: true }).first()).toBeVisible();
});
