import { expect, test } from '@playwright/test';

test('City Opportunity Engine closes the loop from gap to post-onboarding measurement', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Операции', { exact: true }).click();
  await page.getByRole('button', { name: 'Контроль спроса' }).click();
  await page.getByText('DEMO', { exact: true }).click();

  await expect(page.getByText('CITY OPPORTUNITY ENGINE · DEMO', { exact: true })).toBeVisible();
  await expect(page.getByText('ACQUISITION BRIEF', { exact: true })).toBeVisible();
  await expect(page.getByText('PARTNER SHORTLIST', { exact: true })).toBeVisible();
  await expect(page.getByText('EXPECTED SUPPLY IMPACT', { exact: true })).toBeVisible();
  await expect(page.getByText('POST-ONBOARDING MEASUREMENT', { exact: true })).toBeVisible();

  await expect(page.getByText(/Paid promotion budget не влияет на shortlist rank/)).toBeVisible();
  await expect(page.getByText('GAP-CLOSED', { exact: true })).toBeVisible();
  await expect(page.getByText(/причинность/i)).toBeVisible();
});

test('City Opportunity shortlist visibly separates rank from paid budget', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Открыть investor MVP для Москвы' }).click();
  await page.getByText('Операции', { exact: true }).click();
  await page.getByRole('button', { name: 'Контроль спроса' }).click();
  await page.getByText('DEMO', { exact: true }).click();

  await expect(page.getByText('Moscow Table Group · DEMO', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Premium Dining Partner · DEMO', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('City Cafe Network · DEMO', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/paidBudget=1000000/)).toBeVisible();
  await expect(page.getByText(/rank #1/)).toBeVisible();
});
