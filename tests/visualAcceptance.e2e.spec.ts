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
    // Dedicated view captures actual visible editorial day timeline, not an
    // invisible off-screen component inside a very tall fullPage screenshot.
    const dayOverview = page.getByTestId('travel-day-overview');
    await expect(dayOverview.getByText('Маршрут дня', { exact: true })).toBeVisible();
    const plannedMuseum = dayOverview.getByTestId('trip-stop-visual-venue');
    await expect(plannedMuseum.getByText('Третьяковская галерея', { exact: true })).toBeVisible();
    await plannedMuseum.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(viewport.name + '-editorial-day-viewport.png') });
    const dayOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    expect(dayOverflow, 'Editorial day has no body horizontal overflow').toBe(false);
    const wallet = page.getByTestId('travel-booking-wallet');
    await expect(wallet.getByText('Мои билеты и брони', { exact: true })).toBeVisible();
    await wallet.getByText('Большой театр · мой билет', { exact: true }).scrollIntoViewIfNeeded();
    await expect(wallet.getByText('Добавлено вами · поставщик не проверен', { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(viewport.name + '-booking-wallet-viewport.png') });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2),
      'Booking wallet has no horizontal body overflow').toBe(false);
    await wallet.getByRole('button', {
      name: 'Разобраться с билетом или бронью: Большой театр · мой билет'
    }).click();
    const bookingHelp = page.getByTestId('booking-resolution-card');
    await expect(bookingHelp.getByTestId('booking-resolution-selected-visual-ticket')).toBeVisible();
    await bookingHelp.getByText('О чём хотите спросить?', { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(viewport.name + '-booking-inquiry-viewport.png') });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2),
      'Booking assistance has no horizontal body overflow').toBe(false);
    await bookingHelp.getByRole('button', { name: 'Свернуть помощь с билетами' }).click();
    await page.getByText('Новая', { exact: true }).click();
    await page.getByRole('button', { name: 'Архивировать текущую поездку и начать новую' }).click();
    await expect(page.getByText('Прошлые поездки', { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(viewport.name + '-trip-archive.png'), fullPage: true });

    // Passport v2 visual proof uses two local user-declared visits, never a live provider claim.
    await page.evaluate(() => {
      const current = {
        schemaVersion: 1, id: 'visual-passport-current', destinationId: 'moscow',
        title: 'Москва осенью', startDate: '2026-10-13', endDate: '2026-10-13',
        days: ['2026-10-13'],
        items: [{
          id: 'dinner-plan', dayDate: '2026-10-13', source: 'manual',
          title: 'Ужин на Пятницкой', kind: 'food', status: 'completed'
        }],
        visits: [{
          id: 'visual-dinner', itemId: 'dinner-plan', dayDate: '2026-10-13',
          visitedAt: '2026-10-13T19:00:00+03:00',
          title: 'Ужин на Пятницкой', kind: 'food',
          evidence: 'user-confirmed', note: 'Интересное меню, приятная атмосфера'
        }],
        createdAt: '2026-10-13T08:00:00.000Z',
        updatedAt: '2026-10-13T19:15:00.000Z'
      };
      const past = {
        schemaVersion: 1, id: 'visual-passport-past', destinationId: 'moscow',
        title: 'Прогулка по старой Москве', startDate: '2026-06-05', endDate: '2026-06-05',
        days: ['2026-06-05'], items: [],
        visits: [{
          id: 'visual-romanov', dayDate: '2026-06-05',
          visitedAt: '2026-06-05T13:00:00+03:00',
          title: 'Палаты бояр Романовых', kind: 'heritage', destinationNodeId: 'romanov-chambers',
          evidence: 'user-confirmed', note: 'Исторические интерьеры'
        }],
        createdAt: '2026-06-05T08:00:00.000Z',
        updatedAt: '2026-06-05T13:10:00.000Z'
      };
      window.localStorage.setItem('moscow:v1:personal-trip', JSON.stringify(current));
      window.localStorage.setItem('moscow:v1:personal-trip-archive', JSON.stringify({
        schemaVersion: 1, trips: [past]
      }));
    });
    await page.reload();
    await expect(page.getByText('История всех поездок', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Показать историю посещений по всем поездкам' }).click();
    const passport = page.getByTestId('moscow-passport-v2-card');
    // Viewport snapshots after scrolling the actual app container: a tall
    // component screenshot can include blank pixels below the clipped scroll area.
    await passport.getByText('Найдено посещений: 2', { exact: true }).scrollIntoViewIfNeeded();
    await expect(passport.getByText('Найдено посещений: 2', { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(viewport.name + '-passport-v2-filters-viewport.png') });
    await passport.getByText('Исторические интерьеры', { exact: true }).scrollIntoViewIfNeeded();
    await expect(passport.getByText('Исторические интерьеры', { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(viewport.name + '-passport-v2-entries-viewport.png') });

    await page.getByRole('button', { name: 'Фильтр категории: Где ел' }).click();
    await passport.getByText('Найдено посещений: 1', { exact: true }).scrollIntoViewIfNeeded();
    await expect(passport.getByText('Найдено посещений: 1', { exact: true })).toBeVisible();
    await expect(passport.getByText('Ужин на Пятницкой', { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(viewport.name + '-passport-v2-filtered-viewport.png') });

    const ideas = page.getByTestId('moscow-next-discoveries');
    await expect(ideas.getByText('Что добавить в поездку?', { exact: true })).toBeVisible();
    await ideas.getByText('Что добавить в поездку?', { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(viewport.name + '-discovery-header-viewport.png') });

    await ideas.getByRole('button', { name: 'Идеи: Рестораны' }).click();
    const restaurantAdd = ideas.getByRole('button', {
      name: 'Добавить место в выбранный день: Кафе Пушкинъ'
    });
    await expect(restaurantAdd).toBeVisible();
    await restaurantAdd.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(viewport.name + '-discovery-action-viewport.png') });
    const overflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    expect(overflowing, 'No horizontal body overflow after discovery').toBe(false);
  });
}
