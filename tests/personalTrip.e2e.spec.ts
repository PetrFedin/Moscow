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

  await page.reload();
  await ensureRussian(page);
  await expect(page.getByText('Большой театр · мой билет', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Добавлено вами · не проверено провайдером', { exact: true })).toBeVisible();
  await expect(page.getByText('МОЯ ИСТОРИЯ МОСКВЫ', { exact: true })).toBeVisible();
  await expect(page.getByText(/отмечено вами/)).toBeVisible();
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
