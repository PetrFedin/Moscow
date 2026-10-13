import { expect, test } from '@playwright/test';

for (const viewport of [
  { name: 'phone-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 }
]) {
  test('visual proof / ' + viewport.name + ': discover, moment and trip', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    // Stable Moscow local time makes all three device screenshots comparable.
    await page.clock.install({ time: new Date('2026-10-13T08:00:00.000Z') });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Спланировать поездку' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Открыть сценарий городского пилота и сотрудничества' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Открыть демонстрационный сценарий Палат Романовых' })).toHaveCount(0);
    const nav = await page.getByRole('tab', { name: 'Поездка' }).boundingBox();
    expect(nav).not.toBeNull();
    if (nav && viewport.width === 1440) {
      expect(nav.x + nav.width / 2).toBeGreaterThan(370);
    }
    await expect(page.getByText('Чем займёмся прямо сейчас?', { exact: true })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    expect(overflow, 'No horizontal body scroll').toBe(false);
    await page.screenshot({ path: testInfo.outputPath(viewport.name + '-discover.png'), fullPage: true });
    await page.getByRole('button', { name: 'Третьяковская галерея' }).click();
    await expect(page.getByRole('button', { name: 'Найти адрес на карте' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(viewport.name + '-directory.png'), fullPage: true });
    await page.getByRole('button', { name: 'Главное за полчаса' }).click();
    await expect(page.getByText(/редакционная оценка, не подтверждённая навигация/)).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(viewport.name + '-moment.png'), fullPage: true });
    await page.getByRole('button', { name: 'Спланировать поездку' }).click();
    await expect(page.getByText('Соберите Москву по дням', { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(viewport.name + '-trip.png'), fullPage: true });
    const todayInMoscow = await page.evaluate(() => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit'
      }).formatToParts(new Date());
      const field = (key: string) => parts.find(part => part.type === key)?.value ?? '';
      return field('year') + '-' + field('month') + '-' + field('day');
    });
    await page.getByPlaceholder('2026-10-02').fill(todayInMoscow);
    await page.getByText('1', { exact: true }).click();
    await page.getByText('Создать поездку', { exact: true }).click();
    await expect(page.getByText('СЕГОДНЯ В МОСКВЕ', { exact: true })).toBeVisible();
    await expect(page.getByText('Пока нет планов на сегодня', { exact: true })).toBeVisible();
    await expect(page.getByText('План на сегодня выполнен', { exact: true })).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath(viewport.name + '-today.png'), fullPage: true });
    // UI-only fixture: venue is not open-now proof, ticket is explicitly user declared.
    await page.evaluate(() => {
      const key = 'moscow:v1:personal-trip';
      const trip = JSON.parse(window.localStorage.getItem(key) || '{}');
      const dayDate = trip.days[0];
      trip.items.push({
        id: 'visual-venue', dayDate, source: 'manual', kind: 'museum',
        catalogPlaceId: 'tretyakov-lavrushinsky',
        officialSourceUrl: 'https://www.tretyakovgallery.ru/for-visitors/museums/istoricheskoe-zdanie/',
        title: 'Третьяковская галерея', note: 'Лаврушинский пер., 10', status: 'planned'
      });
      trip.items.push({
        id: 'visual-ticket', dayDate, source: 'manual', kind: 'theatre',
        title: 'Большой театр · мой билет', status: 'planned',
        plannedStartAt: '2026-10-13T19:00:00+03:00',
        plannedEndAt: '2026-10-13T21:00:00+03:00',
        commitment: { kind: 'ticket', status: 'confirmed', verification: 'user-declared', reference: 'VISUAL-TEST-LOCAL' }
      });
      window.localStorage.setItem(key, JSON.stringify(trip));
    });
    await page.reload();
    await expect(page.getByText('СЛЕДУЮЩИЙ БИЛЕТ / БРОНЬ', { exact: true })).toBeVisible();
    await expect(page.getByText('ИДЕЯ ДЛЯ СЛЕДУЮЩЕЙ ОСТАНОВКИ', { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(viewport.name + '-today-with-ticket-and-next.png'), fullPage: true });
    await page.getByText('Новая', { exact: true }).click();
    await page.getByRole('button', { name: 'Архивировать текущую поездку и начать новую' }).click();
    await expect(page.getByText('Прошлые поездки', { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(viewport.name + '-trip-archive.png'), fullPage: true });
  });
}
