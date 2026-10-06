import { expect, test } from '@playwright/test';

test('Marketplace Demand Engine keeps organic and sponsorship separate', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Операции', { exact: true }).click();

  await expect(page.getByText('MARKETPLACE & DEMAND ENGINE · DEMO', { exact: true })).toBeVisible();
  await expect(page.getByText('ОРГАНИЧЕСКИЙ РЕЙТИНГ', { exact: true })).toBeVisible();
  await expect(page.getByText('СПОНСОРСКИЙ СЛОЙ', { exact: true })).toBeVisible();
  await expect(page.getByText(/sponsorship ≠ organic boost/i)).toBeVisible();

  await expect(page.getByText('Zaryadye Dining · DEMO', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Moscow River Dinner · DEMO SPONSORED', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Old Availability Restaurant/)).toHaveCount(0);
  await expect(page.getByText('demo-stale-d', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('availability-stale', { exact: true }).first()).toBeVisible();
});

test('Marketplace Demand Engine is multilingual', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Операции', { exact: true }).click();

  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByText('Contextual demand without buying organic position', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '中文' }).click();
  await expect(page.getByText('基于情境的需求，而不是购买自然排序位置', { exact: true })).toBeVisible();
});
