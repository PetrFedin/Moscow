import { expect, test } from '@playwright/test';

async function ensureRussian(page: import('@playwright/test').Page) {
  const enButton = page.getByText('EN', { exact: true });
  if (await enButton.count() && await enButton.first().isVisible().catch(() => false)) {
    await enButton.first().click();
  }
}

function moscowNowParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return {
    date: value('year') + '-' + value('month') + '-' + value('day'),
    hour: Number(value('hour'))
  };
}

function moscowDateOffset(days: number) {
  const date = new Date(moscowNowParts().date + 'T12:00:00.000Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

test('personal trip keeps user-declared ticket truth and visit history after reload', async ({ page }) => {
  await page.goto('/');
  await ensureRussian(page);

  await page.getByText('Поездка', { exact: true }).last().click();
  await expect(page.getByText('МОЯ ПОЕЗДКА', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Соберите Москву по дням', { exact: true })).toBeVisible();

  const arrival = page.getByPlaceholder('2026-10-02');
  await arrival.fill(moscowDateOffset(1));
  await page.getByText('3', { exact: true }).click();
  await page.getByText('Создать поездку', { exact: true }).click();

  await expect(page.getByText('День 1', { exact: true })).toBeVisible();
  await expect(page.getByText('DAY COMPOSER · V2', { exact: true })).toBeVisible();
  await expect(page.getByText('Ваш день как единая временная линия', { exact: true })).toBeVisible();
  await expect(page.getByText('FREE', { exact: true })).toBeVisible();
  await page.getByText('+ Добавить', { exact: true }).click();
  await page.getByPlaceholder('Например: Большой театр').fill('Большой театр · мой билет');
  await page.getByText('Театр', { exact: true }).click();
  await page.getByText('Билет', { exact: true }).click();
  await page.getByPlaceholder('Номер заказа / заметка (необязательно)').fill('заказ сохранён у меня');
  await page.getByText('Добавить в день', { exact: true }).click();

  await expect(page.getByText('Большой театр · мой билет', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Добавлено вами · не проверено провайдером', { exact: true })).toBeVisible();
  await expect(page.getByText('Подтверждено провайдером', { exact: true })).toHaveCount(0);

  await page.getByText('Я был здесь', { exact: true }).click();
  await expect(page.getByText('МОЯ ИСТОРИЯ МОСКВЫ', { exact: true })).toBeVisible();
  await expect(page.getByText(/отмечено вами/)).toBeVisible();
  await page.getByRole('button', { name: 'Редактировать заметку: Большой театр · мой билет' }).click();
  await page.getByLabel('Текст личной заметки').fill('Запомнилась атмосфера этого вечера.');
  await page.getByRole('button', { name: 'Сохранить заметку' }).click();
  await expect(page.getByText('Запомнилась атмосфера этого вечера.', { exact: true })).toBeVisible();

  await page.reload();
  await ensureRussian(page);
  await expect(page.getByText('Большой театр · мой билет', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Добавлено вами · не проверено провайдером', { exact: true })).toBeVisible();
  await expect(page.getByText('МОЯ ИСТОРИЯ МОСКВЫ', { exact: true })).toBeVisible();
  await expect(page.getByText(/отмечено вами/)).toBeVisible();
  await expect(page.getByText('Запомнилась атмосфера этого вечера.', { exact: true })).toBeVisible();
});


test('scheduler surfaces a fixed-time conflict and preserves a ticket when moved to another day', async ({ page }) => {
  await page.goto('/');
  await ensureRussian(page);

  await page.getByText('Поездка', { exact: true }).last().click();
  await page.getByPlaceholder('2026-10-02').fill(moscowDateOffset(1));
  await page.getByText('2', { exact: true }).click();
  await page.getByText('Создать поездку', { exact: true }).click();

  await page.getByText('+ Добавить', { exact: true }).click();
  await page.getByPlaceholder('Например: Большой театр').fill('Музей · фиксированный билет');
  await page.getByText('Музей', { exact: true }).click();
  await page.getByPlaceholder('19:00').fill('10:00');
  await page.getByPlaceholder('21:00').fill('12:00');
  await page.getByText('Билет', { exact: true }).click();
  await page.getByText('Добавить в день', { exact: true }).click();

  await page.getByText('+ Добавить', { exact: true }).click();
  await page.getByPlaceholder('Например: Большой театр').fill('Театр · фиксированная бронь');
  await page.getByText('Театр', { exact: true }).click();
  await page.getByPlaceholder('19:00').fill('11:00');
  await page.getByPlaceholder('21:00').fill('13:00');
  await page.getByText('Бронь', { exact: true }).click();
  await page.getByText('Добавить в день', { exact: true }).click();

  await expect(page.getByText('КОНФЛИКТ ВРЕМЕНИ', { exact: true })).toBeVisible();
  await expect(page.getByText(/Музей · фиксированный билет ↔ Театр · фиксированная бронь/)).toBeVisible();
  await expect(page.getByText('CONFLICT', { exact: true })).toBeVisible();
  await expect(page.getByText('ALTERNATIVE SLOTS', { exact: true })).toBeVisible();

  await page.getByLabel('Перенести Театр · фиксированная бронь на следующий день').click();
  await expect(page.getByText('КОНФЛИКТ ВРЕМЕНИ', { exact: true })).toHaveCount(0);

  await page.getByText('День 2', { exact: true }).click();
  await expect(page.getByText('Театр · фиксированная бронь', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/11:00–13:00/)).toBeVisible();
  await expect(page.getByText('Добавлено вами · не проверено провайдером', { exact: true })).toBeVisible();
});


test('Tourist Today surfaces the active booking without upgrading manual verification', async ({ page }) => {
  const moscow = moscowNowParts();
  const startHour = Math.max(0, moscow.hour - 1);
  const endHour = Math.min(23, moscow.hour + 1);
  const activeStart = String(startHour).padStart(2, '0') + ':00';
  const activeEnd = String(endHour).padStart(2, '0') + ':59';

  await page.goto('/');
  await ensureRussian(page);

  await page.getByText('Поездка', { exact: true }).last().click();
  await page.getByPlaceholder('2026-10-02').fill(moscow.date);
  await page.getByText('2', { exact: true }).click();
  await page.getByText('Создать поездку', { exact: true }).click();

  await expect(page.getByText('СЕГОДНЯ В МОСКВЕ', { exact: true })).toBeVisible();

  await page.getByText('+ Добавить', { exact: true }).click();
  await page.getByPlaceholder('Например: Большой театр').fill('Ужин · активная бронь');
  await page.getByText('Ресторан', { exact: true }).click();
  await page.getByPlaceholder('19:00').fill(activeStart);
  await page.getByPlaceholder('21:00').fill(activeEnd);
  await page.getByText('Бронь', { exact: true }).click();
  await page.getByPlaceholder('Где куплено / забронировано').fill('Моя бронь');
  await page.getByText('Добавить в день', { exact: true }).click();

  await expect(page.getByText('СЕЙЧАС ПО ПЛАНУ', { exact: true })).toBeVisible();
  // Today is the primary trip surface and shows the active state before secondary diagnostics.
  const todayTop = await page.getByText('СЕГОДНЯ В МОСКВЕ', { exact: true }).boundingBox();
  const composerTop = await page.getByText('DAY COMPOSER · V2', { exact: true }).boundingBox();
  expect(todayTop).not.toBeNull();
  expect(composerTop).not.toBeNull();
  if (todayTop && composerTop) expect(todayTop.y).toBeLessThan(composerTop.y);
  await expect(page.getByText('Ужин · активная бронь', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Добавлено вами · не проверено провайдером', { exact: true })).toBeVisible();
  await expect(page.getByText('Подтверждено провайдером', { exact: true })).toHaveCount(0);
});


test('Moscow Passport separates where the tourist ate from generic visit history', async ({ page }) => {
  await page.goto('/');
  await ensureRussian(page);

  await page.getByText('Поездка', { exact: true }).last().click();
  await page.getByPlaceholder('2026-10-02').fill(moscowDateOffset(1));
  await page.getByText('1', { exact: true }).click();
  await page.getByText('Создать поездку', { exact: true }).click();

  await page.getByText('+ Добавить', { exact: true }).click();
  await page.getByPlaceholder('Например: Большой театр').fill('Кафе · обед');
  await page.getByText('Ресторан', { exact: true }).click();
  await page.getByText('Добавить в день', { exact: true }).click();

  await page.getByText('Я был здесь', { exact: true }).click();

  await expect(page.getByText('МОЯ ИСТОРИЯ МОСКВЫ', { exact: true })).toBeVisible();
  await expect(page.getByText('Moscow Passport', { exact: true })).toBeVisible();
  await expect(page.getByText('Где ел', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Кафе · обед', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/отмечено вами/).first()).toBeVisible();
});


test('Moscow Passport groups restaurant and theatre visits semantically', async ({ page }) => {
  await page.goto('/');
  await ensureRussian(page);

  await page.getByText('Поездка', { exact: true }).last().click();
  const date = moscowNowParts().date;
  await page.getByPlaceholder('2026-10-02').fill(date);
  await page.getByText('2', { exact: true }).click();
  await page.getByText('Создать поездку', { exact: true }).click();

  await page.getByText('+ Добавить', { exact: true }).click();
  await page.getByPlaceholder('Например: Большой театр').fill('Ресторан · тест дневника');
  await page.getByText('Ресторан', { exact: true }).click();
  await page.getByText('Добавить в день', { exact: true }).click();
  await page.getByText('Я был здесь', { exact: true }).last().click();

  await page.getByText('+ Добавить', { exact: true }).click();
  await page.getByPlaceholder('Например: Большой театр').fill('Театр · тест дневника');
  await page.getByText('Театр', { exact: true }).click();
  await page.getByText('Добавить в день', { exact: true }).click();
  await page.getByText('Я был здесь', { exact: true }).last().click();

  await expect(page.getByText('Moscow Passport', { exact: true })).toBeVisible();
  await expect(page.getByText('Где ел', { exact: true })).toBeVisible();
  await expect(page.getByText('Культура', { exact: true })).toBeVisible();
  await expect(page.getByText('Ресторан · тест дневника', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('Театр · тест дневника', { exact: true }).last()).toBeVisible();
  await expect(page.getByText(/отмечено вами/).last()).toBeVisible();
});


test('Booking Wallet persists theatre booking details without provider upgrade', async ({ page }) => {
  const date = moscowNowParts().date;
  await page.goto('/');
  await ensureRussian(page);

  await page.getByText('Поездка', { exact: true }).last().click();
  await page.getByPlaceholder('2026-10-02').fill(date);
  await page.getByText('2', { exact: true }).click();
  await page.getByText('Создать поездку', { exact: true }).click();

  await page.getByText('+ Добавить', { exact: true }).click();
  await page.getByPlaceholder('Например: Большой театр').fill('Театр · Wallet test');
  await page.getByText('Театр', { exact: true }).click();
  await page.getByText('Билет', { exact: true }).click();
  await page.getByPlaceholder('Где куплено / забронировано').fill('Касса театра');
  await page.getByPlaceholder('Номер заказа / заметка (необязательно)').fill('ORDER-2026');
  await page.getByPlaceholder('Количество гостей / билетов').fill('2');
  await page.getByPlaceholder('Сектор, ряд, места').fill('Партер · ряд 5 · места 11–12');
  await page.getByPlaceholder('Адрес / место встречи').fill('Театральная площадь, 1');
  await page.getByText('Добавить в день', { exact: true }).click();

  await expect(page.getByText('Мои билеты и брони', { exact: true })).toBeVisible();
  await expect(page.getByText('Театр · Wallet test', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Касса театра · ORDER-2026/).first()).toBeVisible();
  await expect(page.getByText(/Гостей · 2/).first()).toBeVisible();
  await expect(page.getByText(/Места · Партер · ряд 5 · места 11–12/).first()).toBeVisible();
  await expect(page.getByText(/Адрес: Театральная площадь, 1/).first()).toBeVisible();
  await expect(page.getByText('Добавлено вами · провайдер не проверен', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Подтверждено провайдером', { exact: true })).toHaveCount(0);

  await page.reload();
  await ensureRussian(page);
  await expect(page.getByText('Мои билеты и брони', { exact: true })).toBeVisible();
  await expect(page.getByText(/Касса театра · ORDER-2026/).first()).toBeVisible();
  await expect(page.getByText(/Места · Партер · ряд 5 · места 11–12/).first()).toBeVisible();
});


test('Trip Preferences change day bounds and reserve lunch window', async ({ page }) => {
  await page.goto('/');
  await ensureRussian(page);

  await page.getByText('Поездка', { exact: true }).last().click();
  await page.getByPlaceholder('2026-10-02').fill(moscowDateOffset(1));
  await page.getByText('2', { exact: true }).click();
  await page.getByText('Создать поездку', { exact: true }).click();

  await page.getByRole('button', { name: 'Настроить подробности поездки' }).click();
  await expect(page.getByText('Настройки поездки', { exact: true })).toBeVisible();
  await page.getByText('Изменить', { exact: true }).click();

  await page.getByText('Спокойно', { exact: true }).click();
  await page.getByText('Обязательно', { exact: true }).click();
  await page.getByText('Главное', { exact: true }).click();
  await page.getByPlaceholder('09:00').fill('10:00');
  await page.getByPlaceholder('23:00').fill('18:00');
  await page.getByPlaceholder('60').fill('35');
  await page.getByPlaceholder('13:00').fill('13:00');
  await page.getByPlaceholder('14:00').fill('14:00');
  await page.getByText('Сохранить настройки', { exact: true }).click();

  await expect(page.getByText(/Спокойно · 10:00–18:00 · пешком до 35 мин/)).toBeVisible();
  await expect(page.getByText(/Без ступеней: Обязательно · Главное/)).toBeVisible();
  await expect(page.getByText('Свободное окно · 180 мин', { exact: true })).toBeVisible();
  await expect(page.getByText('Свободное окно · 240 мин', { exact: true })).toBeVisible();

  await page.reload();
  await ensureRussian(page);
  await page.getByRole('button', { name: 'Настроить подробности поездки' }).click();
  await expect(page.getByText(/Спокойно · 10:00–18:00 · пешком до 35 мин/)).toBeVisible();
  await expect(page.getByText(/Без ступеней: Обязательно · Главное/)).toBeVisible();
});


test('Day Replan requires explicit apply and preserves fixed booking', async ({ page }) => {
  const today = moscowNowParts().date;
  const tomorrowDate = new Date(today + 'T12:00:00.000Z');
  tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);

  await page.goto('/');
  await ensureRussian(page);

  await page.getByText('Поездка', { exact: true }).last().click();
  await page.getByPlaceholder('2026-10-02').fill(tomorrow);
  await page.getByText('2', { exact: true }).click();
  await page.getByText('Создать поездку', { exact: true }).click();

  await page.getByText('+ Добавить', { exact: true }).click();
  await page.getByPlaceholder('Например: Большой театр').fill('Гибкий музей · replan');
  await page.getByText('Музей', { exact: true }).click();
  await page.getByPlaceholder('19:00').fill('10:00');
  await page.getByPlaceholder('21:00').fill('11:00');
  await page.getByText('Добавить в день', { exact: true }).click();

  await page.getByText('+ Добавить', { exact: true }).click();
  await page.getByPlaceholder('Например: Большой театр').fill('Фиксированный театр · replan');
  await page.getByText('Театр', { exact: true }).click();
  await page.getByPlaceholder('19:00').fill('12:00');
  await page.getByPlaceholder('21:00').fill('13:00');
  await page.getByText('Билет', { exact: true }).click();
  await page.getByText('Добавить в день', { exact: true }).click();

  await page.getByText('+ Добавить', { exact: true }).click();
  await page.getByPlaceholder('Например: Большой театр').fill('Гибкая прогулка · replan');
  await page.getByText('Активность', { exact: true }).click();
  await page.getByPlaceholder('19:00').fill('14:00');
  await page.getByPlaceholder('21:00').fill('15:00');
  await page.getByText('Добавить в день', { exact: true }).click();

  await page.getByRole('button', { name: 'Настроить подробности поездки' }).click();
  await expect(page.getByText('Пересобрать остаток дня', { exact: true })).toBeVisible();
  await page.getByText('Предложить', { exact: true }).click();

  await expect(page.getByText('СОХРАНЯЕМ ТОЧНО', { exact: true })).toBeVisible();
  await expect(page.getByText(/12:00–13:00 · Фиксированный театр · replan/)).toBeVisible();
  await expect(page.getByText(/09:00–10:00 · Гибкий музей · replan/)).toBeVisible();
  await expect(page.getByText(/10:00–11:00 · Гибкая прогулка · replan/)).toBeVisible();
  await expect(page.getByText(/Маршрут, часы работы, доступность и погода не подтверждены/)).toBeVisible();

  // Proposal is preview-only until explicit Apply.
  await expect(page.getByText(/10:00–11:00/).first()).toBeVisible();

  await page.getByText('Применить', { exact: true }).click();

  await expect(page.getByText(/09:00–10:00/).first()).toBeVisible();
  await expect(page.getByText(/12:00–13:00/).first()).toBeVisible();
  await expect(page.getByText('СОХРАНЯЕМ ТОЧНО', { exact: true })).toHaveCount(0);
});


test('Day Composer replays source-backed Valhalla evidence without claiming it is live', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.localStorage.setItem('moscow:v1:personal-trip', JSON.stringify({
      schemaVersion: 1,
      id: 'routing-evidence-replay:valhalla-2026-10-08',
      destinationId: 'moscow',
      title: 'Valhalla evidence replay',
      startDate: '2026-10-08',
      endDate: '2026-10-08',
      days: ['2026-10-08'],
      items: [
        {
          id: 'pushkin',
          dayDate: '2026-10-08',
          title: 'Пушкинский музей · evidence endpoint',
          kind: 'museum',
          source: 'provider',
          destinationNodeId: 'pushkin-museum',
          plannedStartAt: '2026-10-08T12:00:00+03:00',
          plannedEndAt: '2026-10-08T13:00:00+03:00',
          status: 'planned'
        },
        {
          id: 'bolshoi',
          dayDate: '2026-10-08',
          title: 'Большой театр · evidence endpoint',
          kind: 'theatre',
          source: 'provider',
          destinationNodeId: 'bolshoi-theatre',
          plannedStartAt: '2026-10-08T13:35:00+03:00',
          plannedEndAt: '2026-10-08T15:30:00+03:00',
          status: 'planned'
        }
      ],
      visits: [],
      createdAt: '2026-10-08T09:42:00.000Z',
      updatedAt: '2026-10-08T09:42:00.000Z'
    }));
  });

  await page.reload();
  await ensureRussian(page);
  await page.getByText('Поездка', { exact: true }).last().click();

  await expect(page.getByText('DAY COMPOSER · V2', { exact: true })).toBeVisible();
  await expect(page.getByText('TRAVEL · 25 мин · WALK', { exact: true })).toBeVisible();
  await expect(page.getByText('TIGHT', { exact: true })).toBeVisible();
  await expect(page.getByText('EVIDENCE REPLAY · SOURCE-BACKED · NOT LIVE', { exact: true })).toBeVisible();
  await expect(page.getByText(/Valhalla · 2026-10-08T09:41:00.499Z/)).toBeVisible();
});


test('Day Composer replays real Tretyakov live-city truth with explicit not-current disclosure', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.localStorage.setItem('moscow:v1:personal-trip', JSON.stringify({
      schemaVersion: 1,
      id: 'live-city-evidence-replay:tretyakov-2026-10-08',
      destinationId: 'moscow',
      title: 'Tretyakov live city evidence replay',
      startDate: '2026-10-08',
      endDate: '2026-10-08',
      days: ['2026-10-08'],
      items: [{
        id: 'tretyakov',
        dayDate: '2026-10-08',
        title: 'Новая Третьяковка',
        kind: 'museum',
        source: 'provider',
        destinationNodeId: 'new-tretyakov',
        plannedStartAt: '2026-10-08T17:00:00+03:00',
        plannedEndAt: '2026-10-08T19:00:00+03:00',
        status: 'planned'
      }],
      visits: [],
      createdAt: '2026-10-08T13:26:00.000Z',
      updatedAt: '2026-10-08T13:26:00.000Z'
    }));
  });

  await page.reload();
  await ensureRussian(page);
  await page.getByText('Поездка', { exact: true }).last().click();

  await expect(page.getByText('DAY COMPOSER · V2', { exact: true })).toBeVisible();
  await expect(page.getByText('Новая Третьяковка', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('LIVE EVIDENCE REPLAY · FRESH · OPEN · NOT CURRENT', { exact: true })).toBeVisible();
  await expect(page.getByText('OPEN · next 21:00', { exact: true })).toBeVisible();
  await expect(page.getByText(/Государственная Третьяковская галерея · 2026-10-08T13:25:33.145Z/)).toBeVisible();
});


test('Day Composer replays real Tretyakov programme status with explicit not-current disclosure', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.localStorage.setItem('moscow:v1:personal-trip', JSON.stringify({
      schemaVersion: 1,
      id: 'live-programme-evidence-replay:tretyakov-2026-10-08',
      destinationId: 'moscow',
      title: 'Tretyakov programme evidence replay',
      startDate: '2026-10-08',
      endDate: '2026-10-08',
      days: ['2026-10-08'],
      items: [{
        id: 'bogolyubov',
        dayDate: '2026-10-08',
        title: 'Алексей Боголюбов. От Невы до Босфора',
        kind: 'exhibition',
        source: 'provider',
        destinationNodeId: 'tretyakov-aleksey-bogolyubov-neva-bosporus',
        plannedStartAt: '2026-10-08T18:00:00+03:00',
        plannedEndAt: '2026-10-08T20:00:00+03:00',
        status: 'planned'
      }],
      visits: [],
      createdAt: '2026-10-08T15:25:00.000Z',
      updatedAt: '2026-10-08T15:25:00.000Z'
    }));
  });

  await page.reload();
  await ensureRussian(page);
  await page.getByText('Поездка', { exact: true }).last().click();

  await expect(page.getByText('DAY COMPOSER · V2', { exact: true })).toBeVisible();
  await expect(page.getByText('Алексей Боголюбов. От Невы до Босфора', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('LIVE EVIDENCE REPLAY · FRESH · SCHEDULED · NOT CURRENT', { exact: true })).toBeVisible();
  await expect(page.getByText('PROGRAMME · SCHEDULED · 29.09.2026 → 06.06.2027', { exact: true })).toBeVisible();
  await expect(page.getByText(/Государственная Третьяковская галерея · выставки · 2026-10-08T15:24:28.881Z/)).toBeVisible();
});


test('Day Composer consumes current live truth from runtime snapshot endpoint without replay mode', async ({ page }) => {
  await page.addInitScript(() => {
    (globalThis as { __MOSCOW_LIVE_CITY_SNAPSHOT_URL__?: string })
      .__MOSCOW_LIVE_CITY_SNAPSHOT_URL__ = 'https://live-city.test/live-city/current.json';
  });

  await page.route('https://live-city.test/live-city/current.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        schemaVersion: 1,
        kind: 'live-city-current-snapshot',
        destinationId: 'moscow',
        refreshedAt: '2026-10-08T15:45:04.572Z',
        mergedFeed: {
          schemaVersion: 1,
          destinationId: 'moscow',
          generatedAt: '2026-10-08T15:45:04.572Z',
          providers: [{
            id: 'tretyakov-official',
            name: 'Государственная Третьяковская галерея',
            relationship: 'official',
            capabilities: ['inventory', 'operational-status', 'opening-hours'],
            sourceUrl: 'https://www.tretyakovgallery.ru/for-visitors/museums/novaya-tretyakovka/',
            attributionRu: 'Источник: Государственная Третьяковская галерея',
            attributionEn: 'Source: State Tretyakov Gallery',
            attributionZh: '来源：国立特列季亚科夫画廊'
          }],
          entities: [{
            id: 'new-tretyakov-live',
            providerEntityId: 'new-tretyakov',
            providerId: 'tretyakov-official',
            canonicalDestinationNodeId: 'new-tretyakov',
            kind: 'museum',
            titleRu: 'Новая Третьяковка',
            titleEn: 'New Tretyakov',
            titleZh: '新特列季亚科夫画廊',
            tags: ['музей', 'искусство'],
            sourceUrl: 'https://www.tretyakovgallery.ru/for-visitors/museums/novaya-tretyakovka/',
            observedAt: '2020-01-01T00:00:00.000Z',
            expiresAt: '2099-12-31T23:59:59.000Z',
            operationalStatus: 'open',
            openingHours: {
              timezone: 'Europe/Moscow',
              windows: [{
                opensAt: '2020-01-01T00:00:00+03:00',
                closesAt: '2099-12-31T23:59:59+03:00'
              }]
            }
          }]
        }
      })
    });
  });

  await page.goto('/');

  await page.evaluate(() => {
    window.localStorage.setItem('moscow:v1:personal-trip', JSON.stringify({
      schemaVersion: 1,
      id: 'personal-trip:current-live',
      destinationId: 'moscow',
      title: 'Current live truth trip',
      startDate: '2026-10-08',
      endDate: '2026-10-08',
      days: ['2026-10-08'],
      items: [{
        id: 'tretyakov-current',
        dayDate: '2026-10-08',
        title: 'Новая Третьяковка',
        kind: 'museum',
        source: 'provider',
        destinationNodeId: 'new-tretyakov',
        plannedStartAt: '2026-10-08T17:00:00+03:00',
        plannedEndAt: '2026-10-08T19:00:00+03:00',
        status: 'planned'
      }],
      visits: [],
      createdAt: '2026-10-08T15:40:00.000Z',
      updatedAt: '2026-10-08T15:40:00.000Z'
    }));
  });

  await page.reload();
  await ensureRussian(page);
  await page.getByText('Поездка', { exact: true }).last().click();

  await expect(page.getByText('DAY COMPOSER · V2', { exact: true })).toBeVisible();
  await expect(page.getByText('Новая Третьяковка', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('LIVE · FRESH · OPEN', { exact: true })).toBeVisible();
  await expect(page.getByText(/Государственная Третьяковская галерея · 2020-01-01T00:00:00.000Z/)).toBeVisible();
  await expect(page.getByText(/EVIDENCE REPLAY/)).toHaveCount(0);
  await expect(page.getByText(/NOT CURRENT/)).toHaveCount(0);
});


test('current live disruption surfaces replan-required without moving fixed commitments', async ({ page }) => {
  await page.addInitScript(() => {
    (globalThis as { __MOSCOW_LIVE_CITY_SNAPSHOT_URL__?: string })
      .__MOSCOW_LIVE_CITY_SNAPSHOT_URL__ = 'https://live-city.test/live-city/current.json';
  });

  await page.route('https://live-city.test/live-city/current.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        schemaVersion: 1,
        kind: 'live-city-current-snapshot',
        destinationId: 'moscow',
        refreshedAt: new Date().toISOString(),
        mergedFeed: {
          schemaVersion: 1,
          destinationId: 'moscow',
          generatedAt: new Date().toISOString(),
          providers: [{
            id: 'tretyakov-official',
            name: 'Государственная Третьяковская галерея',
            relationship: 'official',
            capabilities: ['inventory', 'operational-status', 'opening-hours'],
            sourceUrl: 'https://www.tretyakovgallery.ru/for-visitors/museums/novaya-tretyakovka/',
            attributionRu: 'Источник',
            attributionEn: 'Source',
            attributionZh: '来源'
          }],
          entities: [{
            id: 'new-tretyakov-live',
            providerEntityId: 'new-tretyakov',
            providerId: 'tretyakov-official',
            canonicalDestinationNodeId: 'new-tretyakov',
            kind: 'museum',
            titleRu: 'Новая Третьяковка',
            titleEn: 'New Tretyakov',
            titleZh: '新特列季亚科夫画廊',
            tags: ['museum'],
            sourceUrl: 'https://www.tretyakovgallery.ru/for-visitors/museums/novaya-tretyakovka/',
            observedAt: new Date(Date.now() - 30_000).toISOString(),
            expiresAt: new Date(Date.now() + 20 * 60_000).toISOString(),
            operationalStatus: 'closed'
          }]
        }
      })
    });
  });

  const date = moscowNowParts().date;
  await page.goto('/');

  await page.evaluate((dayDate) => {
    window.localStorage.setItem('moscow:v1:personal-trip', JSON.stringify({
      schemaVersion: 1,
      id: 'personal-trip:live-disruption',
      destinationId: 'moscow',
      title: 'Live disruption trip',
      startDate: dayDate,
      endDate: dayDate,
      days: [dayDate],
      items: [{
        id: 'tretyakov',
        dayDate,
        title: 'Новая Третьяковка',
        kind: 'museum',
        source: 'provider',
        destinationNodeId: 'new-tretyakov',
        plannedStartAt: dayDate + 'T12:00:00+03:00',
        plannedEndAt: dayDate + 'T14:00:00+03:00',
        status: 'planned'
      }, {
        id: 'fixed-theatre',
        dayDate,
        title: 'Большой театр · фиксированный билет',
        kind: 'theatre',
        source: 'manual',
        plannedStartAt: dayDate + 'T19:00:00+03:00',
        plannedEndAt: dayDate + 'T22:00:00+03:00',
        status: 'planned',
        commitment: {
          kind: 'ticket',
          status: 'confirmed',
          verification: 'user-declared',
          reference: 'USER-TICKET'
        }
      }],
      visits: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }, date);

  await page.reload();
  await ensureRussian(page);
  await page.getByText('Поездка', { exact: true }).last().click();

  await expect(page.getByText('LIVE DISRUPTION · REPLAN REQUIRED', { exact: true })).toBeVisible();
  await expect(page.getByText(/REPLAN REQUIRED · ЗАКРЫТО/)).toBeVisible();
  await expect(page.getByText('Новая Третьяковка', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/19:00–22:00 · Большой театр · фиксированный билет/)).toBeVisible();

  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem('moscow:v1:personal-trip') || '{}'));
  const fixed = stored.items.find((item: { id: string }) => item.id === 'fixed-theatre');
  expect(fixed.plannedStartAt).toBe(date + 'T19:00:00+03:00');
  expect(fixed.plannedEndAt).toBe(date + 'T22:00:00+03:00');
});


test('source-backed replacement stays blocked in browser until routing around fixed commitment is verified', async ({ page }) => {
  await page.addInitScript(() => {
    (globalThis as { __MOSCOW_LIVE_CITY_SNAPSHOT_URL__?: string })
      .__MOSCOW_LIVE_CITY_SNAPSHOT_URL__ = 'https://live-city.test/live-city/current.json';
  });

  await page.route('https://live-city.test/live-city/current.json', async (route) => {
    const now = Date.now();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        schemaVersion: 1,
        kind: 'live-city-current-snapshot',
        destinationId: 'moscow',
        refreshedAt: new Date(now).toISOString(),
        mergedFeed: {
          schemaVersion: 1,
          destinationId: 'moscow',
          generatedAt: new Date(now).toISOString(),
          providers: [{
            id: 'affected-source',
            name: 'Affected Source',
            relationship: 'official',
            capabilities: ['inventory', 'operational-status'],
            sourceUrl: 'https://example.org/affected',
            attributionRu: 'Источник',
            attributionEn: 'Source',
            attributionZh: '来源'
          }, {
            id: 'candidate-source',
            name: 'Candidate Source',
            relationship: 'official',
            capabilities: ['inventory', 'operational-status'],
            sourceUrl: 'https://example.org/candidate',
            attributionRu: 'Источник',
            attributionEn: 'Source',
            attributionZh: '来源'
          }],
          entities: [{
            id: 'affected-live',
            providerEntityId: 'affected-museum',
            providerId: 'affected-source',
            canonicalDestinationNodeId: 'affected-museum',
            kind: 'museum',
            titleRu: 'Закрывшийся музей',
            titleEn: 'Closed museum',
            titleZh: '关闭的博物馆',
            tags: ['museum'],
            sourceUrl: 'https://example.org/affected/museum',
            observedAt: new Date(now - 30_000).toISOString(),
            expiresAt: new Date(now + 20 * 60_000).toISOString(),
            operationalStatus: 'closed'
          }, {
            id: 'candidate-live',
            providerEntityId: 'candidate-museum',
            providerId: 'candidate-source',
            canonicalDestinationNodeId: 'candidate-museum',
            kind: 'museum',
            titleRu: 'Музей-кандидат',
            titleEn: 'Candidate museum',
            titleZh: '候选博物馆',
            tags: ['museum'],
            sourceUrl: 'https://example.org/candidate/museum',
            observedAt: new Date(now - 20_000).toISOString(),
            expiresAt: new Date(now + 20 * 60_000).toISOString(),
            operationalStatus: 'open'
          }]
        }
      })
    });
  });

  const date = moscowNowParts().date;
  await page.goto('/');

  await page.evaluate((dayDate) => {
    window.localStorage.setItem('moscow:v1:personal-trip', JSON.stringify({
      schemaVersion: 1,
      id: 'personal-trip:replacement-unverified',
      destinationId: 'moscow',
      title: 'Replacement candidate trip',
      startDate: dayDate,
      endDate: dayDate,
      days: [dayDate],
      items: [{
        id: 'affected',
        dayDate,
        title: 'Закрывшийся музей',
        kind: 'museum',
        source: 'provider',
        destinationNodeId: 'affected-museum',
        plannedStartAt: dayDate + 'T12:00:00+03:00',
        plannedEndAt: dayDate + 'T14:00:00+03:00',
        status: 'planned'
      }, {
        id: 'fixed-theatre',
        dayDate,
        title: 'Большой театр · фиксированный билет',
        kind: 'theatre',
        source: 'manual',
        plannedStartAt: dayDate + 'T19:00:00+03:00',
        plannedEndAt: dayDate + 'T22:00:00+03:00',
        status: 'planned',
        commitment: {
          kind: 'ticket',
          status: 'confirmed',
          verification: 'user-declared',
          reference: 'USER-TICKET'
        }
      }],
      visits: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }, date);

  await page.reload();
  await ensureRussian(page);
  await page.getByText('Поездка', { exact: true }).last().click();

  await expect(page.getByText('LIVE DISRUPTION · REPLAN REQUIRED', { exact: true })).toBeVisible();
  await expect(page.getByText('SOURCE-BACKED REPLACEMENT · V1', { exact: true })).toBeVisible();
  await expect(page.getByText('Музей-кандидат', { exact: true })).toBeVisible();
  await expect(page.getByText('ROUTING UNVERIFIED', { exact: true })).toBeVisible();
  await expect(page.getByText('Проверить маршрут', { exact: true })).toBeVisible();
  await expect(page.getByText('Принять замену', { exact: true })).toHaveCount(0);

  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem('moscow:v1:personal-trip') || '{}'));
  expect(stored.items.find((item: { id: string }) => item.id === 'affected').destinationNodeId).toBe('affected-museum');
  expect(stored.items.find((item: { id: string }) => item.id === 'fixed-theatre').plannedStartAt)
    .toBe(date + 'T19:00:00+03:00');
});


test('source-backed replacement becomes executable after current route verification and explicit acceptance', async ({ page }) => {
  await page.addInitScript(() => {
    (globalThis as {
      __MOSCOW_LIVE_CITY_SNAPSHOT_URL__?: string;
      __MOSCOW_CURRENT_ROUTING_URL__?: string;
    }).__MOSCOW_LIVE_CITY_SNAPSHOT_URL__ =
      'https://live-city.test/live-city/current.json';
    (globalThis as {
      __MOSCOW_CURRENT_ROUTING_URL__?: string;
    }).__MOSCOW_CURRENT_ROUTING_URL__ =
      'https://live-city.test/routing/walk';
  });

  await page.route('https://live-city.test/live-city/current.json', async (route) => {
    const now = Date.now();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        schemaVersion: 1,
        kind: 'live-city-current-snapshot',
        destinationId: 'moscow',
        refreshedAt: new Date(now).toISOString(),
        mergedFeed: {
          schemaVersion: 1,
          destinationId: 'moscow',
          generatedAt: new Date(now).toISOString(),
          providers: [{
            id: 'tretyakov-official',
            name: 'Государственная Третьяковская галерея',
            relationship: 'official',
            capabilities: ['inventory', 'operational-status'],
            sourceUrl: 'https://www.tretyakovgallery.ru/for-visitors/museums/novaya-tretyakovka/',
            attributionRu: 'Источник',
            attributionEn: 'Source',
            attributionZh: '来源'
          }, {
            id: 'tretyakov-programme-official',
            name: 'Государственная Третьяковская галерея · выставки',
            relationship: 'official',
            capabilities: ['inventory', 'event-schedule', 'operational-status'],
            sourceUrl: 'https://www.tretyakovgallery.ru/exhibitions/o/aleksey-bogolyubov-ot-nevy-do-bosfora/',
            attributionRu: 'Источник',
            attributionEn: 'Source',
            attributionZh: '来源'
          }],
          entities: [{
            id: 'new-tretyakov-live',
            providerEntityId: 'new-tretyakov',
            providerId: 'tretyakov-official',
            canonicalDestinationNodeId: 'new-tretyakov',
            kind: 'museum',
            titleRu: 'Новая Третьяковка',
            titleEn: 'New Tretyakov',
            titleZh: '新特列季亚科夫画廊',
            tags: ['museum'],
            sourceUrl: 'https://www.tretyakovgallery.ru/for-visitors/museums/novaya-tretyakovka/',
            observedAt: new Date(now - 20_000).toISOString(),
            expiresAt: new Date(now + 20 * 60_000).toISOString(),
            operationalStatus: 'closed'
          }, {
            id: 'bogolyubov-live',
            providerEntityId: 'aleksey-bogolyubov-neva-bosporus',
            providerId: 'tretyakov-programme-official',
            canonicalDestinationNodeId: 'tretyakov-aleksey-bogolyubov-neva-bosporus',
            kind: 'exhibition',
            titleRu: 'Алексей Боголюбов. От Невы до Босфора',
            titleEn: 'Alexey Bogolyubov. From the Neva to the Bosphorus',
            titleZh: '阿列克谢·博戈柳博夫：从涅瓦河到博斯普鲁斯海峡',
            tags: ['exhibition', 'art'],
            sourceUrl: 'https://www.tretyakovgallery.ru/exhibitions/o/aleksey-bogolyubov-ot-nevy-do-bosfora/',
            observedAt: new Date(now - 15_000).toISOString(),
            expiresAt: new Date(now + 20 * 60_000).toISOString(),
            operationalStatus: 'scheduled',
            startsAt: '2026-09-29T00:00:00+03:00',
            endsAt: '2027-06-06T23:59:59+03:00'
          }]
        }
      })
    });
  });

  await page.route(/https:\/\/live-city\.test\/routing\/walk\?.*/, async (route) => {
    const requestUrl = new URL(route.request().url());
    expect(requestUrl.searchParams.get('fromId'))
      .toBe('tretyakov-aleksey-bogolyubov-neva-bosporus');
    expect(requestUrl.searchParams.get('fromLat')).toBe('55.7413613');
    expect(requestUrl.searchParams.get('fromLon')).toBe('37.6202196');
    expect(requestUrl.searchParams.get('toId')).toBe('bolshoi-theatre');
    expect(requestUrl.searchParams.get('toLat')).toBe('55.7601296');
    expect(requestUrl.searchParams.get('toLon')).toBe('37.6186118');

    const now = new Date();
    const observedAt = new Date(now.getTime() - 5_000).toISOString();
    const expiresAt = new Date(now.getTime() + 15 * 60_000).toISOString();

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        schemaVersion: 1,
        kind: 'citywide-routing-current-snapshot',
        destinationId: 'moscow',
        fetchedAt: observedAt,
        rawResponseSha256: 'd'.repeat(64),
        request: {
          mode: 'walk',
          from: {
            id: 'tretyakov-aleksey-bogolyubov-neva-bosporus',
            latitude: 55.7413613,
            longitude: 37.6202196
          },
          to: {
            id: 'bolshoi-theatre',
            latitude: 55.7601296,
            longitude: 37.6186118
          }
        },
        feed: {
          schemaVersion: 1,
          destinationId: 'moscow',
          generatedAt: observedAt,
          providers: [{
            id: 'valhalla',
            name: 'Valhalla',
            relationship: 'routing-provider',
            sourceUrl: 'https://valhalla1.openstreetmap.de'
          }],
          observations: [{
            id: 'valhalla:candidate-to-bolshoi',
            providerId: 'valhalla',
            from: {
              id: 'tretyakov-aleksey-bogolyubov-neva-bosporus',
              latitude: 55.7413613,
              longitude: 37.6202196
            },
            to: {
              id: 'bolshoi-theatre',
              latitude: 55.7601296,
              longitude: 37.6186118
            },
            mode: 'walk',
            durationMinutes: 36,
            distanceMeters: 2781,
            observedAt,
            expiresAt,
            sourceUrl: 'https://valhalla1.openstreetmap.de/route'
          }]
        }
      })
    });
  });

  const date = '2026-10-11';
  await page.goto('/');

  await page.evaluate((dayDate) => {
    window.localStorage.setItem('moscow:v1:personal-trip', JSON.stringify({
      schemaVersion: 1,
      id: 'personal-trip:replacement-acceptance',
      destinationId: 'moscow',
      title: 'Executable replacement trip',
      startDate: dayDate,
      endDate: dayDate,
      days: [dayDate],
      items: [{
        id: 'affected',
        dayDate,
        title: 'Новая Третьяковка',
        kind: 'museum',
        source: 'provider',
        destinationNodeId: 'new-tretyakov',
        plannedStartAt: dayDate + 'T12:00:00+03:00',
        plannedEndAt: dayDate + 'T14:00:00+03:00',
        status: 'planned'
      }, {
        id: 'fixed-theatre',
        dayDate,
        title: 'Большой театр · фиксированный билет',
        kind: 'theatre',
        source: 'manual',
        destinationNodeId: 'bolshoi-theatre',
        plannedStartAt: dayDate + 'T19:00:00+03:00',
        plannedEndAt: dayDate + 'T22:00:00+03:00',
        status: 'planned',
        commitment: {
          kind: 'ticket',
          status: 'confirmed',
          verification: 'user-declared',
          reference: 'USER-TICKET'
        }
      }],
      visits: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }, date);

  await page.reload();
  await ensureRussian(page);
  await page.getByText('Поездка', { exact: true }).last().click();

  await expect(page.getByText('LIVE DISRUPTION · REPLAN REQUIRED', { exact: true })).toBeVisible();
  await expect(page.getByText('Алексей Боголюбов. От Невы до Босфора', { exact: true })).toBeVisible();
  await expect(page.getByText('ROUTING UNVERIFIED', { exact: true })).toBeVisible();

  await page.getByText('Проверить маршрут', { exact: true }).click();

  await expect(page.getByText('EXECUTABLE', { exact: true })).toBeVisible();
  await expect(page.getByText(/OUT · SAFE · 36 мин/)).toBeVisible();
  await expect(page.getByText('Принять замену', { exact: true })).toBeVisible();

  await page.getByText('Принять замену', { exact: true }).click();

  const replacementError = page.getByTestId('replacement-action-error');
  if (await replacementError.count()) {
    throw new Error(`Replacement acceptance UI error: ${await replacementError.textContent()}`);
  }

  await expect(page.getByText('LIVE DISRUPTION · REPLAN REQUIRED', { exact: true })).toHaveCount(0);

  const stored = await page.evaluate(() => JSON.parse(
    window.localStorage.getItem('moscow:v1:personal-trip') || '{}'
  ));

  const affected = stored.items.find((item: { id: string }) => item.id === 'affected');
  const fixed = stored.items.find((item: { id: string }) => item.id === 'fixed-theatre');

  expect(affected.title).toBe('Алексей Боголюбов. От Невы до Босфора');
  expect(affected.destinationNodeId)
    .toBe('tretyakov-aleksey-bogolyubov-neva-bosporus');
  expect(affected.plannedStartAt).toBe(date + 'T12:00:00+03:00');
  expect(affected.plannedEndAt).toBe(date + 'T14:00:00+03:00');

  expect(fixed.title).toBe('Большой театр · фиксированный билет');
  expect(fixed.destinationNodeId).toBe('bolshoi-theatre');
  expect(fixed.plannedStartAt).toBe(date + 'T19:00:00+03:00');
  expect(fixed.plannedEndAt).toBe(date + 'T22:00:00+03:00');
  expect(fixed.commitment.reference).toBe('USER-TICKET');

  expect(stored.replacementReceipts).toHaveLength(1);
  expect(stored.replacementReceipts[0].before.title).toBe('Новая Третьяковка');
  expect(stored.replacementReceipts[0].after.title).toBe('Алексей Боголюбов. От Невы до Босфора');
  expect(stored.replacementReceipts[0].fixedCommitmentsPreserved).toBe(true);
  await expect(page.getByText('История изменений маршрута', { exact: true })).toBeVisible();
  await expect(page.getByText(/Следующий билет или бронь: 19:00 · Большой театр/)).toBeVisible();

  await page.reload();
  await ensureRussian(page);
  await expect(page.getByText('История изменений маршрута', { exact: true })).toBeVisible();
  await expect(page.getByText('Новая Третьяковка', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Алексей Боголюбов. От Невы до Босфора', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Следующий билет или бронь: 19:00 · Большой театр/)).toBeVisible();
  const persisted = await page.evaluate(() => JSON.parse(window.localStorage.getItem('moscow:v1:personal-trip') || '{}'));
  expect(persisted.replacementReceipts).toHaveLength(1);
  expect(persisted.items.find((item: { id: string }) => item.id === 'fixed-theatre').commitment.reference).toBe('USER-TICKET');
});


test('Moscow Passport 2.0 filters cross-trip diary by category, notes and inclusive dates', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const active = {
      schemaVersion: 1,
      id: 'passport-autumn',
      destinationId: 'moscow',
      title: 'Осенняя Москва',
      startDate: '2026-10-13', endDate: '2026-10-13', days: ['2026-10-13'],
      items: [],
      visits: [{
        id: 'autumn-dinner', dayDate: '2026-10-13',
        visitedAt: '2026-10-13T18:30:00+03:00',
        title: 'Ужин на Тверской', kind: 'food',
        evidence: 'user-confirmed', note: 'Интересное меню'
      }],
      createdAt: '2026-10-13T08:00:00.000Z',
      updatedAt: '2026-10-13T18:35:00.000Z'
    };
    const previous = {
      schemaVersion: 1, id: 'passport-summer', destinationId: 'moscow',
      title: 'Летняя Москва',
      startDate: '2026-06-05', endDate: '2026-06-05', days: ['2026-06-05'],
      items: [],
      visits: [{
        id: 'summer-museum', dayDate: '2026-06-05',
        visitedAt: '2026-06-05T12:10:00+03:00',
        title: 'Музей на Варварке', kind: 'museum',
        destinationNodeId: 'romanov-chambers',
        evidence: 'user-confirmed', note: 'Исторический двор'
      }],
      createdAt: '2026-06-05T08:00:00.000Z',
      updatedAt: '2026-06-05T12:15:00.000Z'
    };
    window.localStorage.setItem('moscow:v1:personal-trip', JSON.stringify(active));
    window.localStorage.setItem('moscow:v1:personal-trip-archive', JSON.stringify({
      schemaVersion: 1, trips: [previous]
    }));
  });
  await page.reload();
  await ensureRussian(page);
  await page.getByText('Поездка', { exact: true }).last().click();

  await expect(page.getByText('История всех поездок', { exact: true })).toBeVisible();
  await expect(page.getByText('2', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Показать историю посещений по всем поездкам' }).click();
  await expect(page.getByText('Найдено посещений: 2', { exact: true })).toBeVisible();
  await expect(page.getByText('Ужин на Тверской', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('Музей на Варварке', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Фильтр категории: Где ел' }).click();
  await expect(page.getByText('Найдено посещений: 1', { exact: true })).toBeVisible();
  await expect(page.getByText('Музей на Варварке', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Фильтр категории: Все' }).click();
  const search = page.getByLabel('Поиск по истории Москвы');
  await search.fill('исторический двор');
  await expect(page.getByText('Найдено посещений: 1', { exact: true })).toBeVisible();
  await expect(page.getByText('Музей на Варварке', { exact: true })).toBeVisible();

  await search.fill('');
  await page.getByLabel('Дата посещения с').fill('2026-06-05');
  await page.getByLabel('Дата посещения по').fill('2026-06-05');
  await expect(page.getByText('Найдено посещений: 1', { exact: true })).toBeVisible();
  await page.getByLabel('Дата посещения с').fill('2026-02-30');
  await expect(page.getByText(/Проверьте даты: формат/)).toBeVisible();

  await page.getByRole('button', { name: 'Сбросить фильтры истории' }).click();
  await expect(page.getByText('Найдено посещений: 2', { exact: true })).toBeVisible();
});


test('Next Discoveries uses past venue IDs, adds source-backed idea to selected day without booking', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const current = {
      schemaVersion: 1, id: 'discovery-current', destinationId: 'moscow',
      title: 'Осень в Москве', startDate: '2026-10-13', endDate: '2026-10-14',
      days: ['2026-10-13', '2026-10-14'],
      items: [{
        id: 'already-planned-park', dayDate: '2026-10-13',
        title: 'Парк Горького', kind: 'park', source: 'manual',
        catalogPlaceId: 'gorky-park', officialSourceUrl: 'https://parkgorkogo.ru/contacts/',
        status: 'planned'
      }],
      visits: [],
      createdAt: '2026-10-13T08:00:00.000Z',
      updatedAt: '2026-10-13T08:00:00.000Z'
    };
    const past = {
      schemaVersion: 1, id: 'discovery-past', destinationId: 'moscow',
      title: 'Летняя Москва', startDate: '2026-06-05', endDate: '2026-06-05',
      days: ['2026-06-05'],
      items: [{
        id: 'visited-art', dayDate: '2026-06-05',
        title: 'Третьяковская галерея', kind: 'museum', source: 'manual',
        catalogPlaceId: 'tretyakov-lavrushinsky',
        officialSourceUrl: 'https://www.tretyakovgallery.ru/for-visitors/museums/istoricheskoe-zdanie/',
        status: 'completed'
      }],
      visits: [{
        id: 'visited-art-record', itemId: 'visited-art', dayDate: '2026-06-05',
        title: 'Третьяковская галерея', kind: 'museum',
        visitedAt: '2026-06-05T12:00:00+03:00', evidence: 'user-confirmed'
      }],
      createdAt: '2026-06-05T08:00:00.000Z',
      updatedAt: '2026-06-05T12:00:00.000Z'
    };
    window.localStorage.setItem('moscow:v1:personal-trip', JSON.stringify(current));
    window.localStorage.setItem('moscow:v1:personal-trip-archive', JSON.stringify({
      schemaVersion: 1, trips: [past]
    }));
  });
  await page.reload();
  await ensureRussian(page);
  await page.getByRole('tab', { name: 'Поездка' }).click();

  const discoveries = page.getByTestId('moscow-next-discoveries');
  await expect(discoveries.getByText('Что добавить в поездку?', { exact: true })).toBeVisible();
  await expect(discoveries.getByText(/Это не подтверждение, что вы никогда здесь не были/)).toBeVisible();
  await expect(discoveries.getByRole('button', {
    name: 'Добавить место в выбранный день: Третьяковская галерея'
  })).toHaveCount(0);
  await expect(discoveries.getByRole('button', {
    name: 'Добавить место в выбранный день: Парк Горького'
  })).toHaveCount(0);

  await page.getByText('День 2', { exact: true }).click();
  await expect(discoveries.getByText('Добавление в день: 2026-10-14', { exact: true })).toBeVisible();
  await discoveries.getByRole('button', { name: 'Идеи: Рестораны' }).click();
  await expect(discoveries.getByRole('button', {
    name: 'Добавить место в выбранный день: Кафе Пушкинъ'
  })).toBeVisible();
  await discoveries.getByRole('button', {
    name: 'Добавить место в выбранный день: Кафе Пушкинъ'
  }).click();

  await expect(discoveries.getByRole('button', {
    name: 'Добавить место в выбранный день: Кафе Пушкинъ'
  })).toHaveCount(0);
  await expect.poll(async () => await page.evaluate(() => {
    const raw = window.localStorage.getItem('moscow:v1:personal-trip');
    const trip = raw ? JSON.parse(raw) : { items: [] };
    return trip.items.filter((item: { catalogPlaceId?: string }) => item.catalogPlaceId === 'cafe-pushkin-tverskoy').length;
  })).toBe(1);

  await page.reload();
  await ensureRussian(page);
  await page.getByRole('tab', { name: 'Поездка' }).click();
  const trip = await page.evaluate(() => JSON.parse(window.localStorage.getItem('moscow:v1:personal-trip') || '{}'));
  const added = trip.items.find((item: { catalogPlaceId?: string }) => item.catalogPlaceId === 'cafe-pushkin-tverskoy');
  expect(added?.dayDate).toBe('2026-10-14');
  expect(added?.commitment).toBeUndefined();
  expect(added?.plannedStartAt).toBeUndefined();
  expect(added?.officialSourceUrl).toBe('https://cafe-pushkin.ru/');
  await expect(page.getByTestId('moscow-next-discoveries').getByRole('button', {
    name: 'Добавить место в выбранный день: Кафе Пушкинъ'
  })).toHaveCount(0);
});
