import { expect, test } from '@playwright/test';

test('investor MVP explains product, deliverables, payment and acceptance', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();

  await expect(page.getByText('MOSCOW · INVESTOR MVP', { exact: true })).toBeVisible();
  await expect(page.getByText('Москва · туристический цифровой слой', { exact: true })).toBeVisible();
  await expect(page.getByText(/Москва покупает не “ещё одно приложение”/)).toBeVisible();

  await page.getByText('Город получает', { exact: true }).click();
  await expect(page.getByText('Публичный туристический клиент', { exact: true })).toBeVisible();
  await expect(page.getByText('City Journey Control Center', { exact: true })).toBeVisible();

  await page.getByText('За что платит', { exact: true }).click();
  await expect(page.getByText('1 · Доказательный пилот', { exact: true })).toBeVisible();
  await expect(page.getByText('2 · Платформа и эксплуатация', { exact: true })).toBeVisible();
  await expect(page.getByText('3 · Новый район / destination pack', { exact: true })).toBeVisible();
  await expect(page.getByText('4 · Интеграции и развитие', { exact: true })).toBeVisible();

  await page.getByText('Приёмка', { exact: true }).click();
  await expect(page.getByText('КРИТЕРИИ ПРИЁМКИ', { exact: true })).toBeVisible();
  await expect(page.getByText('СЛЕДУЮЩЕЕ РЕШЕНИЕ', { exact: true })).toBeVisible();
  await expect(page.getByText(/Согласовать профильного owner задачи/)).toBeVisible();
});
