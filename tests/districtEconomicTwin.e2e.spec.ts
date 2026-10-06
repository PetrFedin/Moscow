import { expect, test } from '@playwright/test';

test('District Economic Twin exposes scenario lab and assumptions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Операции', { exact: true }).click();
  await page.getByRole('button', { name: 'Контроль спроса' }).click();
  await page.getByText('DEMO', { exact: true }).click();

  await expect(page.getByText('DISTRICT ECONOMIC DIGITAL TWIN · DEMO', { exact: true })).toBeVisible();
  await expect(page.getByText('DEMO ASSUMPTION', { exact: true })).toBeVisible();
  await expect(page.getByText('+3 restaurants', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('+2 museum hours', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Evening route', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('New ticket provider', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/не является доказанным исходом/i)).toBeVisible();
});
