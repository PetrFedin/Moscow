import { expect, test } from '@playwright/test';

test('Investor MVP opens directly into the Government Owner Route', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();

  await expect(page.getByText('CEO / GOVERNMENT OWNER ROUTE', { exact: true })).toBeVisible();
  await expect(page.getByText(/За 10–12 минут/)).toBeVisible();
  await expect(page.getByText('1 / 12', { exact: true })).toBeVisible();
  await expect(page.getByText(/Какую городскую проблему мы реально решаем/)).toBeVisible();
  await expect(page.getByText('МОСКВА ПОЛУЧАЕТ', { exact: true })).toBeVisible();
  await expect(page.getByText('ТУРИСТ ПОЛУЧАЕТ', { exact: true })).toBeVisible();
  await expect(page.getByText('ПАРТНЁР ПОЛУЧАЕТ', { exact: true })).toBeVisible();
});

test('Government Owner Route can advance and open its evidence layer', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();

  await page.getByRole('button', { name: 'Следующий шаг' }).click();
  await expect(page.getByText('2 / 12', { exact: true })).toBeVisible();
  await expect(page.getByText(/Почему турист будет пользоваться этим каждый день поездки/)).toBeVisible();

  await page.getByRole('button', { name: 'Открыть доказательный слой' }).click();
  await expect(page.getByText('ЧТО МЫ ПРОДАЁМ', { exact: true })).toBeVisible();
});

test('Government Owner Route keeps RU default and supports EN/ZH switching', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await expect(page.getByText(/За 10–12 минут/)).toBeVisible();

  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByText(/In 10–12 minutes/)).toBeVisible();

  await page.getByRole('button', { name: '中文' }).click();
  await expect(page.getByText(/10–12 分钟/)).toBeVisible();
});


test('Government Owner Route ends with a concrete first procurement decision', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();

  await expect(page.getByText('FIRST PROCUREMENT DECISION', { exact: true })).toBeVisible();
  await expect(page.getByText('Первый контракт: доказательный пилот Варварка — Зарядье', { exact: true })).toBeVisible();
  await expect(page.getByText('ЧТО НУЖНО РЕШИТЬ СЕЙЧАС', { exact: true })).toBeVisible();
  await expect(page.getByText('ЧТО ПОКУПАЕТСЯ', { exact: true })).toBeVisible();
  await expect(page.getByText('ЧТО НУЖНО ОТ МОСКВЫ', { exact: true })).toBeVisible();
  await expect(page.getByText('ЧТО ПОЛУЧАЕТ МОСКВА', { exact: true })).toBeVisible();
  await expect(page.getByText('КАК ПРИНИМАЕТСЯ', { exact: true })).toBeVisible();
  await expect(page.getByText(/PRE-PILOT · BLOCKED/)).toBeVisible();
  await page.getByRole('button', { name: 'Открыть Contract Builder' }).click();
  await expect(page.getByText('Конструктор предмета пилотного договора', { exact: true })).toBeVisible();
});


for (const viewport of [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'desktop', width: 1440, height: 1000 }
]) {
  test(`Government Owner Route remains usable on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();

    await expect(page.getByText('CEO / GOVERNMENT OWNER ROUTE', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Следующий шаг' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Открыть доказательный слой' })).toBeVisible();
    await expect(page.getByText('FIRST PROCUREMENT DECISION', { exact: true })).toBeVisible();
  });
}
