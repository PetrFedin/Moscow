import { expect, test } from '@playwright/test';

async function ensureRussian(page: import('@playwright/test').Page) {
  const enButton = page.getByText('EN', { exact: true });
  if (await enButton.count()) {
    if (await enButton.first().isVisible().catch(() => false)) {
      await enButton.first().click();
    }
  }
  await expect(page.getByText('Открыть', { exact: true }).first()).toBeVisible();
}

test('resident journey: two objects → time → lens → 3D → spatial → interruptible portal demo → back', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Спланировать поездку' })).toBeVisible();
  await ensureRussian(page);

  await page.getByText('Карта', { exact: true }).last().click();
  await expect(page.getByText('PREVIEW КАРТЫ', { exact: true })).toBeVisible();
  await expect(page.getByText('Варварка — Зарядье', { exact: true })).toBeVisible();
  const sheetHint = page.getByText('Тяните карточку пальцем: свернуть · preview · раскрыть');
  await expect(sheetHint).toBeVisible();

  const previewBox = await sheetHint.boundingBox();
  expect(previewBox).not.toBeNull();
  if (previewBox) {
    await page.mouse.move(previewBox.x + previewBox.width / 2, previewBox.y + previewBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(previewBox.x + previewBox.width / 2, previewBox.y - 220, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(450);

    const expandedBox = await sheetHint.boundingBox();
    expect(expandedBox).not.toBeNull();
    if (expandedBox) {
      expect(expandedBox.y).toBeLessThan(previewBox.y - 120);
      await page.mouse.move(expandedBox.x + expandedBox.width / 2, expandedBox.y + expandedBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(expandedBox.x + expandedBox.width / 2, expandedBox.y + 215, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(450);

      const returnedBox = await sheetHint.boundingBox();
      expect(returnedBox).not.toBeNull();
      if (returnedBox) expect(Math.abs(returnedBox.y - previewBox.y)).toBeLessThan(45);
    }
  }

  // Second object uses the same Time Machine contract but cannot borrow Romanov assets.
  await page.getByRole('button', { name: 'Открыть Старый Английский двор' }).click();
  await expect(page.getByText('Открыть историю', { exact: true })).toBeVisible();
  await page.getByText('Открыть историю', { exact: true }).click();
  await expect(page.getByText('Старый Английский двор', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('МАШИНА ВРЕМЕНИ', { exact: true })).toBeVisible();
  await expect(page.getByText('1556', { exact: true }).first()).toBeVisible();

  // Browser preview intentionally uses a semantic HTML range control.
  const englishTimeSlider = page.getByRole('slider', { name: 'Выберите историческую эпоху' });
  await expect(englishTimeSlider).toHaveCount(1);
  await expect(englishTimeSlider).toHaveAttribute('aria-valuenow', '0');
  await englishTimeSlider.focus();
  await englishTimeSlider.press('ArrowRight');
  await expect(englishTimeSlider).toHaveAttribute('aria-valuenow', '1');
  await expect(page.getByText('1960-е', { exact: true })).toBeVisible();
  await expect(page.getByText('Исследовательская реконструкция', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Линза · готовится')).toBeDisabled();
  await expect(page.getByLabel('3D · готовится')).toBeDisabled();
  await expect(page.getByText('3D MODEL · ROMANOV', { exact: true })).toHaveCount(0);

  // Romanov remains the current candidate spatial pipeline.
  await page.getByRole('button', { name: 'Палаты бояр Романовых' }).first().click();
  await expect(page.getByText('МАШИНА ВРЕМЕНИ', { exact: true })).toBeVisible();

  const timeSlider = page.getByRole('slider', { name: 'Выберите историческую эпоху' });
  await expect(timeSlider).toHaveCount(1);
  await expect(timeSlider).toHaveAttribute('aria-valuenow', '0');
  await timeSlider.focus();
  await timeSlider.press('ArrowRight');
  await expect(timeSlider).toHaveAttribute('aria-valuenow', '1');

  await page.getByLabel('Архив поверх камеры').click();
  await expect(page.getByText('ЛИНЗА ВРЕМЕНИ · PREVIEW', { exact: true })).toBeVisible();
  const opacitySlider = page.getByTestId('archive-opacity');
  await expect(opacitySlider).toBeVisible();
  const opacityBox = await opacitySlider.boundingBox();
  if (opacityBox) {
    await page.mouse.click(opacityBox.x + opacityBox.width * 0.31, opacityBox.y + opacityBox.height / 2);
  }
  const opacityValue = page.getByTestId('archive-opacity-value');
  await expect(opacityValue).toBeVisible();
  const rememberedOpacity = await opacityValue.textContent();
  expect(rememberedOpacity).not.toBeNull();
  expect(rememberedOpacity).not.toBe('Архив · 52%');

  await page.getByText('Открыть 3D-машину времени', { exact: true }).click();
  await expect(page.getByText('Одна историческая модель — несколько режимов')).toBeVisible();

  // 3D inspection is now its own interaction layer: hotspot → evidence → source.
  await expect(page.getByText('ТОЧКИ ОСМОТРА', { exact: true })).toBeVisible();
  await expect(page.getByLabel('3D · Точка осмотра · Каменное ядро палат')).toBeVisible();
  await expect(page.getByText('Подтверждено источником', { exact: true }).first()).toBeVisible();
  await expect(page.getByLabel('3D · Слушать аудиогид точки')).toBeVisible();

  // Hotspot audio is bound to the selected inspection point and must stop/reset on selection change.
  await page.getByLabel('3D · Слушать аудиогид точки').click();
  await page.getByLabel('3D · Точка осмотра · Белокаменное оформление окон').click();
  await expect(page.getByText('Белокаменное оформление окон', { exact: true }).last()).toBeVisible();
  await expect(page.getByLabel('3D · Слушать аудиогид точки')).toBeVisible();

  await page.getByLabel('3D · Назад в архив').click();
  await expect(page.getByText('ЛИНЗА ВРЕМЕНИ · PREVIEW', { exact: true })).toBeVisible();
  await expect(opacityValue).toHaveText(rememberedOpacity ?? '');

  await page.getByText('Открыть 3D-машину времени', { exact: true }).click();
  await expect(page.getByText('Одна историческая модель — несколько режимов')).toBeVisible();
  await page.getByLabel('3D · Эпоха · 1859 / 1883 · после реставрации').click();
  await page.getByLabel('3D · Только факты').click();
  await page.getByLabel('3D · Открыть spatial mode').click();

  await expect(page.getByText('AR runtime проверяется только в нативной сборке')).toBeVisible();
  await expect(page.getByText('SEARCHING', { exact: true })).toBeVisible();
  await expect(page.getByText('DEMO PORTAL · NOT VERIFIED')).toHaveCount(0);

  const portalTrack = page.locator('[aria-label="Потяните → DEMO portal preview"]');
  await expect(portalTrack).toHaveCount(1);
  const handle = portalTrack.getByText('→', { exact: true });
  const trackBox = await portalTrack.boundingBox();
  const handleBox = await handle.boundingBox();
  expect(trackBox).not.toBeNull();
  expect(handleBox).not.toBeNull();

  if (trackBox && handleBox) {
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(trackBox.x + trackBox.width * 0.48, handleBox.y + handleBox.height / 2, { steps: 5 });
    await page.mouse.up();
    await expect(page.getByText('DEMO PORTAL · NOT VERIFIED')).toHaveCount(0);

    const resetHandleBox = await handle.boundingBox();
    if (resetHandleBox) {
      await page.mouse.move(resetHandleBox.x + resetHandleBox.width / 2, resetHandleBox.y + resetHandleBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(trackBox.x + trackBox.width - 14, resetHandleBox.y + resetHandleBox.height / 2, { steps: 8 });
      await page.mouse.up();
    }
  }

  await expect(page.getByText('DEMO PORTAL · NOT VERIFIED')).toBeVisible();
  await expect(page.getByText('DEMO PORTAL READY · NOT VERIFIED')).toBeVisible();

  await page.getByText('← 3D-модель', { exact: true }).click();
  await expect(page.getByText('Одна историческая модель — несколько режимов')).toBeVisible();
  await expect(page.getByLabel('3D · Только факты')).toBeVisible();
});


test('citywide planner is the primary Moscow entry and heritage is a secondary layer', async ({ page }) => {
  await page.goto('/');
  await ensureRussian(page);

  await expect(page.getByRole('button', { name: 'Спланировать поездку' })).toBeVisible();
  await page.getByRole('button', { name: 'Открыть все возможности планирования' }).click();
  await expect(page.getByText('Планирование и маршруты', { exact: true })).toBeVisible();
  await expect(page.getByText('MOSCOW CITY PLANNER', { exact: true })).toBeVisible();
  await expect(page.getByText('Соберите свой день в Москве', { exact: true })).toBeVisible();

  await expect(page.getByRole('button', { name: 'Музеи · выставки · театры', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Рестораны · кафе · бары', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Парки · прогулки · природа', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Рестораны · кафе · бары', exact: true }).click();
  await page.getByRole('button', { name: 'Перейти к планированию Москвы' }).click();
  await expect(page.getByText('МОЯ ПОЕЗДКА', { exact: true })).toBeVisible();

  await page.getByText('Открыть', { exact: true }).last().click();
  // Disclosure state is retained when returning from My Trip; do not toggle it closed.
  if (!(await page.getByText('ОТДЕЛЬНЫЙ HERITAGE-СЛОЙ', { exact: true }).isVisible().catch(() => false))) {
    await page.getByRole('button', { name: 'Открыть все возможности планирования' }).click();
  }
  await expect(page.getByText('ОТДЕЛЬНЫЙ HERITAGE-СЛОЙ', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Открыть историческую прогулку' }).click();
  await expect(page.getByText('WALK · 01', { exact: true })).toBeVisible();
});

test('companion moment: curated walk shows real stops and requires explicit start confirmation', async ({ page }) => {
  await page.goto('/');
  await ensureRussian(page);
  await expect(page.getByText('Чем займёмся прямо сейчас?', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Главное за полчаса' }).click();
  await expect(page.getByText(/редакционная оценка, не подтверждённая навигация/)).toBeVisible();
  await expect(page.getByText(/Палаты бояр Романовых/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Выбрать эту прогулку' }).click();
  await expect(page.getByText(/Новая прогулка заменит текущую активную прогулку/)).toBeVisible();
  await page.getByRole('button', { name: 'Подтвердить запуск прогулки' }).click();
  await expect(page.getByText('СЕЙЧАС · ОСТАНОВКА 1', { exact: true })).toBeVisible();
  const routeBeforeReload = await page.evaluate(() => {
    const values = Object.entries(window.localStorage);
    const match = values.find(([key]) => key === 'moscow:v4:experience');
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[1]);
      return { tab: parsed.tab, routeStopIds: parsed.routeStopIds, routeStep: parsed.routeStep };
    } catch { return null; }
  });
  expect(routeBeforeReload?.tab).toBe('walk');
  expect(routeBeforeReload?.routeStopIds?.length).toBeGreaterThan(0);
  expect(routeBeforeReload?.routeStep).toBe(0);
  await page.reload();
  await expect(page.getByText('СЕЙЧАС · ОСТАНОВКА 1', { exact: true })).toBeVisible();
  const routeAfterReload = await page.evaluate(() => {
    const match = Object.entries(window.localStorage).find(([key]) => key === 'moscow:v4:experience');
    if (!match) return null;
    const parsed = JSON.parse(match[1]);
    return { tab: parsed.tab, routeStopIds: parsed.routeStopIds, routeStep: parsed.routeStep };
  });
  expect(routeAfterReload).toEqual(routeBeforeReload);
});

test('city directory selection requires consent and stays a place, never a provider ticket', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Найдите повод выйти в город', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Третьяковская галерея' }).click();
  await expect(page.getByRole('button', { name: 'Проверить официальный сайт' })).toBeVisible();
  await page.getByRole('button', { name: 'Добавить место в поездку' }).click();
  await expect(page.getByText(/После создания поездки подтвердите добавление/)).toBeVisible();
  await page.getByPlaceholder('2026-10-02').fill('2026-10-14');
  await page.getByText('1', { exact: true }).click();
  await page.getByText('Создать поездку', { exact: true }).click();
  await expect(page.getByText('Добавить в выбранный день?', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Подтвердить добавление места' }).click();
  await expect(page.getByText('Добавить в выбранный день?', { exact: true })).toHaveCount(0);
  const snapshot = await page.evaluate(() => JSON.parse(window.localStorage.getItem('moscow:v1:personal-trip') || '{}'));
  const museum = snapshot.items.find((item: {title:string}) => item.title === 'Третьяковская галерея');
  expect(museum).toBeTruthy();
  expect(museum.commitment).toBeUndefined();
  expect(museum.kind).toBe('museum');
  expect(museum.catalogPlaceId).toBe('tretyakov-lavrushinsky');
  expect(museum.officialSourceUrl).toContain('/for-visitors/museums/istoricheskoe-zdanie/');
  expect(museum.source).toBe('manual');
  await page.reload();
  await expect(page.getByText('Третьяковская галерея', { exact: true }).first()).toBeVisible();
});

test('delete-trip is a deliberate two-step action; cancellation retains the trip', async ({ page }) => {
  await page.goto('/');
  await ensureRussian(page);
  await page.getByText('Поездка', { exact: true }).last().click();
  await page.getByPlaceholder('2026-10-02').fill('2026-10-14');
  await page.getByText('1', { exact: true }).click();
  await page.getByText('Создать поездку', { exact: true }).click();
  await page.getByText('Новая', { exact: true }).click();
  await expect(page.getByText('Создать новую поездку?', { exact: true })).toBeVisible();
  const before = await page.evaluate(() => window.localStorage.getItem('moscow:v1:personal-trip'));
  expect(before).toBeTruthy();
  await page.getByRole('button', { name: 'Отменить удаление поездки' }).click();
  await expect(page.getByText('Создать новую поездку?', { exact: true })).toHaveCount(0);
  const preserved = await page.evaluate(() => window.localStorage.getItem('moscow:v1:personal-trip'));
  expect(preserved).toBe(before);
  await page.getByText('Новая', { exact: true }).click();
  await page.getByRole('button', { name: 'Удалить текущую поездку и начать новую' }).click();
  await expect(page.getByPlaceholder('2026-10-02')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('moscow:v1:personal-trip'))).toBeNull();
});

test('today links the curated venue to its official source without a fake ticket', async ({ page }) => {
  await page.goto('/');
  await ensureRussian(page);
  await page.getByRole('button', { name: 'Третьяковская галерея' }).click();
  await page.getByRole('button', { name: 'Добавить место в поездку' }).click();
  const today = await page.evaluate(() => {
    const fields = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const item = (type: string) => fields.find(v => v.type === type)?.value ?? '';
    return item('year') + '-' + item('month') + '-' + item('day');
  });
  await page.getByPlaceholder('2026-10-02').fill(today);
  await page.getByText('1', { exact: true }).click();
  await page.getByText('Создать поездку', { exact: true }).click();
  await page.getByRole('button', { name: 'Подтвердить добавление места' }).click();
  await expect(page.getByText('СЕГОДНЯ В МОСКВЕ', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Открыть официальный источник' })).toBeVisible();
  await expect(page.getByText('Подтверждено провайдером', { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Открыть официальный источник' })).toBeVisible();
});

test('restaurant discovery filters venues and never creates a table reservation', async ({ page }) => {
  await page.goto('/');
  await ensureRussian(page);
  await page.getByRole('button', { name: 'Рестораны', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Кафе Пушкинъ' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ресторан «Воронеж»' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Большой театр' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Кафе Пушкинъ' }).click();
  await expect(page.getByRole('button', { name: 'Найти адрес на карте' })).toBeVisible();
  await page.getByRole('button', { name: 'Добавить место в поездку' }).click();
  await page.getByPlaceholder('2026-10-02').fill('2026-10-14');
  await page.getByText('1', { exact: true }).click();
  await page.getByText('Создать поездку', { exact: true }).click();
  await page.getByRole('button', { name: 'Подтвердить добавление места' }).click();
  const trip = await page.evaluate(() => JSON.parse(window.localStorage.getItem('moscow:v1:personal-trip') || '{}'));
  const restaurant = trip.items.find((item: {catalogPlaceId?: string}) => item.catalogPlaceId === 'cafe-pushkin-tverskoy');
  expect(restaurant).toBeTruthy();
  expect(restaurant.kind).toBe('food');
  expect(restaurant.commitment).toBeUndefined();
  expect(restaurant.officialSourceUrl).toBe('https://cafe-pushkin.ru/');
  await page.reload();
  const restored = await page.evaluate(() => JSON.parse(window.localStorage.getItem('moscow:v1:personal-trip') || '{}'));
  expect(restored.items.some((item: {catalogPlaceId?: string}) => item.catalogPlaceId === 'cafe-pushkin-tverskoy')).toBe(true);
});

test('catalog favorites survive reload and can become a planned visit later', async ({ page }) => {
  await page.goto('/');
  await ensureRussian(page);
  await page.getByRole('button', { name: 'Кафе Пушкинъ' }).click();
  await page.getByRole('button', { name: 'Сохранить место в избранное' }).click();
  await page.getByRole('tab', { name: 'Моя Москва' }).click();
  await expect(page.getByText('Кафе Пушкинъ', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Добавить сохранённое место в поездку' })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Кафе Пушкинъ', { exact: true })).toBeVisible();
  const experience = await page.evaluate(() => JSON.parse(window.localStorage.getItem('moscow:v4:experience') || '{}'));
  expect(experience.savedIds).toContain('cafe-pushkin-tverskoy');
  await page.getByRole('button', { name: 'Добавить сохранённое место в поездку' }).click();
  await expect(page.getByText(/После создания поездки подтвердите добавление/)).toBeVisible();
  await expect(page.getByText('СЕГОДНЯ В МОСКВЕ', { exact: true })).toHaveCount(0);
});

test('empty Today offers discovery instead of claiming the itinerary is finished', async ({ page }) => {
  await page.goto('/');
  await ensureRussian(page);
  await page.getByRole('tab', { name: 'Поездка' }).click();
  const date = await page.evaluate(() => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const find = (type: string) => parts.find(p => p.type === type)?.value ?? '';
    return find('year') + '-' + find('month') + '-' + find('day');
  });
  await page.getByPlaceholder('2026-10-02').fill(date);
  await page.getByText('1', { exact: true }).click();
  await page.getByText('Создать поездку', { exact: true }).click();
  await expect(page.getByText('Пока нет планов на сегодня', { exact: true })).toBeVisible();
  await expect(page.getByText('План на сегодня выполнен', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/мин по вашему расписанию/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Найти первое место' }).click();
  await expect(page.getByText('Найдите повод выйти в город', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Поездка' }).click();
  await expect(page.getByText('Моя поездка в Москву', { exact: true })).toBeVisible();
});

test('Today keeps the next untimed visit visible beside a fixed ticket; explicit check-in survives reload', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-13T08:00:00.000Z') });
  await page.goto('/');
  await ensureRussian(page);
  await page.getByRole('button', { name: 'Третьяковская галерея' }).click();
  await page.getByRole('button', { name: 'Добавить место в поездку' }).click();
  await page.getByPlaceholder('2026-10-02').fill('2026-10-13');
  await page.getByText('1', { exact: true }).click();
  await page.getByText('Создать поездку', { exact: true }).click();
  await page.getByRole('button', { name: 'Подтвердить добавление места' }).click();
  await expect(page.getByRole('button', { name: 'Открыть официальный источник' })).toBeVisible();

  await page.evaluate(() => {
    const key = 'moscow:v1:personal-trip';
    const value = JSON.parse(window.localStorage.getItem(key) || '{}');
    value.items.push({
      id: 'today-fixed-theatre', dayDate: '2026-10-13',
      title: 'Большой театр · мой билет', kind: 'theatre', source: 'manual',
      status: 'planned',
      plannedStartAt: '2026-10-13T19:00:00+03:00',
      plannedEndAt: '2026-10-13T21:00:00+03:00',
      commitment: { kind: 'ticket', status: 'confirmed', verification: 'user-declared', reference: 'USER-QR-LOCAL' }
    });
    window.localStorage.setItem(key, JSON.stringify(value));
  });
  await page.reload();

  await expect(page.getByText('СЛЕДУЮЩИЙ БИЛЕТ / БРОНЬ', { exact: true })).toBeVisible();
  await expect(page.getByText('ИДЕЯ ДЛЯ СЛЕДУЮЩЕЙ ОСТАНОВКИ', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Найти адрес на карте' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Открыть официальный источник' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Отметить, что я был здесь' })).toBeVisible();
  await expect(page.getByText('Добавлено вами · статус провайдера не проверен', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Отметить, что я был здесь' }).click();
  await expect(page.getByText(/Запись будет добавлена как ваша личная отметка/)).toBeVisible();
  await page.getByRole('button', { name: 'Отменить отметку посещения' }).click();
  const before = await page.evaluate(() => JSON.parse(window.localStorage.getItem('moscow:v1:personal-trip') || '{}'));
  expect(before.visits).toHaveLength(0);
  expect(before.items.find((item: {id:string}) => item.id === 'today-fixed-theatre').commitment.reference).toBe('USER-QR-LOCAL');

  await page.getByRole('button', { name: 'Отметить, что я был здесь' }).click();
  await page.getByRole('button', { name: 'Подтвердить личное посещение' }).click();
  await expect(page.getByText('УЖЕ СЕГОДНЯ', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(window.localStorage.getItem('moscow:v1:personal-trip') || '{}').visits.length)).toBe(1);
  await page.reload();
  await expect(page.getByText('УЖЕ СЕГОДНЯ', { exact: true })).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem('moscow:v1:personal-trip') || '{}'));
  expect(stored.visits[0].evidence).toBe('user-confirmed');
  expect(stored.items.find((item: {id:string}) => item.id === 'today-fixed-theatre').commitment.reference).toBe('USER-QR-LOCAL');
});

test('multiple journeys survive archive, new trip and subsequent resume on the same device', async ({ page }) => {
  await page.goto('/');
  await ensureRussian(page);
  await page.getByRole('tab', { name: 'Поездка' }).click();
  await page.getByPlaceholder('2026-10-02').fill('2026-10-13');
  await page.getByText('1', { exact: true }).click();
  await page.getByText('Создать поездку', { exact: true }).click();
  // A journey becomes visible only after the verified first persistence.
  await expect(page.getByText('День 1', { exact: true })).toBeVisible();
  const first = await page.evaluate(() => JSON.parse(window.localStorage.getItem('moscow:v1:personal-trip') || '{}'));
  expect(first.days).toEqual(['2026-10-13']);

  await page.getByText('Новая', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Архивировать текущую поездку и начать новую' })).toBeVisible();
  await page.getByRole('button', { name: 'Архивировать текущую поездку и начать новую' }).click();
  await expect(page.getByText('Прошлые поездки', { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('2026-10-02')).toBeVisible();
  const history = await page.evaluate(() => JSON.parse(window.localStorage.getItem('moscow:v1:personal-trip-archive') || '{}'));
  expect(history.schemaVersion).toBe(1);
  expect(history.trips).toHaveLength(1);
  expect(history.trips[0].id).toBe(first.id);

  await page.getByPlaceholder('2026-10-02').fill('2026-10-20');
  await page.getByText('1', { exact: true }).click();
  await page.getByText('Создать поездку', { exact: true }).click();
  await expect(page.getByText('День 1', { exact: true })).toBeVisible();
  const second = await page.evaluate(() => JSON.parse(window.localStorage.getItem('moscow:v1:personal-trip') || '{}'));
  expect(second.id).not.toBe(first.id);
  await page.getByRole('button', { name: 'Открыть архивную поездку: 2026-10-13' }).click();
  await expect(page.getByText('2026-10-13 → 2026-10-13', { exact: true })).toBeVisible();
  const active = await page.evaluate(() => JSON.parse(window.localStorage.getItem('moscow:v1:personal-trip') || '{}'));
  expect(active.id).toBe(first.id);
  const restoredArchive = await page.evaluate(() => JSON.parse(window.localStorage.getItem('moscow:v1:personal-trip-archive') || '{}'));
  expect(restoredArchive.trips.some((item: {id:string}) => item.id === second.id)).toBe(true);
  await page.reload();
  const persisted = await page.evaluate(() => JSON.parse(window.localStorage.getItem('moscow:v1:personal-trip') || '{}'));
  expect(persisted.id).toBe(first.id);
  await expect(page.getByRole('button', { name: 'Открыть архивную поездку: 2026-10-20' })).toBeVisible();
});


test('My Moscow storage fault is visible, keeps the saved-place intent, and retries durably', async ({ page }) => {
  await page.goto('/');
  await ensureRussian(page);
  await expect.poll(() => page.evaluate(() =>
    window.localStorage.getItem('moscow:v4:experience') !== null
  )).toBe(true);
  await page.evaluate(() => {
    const actual = Storage.prototype.setItem;
    let injected = false;
    Storage.prototype.setItem = function(key: string, value: string) {
      if (!injected && key === 'moscow:v4:experience') {
        injected = true;
        throw new DOMException('Injected My Moscow quota failure', 'QuotaExceededError');
      }
      return actual.call(this, key, value);
    };
  });
  await page.getByRole('button', { name: 'Кафе Пушкинъ' }).click();
  await page.getByRole('button', { name: 'Сохранить место в избранное' }).click();
  const warning = page.getByTestId('experience-storage-error');
  await expect(warning).toBeVisible();
  await expect(warning).toContainText('Прогресс «Моей Москвы» не сохранён');
  const beforeRetry = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('moscow:v4:experience') || '{}')
  );
  expect(beforeRetry.savedIds ?? []).not.toContain('cafe-pushkin-tverskoy');

  await page.getByRole('button', { name: 'Повторить сохранение прогресса' }).click();
  await expect(warning).toHaveCount(0);
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('moscow:v4:experience') || '{}').savedIds
      ?.includes('cafe-pushkin-tverskoy') ?? false
  )).toBe(true);
  await page.reload();
  await ensureRussian(page);
  await page.getByRole('tab', { name: 'Моя Москва' }).click();
  await expect(page.getByText('Кафе Пушкинъ', { exact: true })).toBeVisible();
  await expect(page.getByTestId('experience-storage-error')).toHaveCount(0);
});

test('two tabs cannot silently overwrite each others My Moscow favorites', async ({ page, context }) => {
  await page.goto('/');
  await ensureRussian(page);
  await expect.poll(() => page.evaluate(() =>
    window.localStorage.getItem('moscow:v4:experience') !== null
  )).toBe(true);

  // Both tabs hydrate the identical prior version before any favorite is added.
  const secondTab = await context.newPage();
  await secondTab.goto('/');
  await ensureRussian(secondTab);
  await expect.poll(() => secondTab.evaluate(() =>
    window.localStorage.getItem('moscow:v4:experience') !== null
  )).toBe(true);

  await page.getByRole('button', { name: 'Кафе Пушкинъ' }).click();
  await page.getByRole('button', { name: 'Сохранить место в избранное' }).click();
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('moscow:v4:experience') || '{}').savedIds
      ?.includes('cafe-pushkin-tverskoy') ?? false
  )).toBe(true);

  await secondTab.getByRole('button', { name: 'Третьяковская галерея' }).click();
  await secondTab.getByRole('button', { name: 'Сохранить место в избранное' }).click();
  await expect(secondTab.getByTestId('experience-storage-error')).toBeVisible();

  const afterConflict = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('moscow:v4:experience') || '{}')
  );
  expect(afterConflict.savedIds).toContain('cafe-pushkin-tverskoy');
  expect(afterConflict.savedIds).not.toContain('tretyakov-lavrushinsky');
  // Explicit Retry must not discard the other tab's saved records either.
  await secondTab.getByRole('button', { name: 'Повторить сохранение прогресса' }).click();
  await expect(secondTab.getByTestId('experience-storage-error')).toBeVisible();
  expect((await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('moscow:v4:experience') || '{}')
  )).savedIds).toContain('cafe-pushkin-tverskoy');
  await secondTab.close();
});


test('corrupt My Moscow snapshot blocks all edits and preserves raw storage through retry', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.setItem('moscow:v4:experience', '{original-corrupt-personal-progress');
  });
  await page.reload();
  const blocked=page.getByTestId('experience-hydration-blocked');
  await expect(blocked).toBeVisible();
  await expect(blocked).toContainText('Сохранённые данные не изменены');
  await expect(page.getByRole('tab',{name:'Поездка'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Сохранить место в избранное'})).toHaveCount(0);
  await page.getByRole('button',{name:'Повторить безопасную загрузку'}).click();
  await expect(blocked).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem('moscow:v4:experience')))
    .toBe('{original-corrupt-personal-progress');

  // External repair is a fixture action, never performed by the app.
  await page.evaluate(() => window.localStorage.setItem('moscow:v4:experience', JSON.stringify({
    savedIds:['romanov-chambers'],visitedIds:['old-english-court'],
    language:'ru',tab:'saved'
  })));
  await page.getByRole('button',{name:'Повторить безопасную загрузку'}).click();
  await expect(blocked).toHaveCount(0);
  await expect(page.getByRole('tab',{name:'Моя Москва'})).toBeVisible();
  await expect(page.getByText('мест открыто')).toBeVisible();
  expect((await page.evaluate(() => JSON.parse(
    window.localStorage.getItem('moscow:v4:experience') || '{}'
  ))).visitedIds).toContain('old-english-court');
});
