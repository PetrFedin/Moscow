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


test('Meeting Mode keeps the presenter on the same executive step after evidence drill-down', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();

  await page.getByRole('button', { name: 'Начать встречу' }).click();
  await expect(page.getByRole('button', { name: 'Route' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Evidence' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dossier' })).toBeVisible();

  await page.getByRole('button', { name: 'ШАГ 7' }).click();
  await expect(page.getByText('7 / 12', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Открыть доказательный слой' }).click();
  await expect(page.getByRole('button', { name: 'Вернуться в презентацию' })).toBeVisible();

  await page.getByRole('button', { name: 'Вернуться в презентацию' }).click();
  await expect(page.getByText('7 / 12', { exact: true })).toBeVisible();
  await expect(page.getByText(/Digital Twin нужен не для/)).toBeVisible();
});

test('Meeting Mode Dossier compresses the decision into four executive layers', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByRole('button', { name: 'Начать встречу' }).click();

  await page.getByRole('button', { name: 'Dossier' }).click();
  await expect(page.getByText('PROJECT DOSSIER · EXECUTIVE VIEW', { exact: true })).toBeVisible();
  await expect(page.getByText('Варварка — Зарядье · решение за 30–60 секунд', { exact: true })).toBeVisible();
  await expect(page.getByText('1 · DECISION', { exact: true })).toBeVisible();
  await expect(page.getByText('2 · COMMERCIAL', { exact: true })).toBeVisible();
  await expect(page.getByText('3 · PROOF', { exact: true })).toBeVisible();
  await expect(page.getByText('4 · CONFIDENTIALITY', { exact: true })).toBeVisible();

  const dossier = page.getByTestId('project-dossier');
  const box = await dossier.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeLessThan(700);

  await expect(page.getByText(/Следующий шаг открывает реальный evidence path/)).not.toBeVisible();
  await page.getByRole('button', { name: 'Детали: 1 · DECISION' }).click();
  await expect(page.getByText(/Следующий шаг открывает реальный evidence path/)).toBeVisible();

  await expect(page.getByRole('button', { name: 'Печать / сохранить PDF' })).toBeVisible();
  await page.getByRole('button', { name: 'Открыть Contract Builder' }).click();
  await expect(page.getByText('Конструктор предмета пилотного договора', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Вернуться в презентацию' })).toBeVisible();
});


test('Meeting Mode exposes hidden presenter cues and objection handling without changing the audience route', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByRole('button', { name: 'Начать встречу' }).click();

  await expect(page.getByText('SPEAKER CUE', { exact: true })).not.toBeVisible();
  await page.getByRole('button', { name: 'Показать заметки ведущего' }).click();

  await expect(page.getByText('SPEAKER CUE', { exact: true })).toBeVisible();
  await expect(page.getByText('НЕУДОБНЫЙ ВОПРОС', { exact: true })).toBeVisible();
  await expect(page.getByText('КОРОТКИЙ ОТВЕТ', { exact: true })).toBeVisible();
  await expect(page.getByText('НЕ ОБЕЩАТЬ', { exact: true })).toBeVisible();
  await expect(page.getByText('CLOSE CUE', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Evidence jump: Executive Control' })).toBeVisible();
});


test('Meeting Mode shows the compressed five-part executive spine and feature freeze', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();

  await expect(page.getByText('FEATURE_FROZEN', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Начать встречу' }).click();

  await expect(page.getByText('1 · ТЕЗИС', { exact: true })).toBeVisible();
  await expect(page.getByText('2 · PROOF', { exact: true })).toBeVisible();
  await expect(page.getByText('3 · OBJECTION', { exact: true })).toBeVisible();
  await expect(page.getByText('4 · ANSWER', { exact: true })).toBeVisible();
  await expect(page.getByText('5 · NEXT', { exact: true })).toBeVisible();
  await expect(page.getByText(/МОСКВА ПОЛУЧАЕТ/)).not.toBeVisible();
});
