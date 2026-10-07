import { expect, test } from '@playwright/test';

test.describe('responsive application shell', () => {
  test('phone uses bottom navigation and no sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.getByTestId('bottom-navigation')).toBeVisible();
    await expect(page.getByTestId('responsive-sidebar')).toHaveCount(0);
    await expect(page.getByTestId('responsive-main')).toBeVisible();
  });

  test('tablet uses compact left navigation', async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 1194 });
    await page.goto('/');
    await expect(page.getByTestId('responsive-sidebar')).toBeVisible();
    await expect(page.getByTestId('bottom-navigation')).toHaveCount(0);
    const box = await page.getByTestId('responsive-sidebar').boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(170);
    expect(box!.width).toBeLessThanOrEqual(182);
  });

  test('desktop uses expanded sidebar and bounded main workspace', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/');
    await expect(page.getByTestId('responsive-sidebar')).toBeVisible();
    await expect(page.getByTestId('bottom-navigation')).toHaveCount(0);

    const sidebar = await page.getByTestId('responsive-sidebar').boundingBox();
    const main = await page.getByTestId('responsive-main').boundingBox();
    expect(sidebar).not.toBeNull();
    expect(main).not.toBeNull();
    expect(sidebar!.width).toBeGreaterThanOrEqual(220);
    expect(sidebar!.width).toBeLessThanOrEqual(232);
    expect(main!.width).toBeLessThan(1220);
  });
});


test('theme toggle switches palette and persists after reload', async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.goto('/');

  const frame = page.getByTestId('local-preview-frame');
  const toggle = page.getByTestId('theme-toggle');
  await expect(frame).toBeVisible();
  await expect(toggle).toBeVisible();

  const before = await frame.evaluate((node) => getComputedStyle(node).backgroundColor);
  await toggle.click();
  const after = await frame.evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(after).not.toBe(before);

  await page.reload();
  const persisted = await frame.evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(persisted).toBe(after);
});
