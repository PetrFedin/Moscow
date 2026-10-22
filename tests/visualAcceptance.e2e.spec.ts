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


for (const viewport of [
  { name: 'phone-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 }
]) {
  test('venue service intake visual proof / ' + viewport.name, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.clock.install({ time: new Date('2026-10-13T08:00:00Z') });
    await page.goto('/');
    await page.getByRole('button', { name: 'Рестораны', exact: true }).click();
    await page.getByRole('button', { name: 'Кафе Пушкинъ', exact: true }).click();
    await page.getByRole('button', { name: 'Добавить место в поездку' }).click();
    await expect(page.getByText('Соберите Москву по дням', { exact: true })).toBeVisible();
    await page.getByPlaceholder('2026-10-02').fill('2026-10-20');
    await page.getByText('2', { exact: true }).click();
    await page.getByText('Создать поездку', { exact: true }).click();
    const intake = page.getByTestId('venue-service-intake');
    await expect(intake).toBeVisible();
    await intake.getByRole('button', { name: 'Открыть запись времени или билета' }).click();
    await intake.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath(viewport.name + '-venue-service-plan.png')
    });

    await intake.getByRole('button', { name: 'Уже есть мой билет или бронь' }).click();
    await intake.getByTestId('venue-service-party-size').fill('2');
    await intake.getByTestId('venue-service-reference').fill('DEMO-ONLY');
    await intake.getByTestId('venue-service-reference').scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath(viewport.name + '-venue-service-own-booking.png')
    });
    await intake.getByRole('button', {
      name: 'Сохранить в мою поездку без подтверждения поставщика'
    }).click();
    await expect(intake).toHaveCount(0);
    const wallet = page.getByTestId('travel-booking-wallet');
    await expect(wallet.getByText('Добавлено вами · поставщик не проверен', { exact: true })).toBeVisible();
    await wallet.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath(viewport.name + '-venue-service-wallet.png')
    });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    expect(overflow, 'Venue intake/wallet must not overflow horizontally').toBe(false);
  });
}


for (const viewport of [
  { name: 'phone-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 }
]) {
  test('readiness local-conflict visual proof / ' + viewport.name, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.clock.install({ time: new Date('2026-10-13T08:00:00Z') });
    await page.goto('/');
    await page.getByRole('tab', { name: 'Поездка' }).click();
    await page.getByPlaceholder('2026-10-02').fill('2026-10-20');
    await page.getByText('2', { exact: true }).click();
    await page.getByText('Создать поездку', { exact: true }).click();
    for (const [name, start, end] of [
      ['Билет в музей · демонстрация', '19:00', '21:00'],
      ['Билет в театр · демонстрация', '20:00', '22:00']
    ] as const) {
      await page.getByText('+ Добавить', { exact: true }).click();
      await page.getByPlaceholder('Например: Большой театр').fill(name);
      await page.getByPlaceholder('19:00').fill(start);
      await page.getByPlaceholder('21:00').fill(end);
      await page.getByRole('button', { name: 'Билет', exact: true }).last().click();
      await page.getByText('Добавить в день', { exact: true }).click();
      await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
    }
    const readiness = page.getByTestId('trip-readiness');
    await expect(readiness.getByTestId('trip-readiness-conflicts')).toHaveText('1');
    await readiness.getByTestId('trip-readiness-conflicts').scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath(viewport.name + '-trip-readiness-summary-viewport.png')
    });
    await readiness.getByText(/Два записанных билета или брони пересекаются/).scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath(viewport.name + '-trip-readiness-conflict-viewport.png')
    });
    await readiness.getByRole('button', { name: /Открыть обращение по брони:/ }).first().click();
    const inlineHelp = page.getByTestId('booking-resolution-card');
    await expect(inlineHelp).toHaveCount(1);
    await inlineHelp.getByText('Если планы изменились', { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath(viewport.name + '-readiness-contextual-booking-assistance.png')
    });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    expect(overflow, 'Trip readiness card must not overflow viewport width').toBe(false);
  });
}


for (const viewport of [
  { name: 'phone-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 }
]) {
  test('trip navigation and final itinerary content never overlap / ' + viewport.name,
    async ({ page }, testInfo) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.clock.install({ time: new Date('2026-10-13T08:00:00.000Z') });
      await page.goto('/');
      const nav = page.getByTestId('tourist-bottom-navigation');
      await expect(nav.getByRole('tab')).toHaveCount(5);
      await nav.getByRole('tab', { name: 'Поездка' }).click();
      await page.getByPlaceholder('2026-10-02').fill('2026-10-20');
      await page.getByText('2', { exact: true }).click();
      await page.getByText('Создать поездку', { exact: true }).click();
      await expect(page.getByTestId('trip-readiness')).toBeVisible();

      const scroll = page.getByTestId('tourist-main-scroll');
      await expect(scroll).toBeVisible();
      await scroll.evaluate((el) => { el.scrollTop = el.scrollHeight; });
      const geometry = await page.evaluate(() => {
        const element = (id: string) => document.querySelector('[data-testid="' + id + '"]') as HTMLElement | null;
        const scroll = element('tourist-main-scroll');
        const nav = element('tourist-bottom-navigation');
        const finalCard = scroll?.firstElementChild?.lastElementChild as HTMLElement | null;
        if (!scroll || !nav || !finalCard) throw new Error('Trip scroll and bottom navigation must exist');
        const sc = scroll.getBoundingClientRect();
        const nv = nav.getBoundingClientRect();
        const last = finalCard.getBoundingClientRect();
        return {
          scrollBottom: sc.bottom,
          navTop: nv.top,
          lastContentBottom: last.bottom,
          scrollHeight: scroll.scrollHeight,
          clientHeight: scroll.clientHeight,
          horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2
        };
      });
      expect(geometry.scrollHeight, 'Trip is scrollable on every viewport').toBeGreaterThan(geometry.clientHeight);
      expect(geometry.navTop, 'Navigation has a separate area below the scroll viewport')
        .toBeGreaterThanOrEqual(geometry.scrollBottom - 2);
      expect(geometry.lastContentBottom, 'Last itinerary card clears the navigation')
        .toBeLessThanOrEqual(geometry.navTop - 4);
      expect(geometry.horizontalOverflow, 'No horizontal overflow').toBe(false);
      const heading = page.getByTestId('trip-unseen-heading');
      await expect(heading).toHaveText('Нет в плане и известных записях посещений');
      const headingBox = await heading.boundingBox();
      const scrollBox = await scroll.boundingBox();
      expect(headingBox).not.toBeNull();
      expect(scrollBox).not.toBeNull();
      expect(headingBox!.x + headingBox!.width, 'Complete unseen-places heading stays inside the page')
        .toBeLessThanOrEqual(scrollBox!.x + scrollBox!.width - 5);
      if (viewport.width === 375) {
        expect(headingBox!.height, 'Long Russian heading wraps instead of being clipped')
          .toBeGreaterThan(30);
      }
      await page.screenshot({
        path: testInfo.outputPath(viewport.name + '-trip-bottom-nav-clearance.png')
      });

      // Switching to Map must retain a positive-sized map viewport above the
      // same navigation instead of the old hardcoded 520px minimum overflow.
      await nav.getByRole('tab').nth(1).click();
      const map = page.getByTestId('tourist-map-stage');
      await expect(map).toBeVisible();
      const mapBox = await map.boundingBox();
      const navBox = await nav.boundingBox();
      expect(mapBox).not.toBeNull();
      expect(navBox).not.toBeNull();
      expect(mapBox!.height, 'Map retains usable viewport area').toBeGreaterThan(180);
      expect(mapBox!.y + mapBox!.height, 'Map cannot hide underneath bottom navigation')
        .toBeLessThanOrEqual(navBox!.y + 2);
      await page.screenshot({
        path: testInfo.outputPath(viewport.name + '-map-bottom-nav-clearance.png')
      });
      await nav.getByRole('tab', { name: 'Поездка' }).click();
      await expect(page.getByTestId('trip-readiness')).toBeVisible();
    }
  );
}


for (const viewport of [
  { name: 'phone-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 }
]) {
  test('private trip budget, evidence and readable forecast / ' + viewport.name,
    async ({ page }, testInfo) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.clock.install({ time: new Date('2026-10-13T08:00:00.000Z') });
      await page.goto('/');
      await page.getByRole('tab', { name: 'Поездка' }).click();
      await page.getByPlaceholder('2026-10-02').fill('2026-10-20');
      await page.getByText('2', { exact: true }).click();
      await page.getByText('Создать поездку', { exact: true }).click();

      const finance = page.getByTestId('trip-finance-card');
      await finance.getByRole('button', { name: 'Настроить бюджет поездки' }).click();
      await finance.getByTestId('trip-finance-budget-input').fill('3000');
      await finance.getByRole('button', { name: 'Сохранить бюджет' }).click();
      await finance.getByRole('button', { name: 'Добавить расход' }).click();
      await finance.getByTestId('trip-finance-title-input').fill('Личный билет в музей');
      await finance.getByRole('button', { name: 'Категория расхода: Билеты' }).click();
      await finance.getByTestId('trip-finance-estimate-input').fill('1500');
      await finance.getByTestId('trip-finance-actual-input').fill('1250,50');
      await finance.getByRole('button', { name: 'Сохранить расход' }).click();
      await expect(finance.getByTestId('trip-finance-projected')).toContainText(/1\s*250,50/);
      await expect(finance.getByTestId('trip-finance-remaining')).toContainText(/1\s*749,50/);
      await finance.getByTestId('trip-finance-projected').scrollIntoViewIfNeeded();
      await page.screenshot({
        path: testInfo.outputPath(viewport.name + '-trip-finance-budget-viewport.png')
      });
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > window.innerWidth + 2);
      expect(overflow, 'Financial journal must never expand viewport horizontally').toBe(false);
      await page.reload();
      const restored = page.getByTestId('trip-finance-card');
      await expect(restored.getByTestId('trip-finance-projected')).toContainText(/1\s*250,50/);
      await expect(restored.getByTestId('trip-finance-remaining')).toContainText(/1\s*749,50/);
    });
}
