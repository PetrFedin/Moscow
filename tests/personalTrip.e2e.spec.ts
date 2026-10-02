import { expect, test } from '@playwright/test';

async function ensureRussian(page: import('@playwright/test').Page) {
  const enButton = page.getByText('EN', { exact: true });
  if (await enButton.count() && await enButton.first().isVisible().catch(() => false)) {
    await enButton.first().click();
  }
}

test('personal trip keeps user-declared ticket truth and visit history after reload', async ({ page }) => {
  await page.goto('/');
  await ensureRussian(page);

  await page.getByText('Поездка', { exact: true }).last().click();
  await expect(page.getByText('МОЯ ПОЕЗДКА', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Соберите Москву по дням', { exact: true })).toBeVisible();

  const arrival = page.getByPlaceholder('2026-10-02');
  await arrival.fill('2026-10-02');
  await page.getByText('3', { exact: true }).click();
  await page.getByText('Создать поездку', { exact: true }).click();

  await expect(page.getByText('День 1', { exact: true })).toBeVisible();
  await page.getByText('+ Добавить', { exact: true }).click();
  await page.getByPlaceholder('Например: Большой театр').fill('Большой театр · мой билет');
  await page.getByText('Театр', { exact: true }).click();
  await page.getByText('Билет', { exact: true }).click();
  await page.getByPlaceholder('Номер заказа / заметка (необязательно)').fill('заказ сохранён у меня');
  await page.getByText('Добавить в день', { exact: true }).click();

  await expect(page.getByText('Большой театр · мой билет', { exact: true })).toBeVisible();
  await expect(page.getByText('Добавлено вами · не проверено провайдером', { exact: true })).toBeVisible();
  await expect(page.getByText('Подтверждено провайдером', { exact: true })).toHaveCount(0);

  await page.getByText('Я был здесь', { exact: true }).click();
  await expect(page.getByText('МОЯ ИСТОРИЯ МОСКВЫ', { exact: true })).toBeVisible();
  await expect(page.getByText(/отмечено вами/)).toBeVisible();

  await page.reload();
  await ensureRussian(page);
  await expect(page.getByText('Большой театр · мой билет', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Добавлено вами · не проверено провайдером', { exact: true })).toBeVisible();
  await expect(page.getByText('МОЯ ИСТОРИЯ МОСКВЫ', { exact: true })).toBeVisible();
  await expect(page.getByText(/отмечено вами/)).toBeVisible();
});


test('scheduler surfaces a fixed-time conflict and preserves a ticket when moved to another day', async ({ page }) => {
  await page.goto('/');
  await ensureRussian(page);

  await page.getByText('Поездка', { exact: true }).last().click();
  await page.getByPlaceholder('2026-10-02').fill('2026-10-02');
  await page.getByText('2', { exact: true }).click();
  await page.getByText('Создать поездку', { exact: true }).click();

  await page.getByText('+ Добавить', { exact: true }).click();
  await page.getByPlaceholder('Например: Большой театр').fill('Музей · фиксированный билет');
  await page.getByText('Музей', { exact: true }).click();
  await page.getByPlaceholder('19:00').fill('10:00');
  await page.getByPlaceholder('21:00').fill('12:00');
  await page.getByText('Билет', { exact: true }).click();
  await page.getByText('Добавить в день', { exact: true }).click();

  await page.getByText('+ Добавить', { exact: true }).click();
  await page.getByPlaceholder('Например: Большой театр').fill('Театр · фиксированная бронь');
  await page.getByText('Театр', { exact: true }).click();
  await page.getByPlaceholder('19:00').fill('11:00');
  await page.getByPlaceholder('21:00').fill('13:00');
  await page.getByText('Бронь', { exact: true }).click();
  await page.getByText('Добавить в день', { exact: true }).click();

  await expect(page.getByText('КОНФЛИКТ ВРЕМЕНИ', { exact: true })).toBeVisible();
  await expect(page.getByText(/Музей · фиксированный билет ↔ Театр · фиксированная бронь/)).toBeVisible();

  await page.getByLabel('Перенести Театр · фиксированная бронь на следующий день').click();
  await expect(page.getByText('КОНФЛИКТ ВРЕМЕНИ', { exact: true })).toHaveCount(0);

  await page.getByText('День 2', { exact: true }).click();
  await expect(page.getByText('Театр · фиксированная бронь', { exact: true })).toBeVisible();
  await expect(page.getByText(/11:00–13:00/)).toBeVisible();
  await expect(page.getByText('Добавлено вами · не проверено провайдером', { exact: true })).toBeVisible();
});
