import { expect, test } from '@playwright/test';

test('walk companion turns sightseeing into a persistent observation journey', async ({ page }) => {
  await page.goto('/');

  const enButton = page.getByText('EN', { exact: true });
  if (await enButton.count() && await enButton.first().isVisible().catch(() => false)) {
    await enButton.first().click();
  }

  await page.getByText('Прогулка', { exact: true }).click();
  await expect(page.getByLabel('Слушать остановку')).toBeVisible();
  await expect(page.getByText('TTS FALLBACK · ЗАПИСЬ ГОТОВИТСЯ', { exact: true })).toBeVisible();
  await page.getByLabel('Показать текст аудиогида').click();
  await expect(page.getByLabel('Скрыть текст аудиогида')).toBeVisible();
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


test('finishing the route opens a durable recap and repeat resets only active progress', async ({ page }) => {
  await page.goto('/');

  const enButton = page.getByText('EN', { exact: true });
  if (await enButton.count() && await enButton.first().isVisible().catch(() => false)) {
    await enButton.first().click();
  }

  await page.getByText('Прогулка', { exact: true }).click();
  for (let index = 0; index < 4; index += 1) {
    await page.getByText('Открыто · дальше', { exact: true }).click();
  }
  await page.getByText('Завершить прогулку', { exact: true }).click();

  await expect(page.getByText('Варварка пройдена', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Продолжить исследовать на карте')).toBeVisible();
  await expect(page.getByLabel('Открыть Мою Москву')).toBeVisible();
  await expect(page.getByLabel('Пройти маршрут ещё раз')).toBeVisible();

  await page.waitForTimeout(100);
  await page.reload();
  await expect(page.getByText('Варварка пройдена', { exact: true })).toBeVisible();

  await page.getByLabel('Пройти маршрут ещё раз').click();
  await expect(page.getByText('СЕЙЧАС · ОСТАНОВКА 1', { exact: true })).toBeVisible();

  await page.getByText('Моя Москва', { exact: true }).click();
  await expect(page.getByText('5', { exact: true }).first()).toBeVisible();
});
