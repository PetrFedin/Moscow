import { expect, test } from '@playwright/test';

test('executive control screen exposes procurement truth without fabricated economics', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();

  await expect(page.getByText('EXECUTIVE PROCUREMENT VIEW', { exact: true })).toBeVisible();
  await expect(page.getByText('Что Москва покупает и что должно быть доказано до масштаба', { exact: true })).toBeVisible();

  await expect(page.getByText('01 · ПИЛОТ', { exact: true })).toBeVisible();
  await expect(page.getByText('02 · DELIVERABLES', { exact: true })).toBeVisible();
  await expect(page.getByText('03 · ACCEPTANCE', { exact: true })).toBeVisible();
  await expect(page.getByText('04 · COST BASIS', { exact: true })).toBeVisible();
  await expect(page.getByText('05 · CITY KPI', { exact: true })).toBeVisible();
  await expect(page.getByText('06 · SCALE DECISION', { exact: true })).toBeVisible();

  await expect(page.getByText('НЕ ИЗМЕРЕНО', { exact: true })).toBeVisible();
  await expect(page.getByText('BLOCKED', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/TARGETS НЕ ПРИДУМЫВАЕМ/)).toBeVisible();
  await expect(page.getByText('ОДНО РЕШЕНИЕ ПОСЛЕ ДЕМО', { exact: true })).toBeVisible();
});


test('executive blocker opens the linked contract obligation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();

  await expect(page.getByText('BLOCKERS → ДОГОВОРНЫЕ ОБЯЗАТЕЛЬСТВА', { exact: true })).toBeVisible();

  const blocker = page.getByRole('button', { name: /Romanov: нет реального field proof/ });
  await expect(blocker).toBeVisible();
  await blocker.click();

  await expect(page.getByText('Конструктор предмета пилотного договора', { exact: true })).toBeVisible();
  await expect(page.getByText('BLOCKER → CONTRACT', { exact: true })).toBeVisible();
  await expect(page.getByText('ROMANOV-FIELD-EVIDENCE', { exact: true })).toBeVisible();
  await expect(page.getByText('ACC-PHYSICAL-01', { exact: true })).toBeVisible();
  await expect(page.getByText(/Milestone · принят pilot evidence pack/)).toBeVisible();
});
