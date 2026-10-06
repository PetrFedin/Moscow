import { expect, test } from '@playwright/test';

test('value and economics screen explains value for users partners and investors', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();

  await page.getByText('Ценность и экономика', { exact: true }).click();
  await expect(page.getByText('Кто что получает и откуда появляется экономика платформы', { exact: true })).toBeVisible();

  await expect(page.getByRole('button', { name: 'Турист / пользователь' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Москва / городской заказчик' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ресторан / театр / отель / событие' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Частный / стратегический инвестор' })).toBeVisible();

  await page.getByRole('button', { name: 'Частный / стратегический инвестор' }).click();
  await expect(page.getByText(/evidence-gated roadmap/i)).toBeVisible();
  await expect(page.getByText(/equity upside/i)).toBeVisible();

  await expect(page.getByText('Revenue engines', { exact: true })).toBeVisible();
  await expect(page.getByText('Городской доказательный пилот', { exact: true })).toBeVisible();
  await expect(page.getByText('Partner Console', { exact: true })).toBeVisible();
  await expect(page.getByText('Transaction attribution', { exact: true })).toBeVisible();
  await expect(page.getByText('Региональная лицензия', { exact: true })).toBeVisible();
});

test('future monetisation remains explicitly gated and multilingual', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Ценность и экономика', { exact: true }).click();

  await expect(page.getByText('MVP', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('ПОСЛЕ ПИЛОТА', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('МАСШТАБ', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByText('Who receives what and where platform economics can emerge', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '中文' }).click();
  await expect(page.getByText('各方获得什么，以及平台经济从哪里产生', { exact: true })).toBeVisible();
});
