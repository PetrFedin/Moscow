import { expect, test } from '@playwright/test';

async function ensureRussian(page: import('@playwright/test').Page) {
  const enButton = page.getByText('EN', { exact: true });
  if (await enButton.count() && await enButton.first().isVisible().catch(() => false)) {
    await enButton.first().click();
  }
}

test('citywide golden path closes Explore → Trip → Today → Wallet → Visit → My Moscow', async ({ page }) => {
  await page.goto('/');
  await ensureRussian(page);

  await page.getByText('Поездка', { exact: true }).last().click();
  await page.getByPlaceholder('2026-10-02').fill('2026-10-07');
  await page.getByText('3', { exact: true }).click();
  await page.getByText('Создать поездку', { exact: true }).click();

  await page.getByText('Москва', { exact: true }).last().click();
  await expect(page.getByText('EXPLORE MOSCOW · DEMO', { exact: true })).toBeVisible();

  await page.getByLabel('Добавить Ужин после культурного блока в поездку').click();

  await expect(page.getByText('ДОБАВИТЬ ИЗ EXPLORE', { exact: true })).toBeVisible();
  await expect(page.getByText('Ужин после культурного блока', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('ПОДХОДИТ', { exact: true }).first()).toBeVisible();

  await page.getByText('Бронь', { exact: true }).first().click();
  await page.getByText('Добавить в поездку', { exact: true }).click();

  await expect(page.getByText('Ужин после культурного блока', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Добавлено вами · не проверено провайдером', { exact: true }).first()).toBeVisible();

  await page.getByText('Сегодня', { exact: true }).last().click();
  await expect(page.getByText('СЕГОДНЯ В МОСКВЕ', { exact: true })).toBeVisible();
  await expect(page.getByText('Ужин после культурного блока', { exact: true }).first()).toBeVisible();

  await page.getByText('Wallet', { exact: true }).last().click();
  await expect(page.getByText('Мои билеты и брони', { exact: true })).toBeVisible();
  await expect(page.getByText('Ужин после культурного блока', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Добавлено вами · провайдер не проверен', { exact: true }).first()).toBeVisible();

  await page.getByText('Поездка', { exact: true }).last().click();
  await page.getByText('Я был здесь', { exact: true }).first().click();

  await page.getByText('Моя Москва', { exact: true }).last().click();
  await expect(page.getByText('ПОСЕЩЕНИЯ ИЗ TRIP OS', { exact: true })).toBeVisible();
  await expect(page.getByText('Moscow Passport', { exact: true })).toBeVisible();
  await expect(page.getByText('Ужин после культурного блока', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('Где ел', { exact: true }).first()).toBeVisible();
});

test('primary navigation exposes Today Explore Trip Wallet and My Moscow', async ({ page }) => {
  await page.goto('/');
  await ensureRussian(page);

  await expect(page.getByText('Сегодня', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('Москва', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('Поездка', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('Wallet', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('Моя Москва', { exact: true }).last()).toBeVisible();

  await expect(page.getByText('Карта', { exact: true }).last()).toHaveCount(0);
  await expect(page.getByText('История', { exact: true }).last()).toHaveCount(0);
});
