import { expect, test } from '@playwright/test';

test('walk companion turns sightseeing into a persistent observation journey', async ({ page }) => {
  await page.goto('/');

  const enButton = page.getByText('EN', { exact: true });
  if (await enButton.count() && await enButton.first().isVisible().catch(() => false)) {
    await enButton.first().click();
  }

  await page.getByText('Прогулка', { exact: true }).click();
  await expect(page.getByLabel('Слушать остановку')).toBeVisible();
  await expect(page.getByText('МИССИЯ НАБЛЮДЕНИЯ', { exact: true })).toBeVisible();
  await page.getByLabel('Я нашёл').click();
  await expect(page.getByLabel('Наблюдение выполнено')).toBeVisible();

  await page.getByText('Моя Москва', { exact: true }).click();
  await expect(page.getByText('МОЯ ИСТОРИЯ МОСКВЫ', { exact: true })).toBeVisible();
  await expect(page.getByText('наблюдений', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByText('МОЯ ИСТОРИЯ МОСКВЫ', { exact: true })).toBeVisible();
  await expect(page.getByText('1', { exact: true }).first()).toBeVisible();
});
