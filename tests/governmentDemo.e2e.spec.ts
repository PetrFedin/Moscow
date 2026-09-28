import { expect, test } from '@playwright/test';

test('city pilot demo explains Moscow collaboration, proof gaps, funding routes and federal scale', async ({ page }) => {
  await page.goto('/');

  const open = page.getByRole('button', {
    name: 'Открыть сценарий городского пилота и сотрудничества'
  });
  await expect(open).toBeVisible();
  await open.click();

  await expect(page.getByText('MOSCOW · CITY PILOT')).toBeVisible();
  await expect(page.getByText('Москва во времени', { exact: true })).toBeVisible();
  await expect(page.getByText('Варварка во времени', { exact: true })).toBeVisible();
  await expect(page.getByText('20–50', { exact: true })).toBeVisible();

  await page.getByText('Доказательства', { exact: true }).click();
  await expect(page.getByText('Пилот ещё не доказан: остаются физические, пользовательские и partner-access gates.')).toBeVisible();
  await expect(page.getByText('Палаты Романовых · spatial proof', { exact: true })).toBeVisible();
  await expect(page.getByText('НУЖНО ПОЛЕ', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Live Destination Authority', { exact: true })).toBeVisible();
  await expect(page.getByText('НУЖЕН ПАРТНЁР', { exact: true })).toBeVisible();

  await page.getByText('Что нужно', { exact: true }).click();
  await expect(page.getByText('Не “дайте денег на приложение”', { exact: true })).toBeVisible();
  await expect(page.getByText(/Назначить профильного владельца задачи/)).toBeVisible();
  await expect(page.getByText(/формальный интеграционный контакт/)).toBeVisible();

  await page.getByText('Финансирование', { exact: true }).click();
  await expect(page.getByText('Москва · пилот инновационного решения', { exact: true })).toBeVisible();
  await expect(page.getByText('Инвестиционный контур', { exact: true })).toBeVisible();
  await expect(page.getByText('Федеральный контур', { exact: true })).toBeVisible();
  await expect(page.getByText(/конкретное финансирование не возникает автоматически/)).toBeVisible();

  await page.getByText('Масштаб', { exact: true }).click();
  await expect(page.getByText('Москва → регион → федеральный слой', { exact: true })).toBeVisible();
  await expect(page.getByText('1 · Варварка', { exact: true })).toBeVisible();
  await expect(page.getByText('4 · Первый внешний регион', { exact: true })).toBeVisible();
  await expect(page.getByText('5 · Межрегиональный / федеральный слой', { exact: true })).toBeVisible();
  await expect(page.getByText('Не “московское приложение для всей России”', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Закрыть сценарий для города' }).click();
  await expect(page.getByText('MOSCOW · CITY PILOT')).toHaveCount(0);
});
