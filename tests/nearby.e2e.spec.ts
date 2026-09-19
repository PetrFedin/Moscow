import { expect, test } from '@playwright/test';

test.use({
  geolocation: { latitude: 55.75193, longitude: 37.62845 },
  permissions: ['geolocation']
});

async function ensureRussian(page: import('@playwright/test').Page) {
  const enButton = page.getByText('EN', { exact: true });
  if (await enButton.count()) {
    if (await enButton.first().isVisible().catch(() => false)) await enButton.first().click();
  }
  await expect(page.getByText('Открыть', { exact: true }).first()).toBeVisible();
}

test('nearby now builds a free walk from the tourist current position', async ({ page }) => {
  await page.goto('/');
  await ensureRussian(page);

  await expect(page.getByText('РЯДОМ СЕЙЧАС', { exact: true })).toBeVisible();
  await page.getByLabel('Показать что рядом').click();

  await expect(page.getByText('Палаты бояр Романовых', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/^(0|1) м · новое$/)).toBeVisible();

  await page.getByLabel('Начать свободную прогулку').click();
  await expect(page.getByText('Прогулка', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/свободная прогулка/)).toBeVisible();

  await page.getByLabel('Поставить прогулку на паузу').click();
  await expect(page.getByText('Открыть', { exact: true }).first()).toBeVisible();
});
