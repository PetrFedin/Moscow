import { expect, test } from '@playwright/test';

test('My Moscow exposes aggregate-only pilot evidence without pretending web export', async ({ page }) => {
  await page.goto('/');

  const enButton = page.getByText('EN', { exact: true });
  if (await enButton.count() && await enButton.first().isVisible().catch(() => false)) {
    await enButton.first().click();
  }

  await page.getByText('Моя Москва', { exact: true }).click();
  await expect(page.getByLabel('Пилотные данные на этом устройстве')).toBeVisible();
  await expect(page.getByText('ПИЛОТ · ТОЛЬКО ЭТО УСТРОЙСТВО', { exact: true })).toBeVisible();
  await expect(page.getByText('Агрегированная сводка прохождения', { exact: true })).toBeVisible();

  await page.getByLabel('Обновить пилотную сводку').click();
  await expect(page.getByText('сеансов', { exact: true })).toBeVisible();
  await expect(page.getByText('стартов маршрута', { exact: true })).toBeVisible();
  await expect(page.getByText('завершений', { exact: true })).toBeVisible();
  await expect(page.getByText('Ручной экспорт агрегированной сводки доступен в мобильной iOS/Android сборке.', { exact: true })).toBeVisible();

  await expect(page.getByText(/sessionId|eventId|latitude|longitude|deviceId/i)).toHaveCount(0);
});
