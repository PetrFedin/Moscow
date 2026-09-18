import { expect, test } from '@playwright/test';

test('tourist can build a time-and-interest route and keep it after reload', async ({ page }) => {
  await page.goto('/');

  const enButton = page.getByText('EN', { exact: true });
  if (await enButton.count() && await enButton.first().isVisible().catch(() => false)) {
    await enButton.first().click();
  }

  await expect(page.getByText('ПРОГУЛКА ПОД МЕНЯ', { exact: true })).toBeVisible();
  await page.getByLabel('30 мин').click();
  await page.getByLabel('Торговая Москва').click();
  await page.getByLabel('Начать маршрут').click();

  await expect(page.getByText('Старый Английский двор', { exact: true })).toBeVisible();
  await expect(page.getByText(/21 min · 2 ост./)).toBeVisible();

  await page.reload();
  await expect(page.getByText('Старый Английский двор', { exact: true })).toBeVisible();
  await expect(page.getByText(/21 min · 2 ост./)).toBeVisible();
});
