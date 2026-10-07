import { expect, test } from '@playwright/test';

test('pilot contract builder is Russian by default and switches to English and Chinese', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();

  await expect(page.getByText('Москва · туристический цифровой слой', { exact: true })).toBeVisible();
  await expect(page.getByText('Контракт', { exact: true })).toBeVisible();

  await page.getByText('Контракт', { exact: true }).click();
  await expect(page.getByText('Конструктор предмета пилотного договора', { exact: true })).toBeVisible();
  await expect(page.getByText('Scope', { exact: true })).toBeVisible();
  await expect(page.getByText('Порядок оплат', { exact: true })).toBeVisible();
  await expect(page.getByText(/не является подписанным договором/i)).toBeVisible();

  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByText('Moscow · digital visitor journey layer', { exact: true })).toBeVisible();
  await expect(page.getByText('Pilot contract structure builder', { exact: true })).toBeVisible();
  await expect(page.getByText('Payment milestones', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '中文' }).click();
  await expect(page.getByText('莫斯科 · 数字游客旅程层', { exact: true })).toBeVisible();
  await expect(page.getByText('试点合同结构构建器', { exact: true })).toBeVisible();
  await expect(page.getByText('付款里程碑', { exact: true })).toBeVisible();
});

test('contract milestones do not invent amounts', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Контракт', { exact: true }).click();
  await page.getByText('Порядок оплат', { exact: true }).click();

  await expect(page.getByText(/аванс не задаётся продуктом/i)).toBeVisible();
  await expect(page.getByText(/Размеры долей и суммы определяются только договором/i)).toBeVisible();
  await expect(page.getByText(/\b\d{1,3}%\b/)).toHaveCount(0);
});
