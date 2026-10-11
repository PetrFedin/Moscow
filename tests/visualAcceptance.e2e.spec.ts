import { expect, test } from '@playwright/test';

for (const viewport of [
  { name: 'phone-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 }
]) {
  test('visual proof / ' + viewport.name + ': discover, moment and trip', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Спланировать поездку' })).toBeVisible();
    await expect(page.getByText('Чем займёмся прямо сейчас?', { exact: true })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    expect(overflow, 'No horizontal body scroll').toBe(false);
    await page.screenshot({ path: testInfo.outputPath(viewport.name + '-discover.png'), fullPage: true });
    await page.getByRole('button', { name: 'Главное за полчаса' }).click();
    await expect(page.getByText(/редакционная оценка, не подтверждённая навигация/)).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(viewport.name + '-moment.png'), fullPage: true });
    await page.getByRole('button', { name: 'Спланировать поездку' }).click();
    await expect(page.getByText('Соберите Москву по дням', { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(viewport.name + '-trip.png'), fullPage: true });
  });
}
