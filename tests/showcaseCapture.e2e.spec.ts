import { expect, test, type Browser, type Page, type TestInfo } from '@playwright/test';
import { copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Evidentiary media for a LIVE RUNNING Expo web application in CI.
 * NOT a production capture, native-device recording or supplier-confirmed booking.
 * All visitor content is synthetic and entered through the real UI.
 */
const ROOT = path.resolve(process.cwd(), 'showcase-evidence');

function moscowTomorrow(): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const part = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  const today = part('year') + '-' + part('month') + '-' + part('day');
  const date = new Date(today + 'T12:00:00.000Z');
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

async function russian(page: Page) {
  const en = page.getByText('EN', { exact: true });
  if (await en.count() && await en.first().isVisible().catch(() => false)) await en.first().click();
}

async function still(page: Page, profile: string, name: string, pauseMs = 2100) {
  const destination = path.join(ROOT, 'screenshots', profile);
  mkdirSync(destination, { recursive: true });
  await page.screenshot({ path: path.join(destination, name + '.png'), animations: 'disabled', caret: 'hide' });
  await page.waitForTimeout(pauseMs);
}

async function filmed(browser: Browser, testInfo: TestInfo, profile: 'mobile-375' | 'desktop-1440' | 'services-375',
  story: (page: Page) => Promise<void>) {
  test.setTimeout(100_000);
  const mobile = profile !== 'desktop-1440';
  const videoDir = path.join(ROOT, 'raw');
  const output = path.join(ROOT, 'videos');
  mkdirSync(videoDir, { recursive: true });
  mkdirSync(output, { recursive: true });
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:3000',
    locale: 'ru-RU',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    viewport: mobile ? { width: 375, height: 812 } : { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: videoDir,
      size: mobile ? { width: 375, height: 812 } : { width: 1440, height: 900 }
    }
  });
  const page = await context.newPage();
  const startMs = Date.now();
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await russian(page);
    await story(page);
    // Shoot at least ~26 seconds so conversion can produce a consistent 25s clip.
    const remaining = 26_200 - (Date.now() - startMs);
    if (remaining > 0) await page.waitForTimeout(remaining);
  } finally {
    await context.close();
    const videoFile = await page.video()?.path();
    if (videoFile) copyFileSync(videoFile, path.join(output, profile + '-session.webm'));
  }
  // A failed Playwright assertion prevents a package from being marked accepted.
  await testInfo.attach(profile + '-source', {
    path: path.join(output, profile + '-session.webm'), contentType: 'video/webm'
  });
}

test('record presentation walkthrough: real mobile visitor trip', async ({ browser }, testInfo) => {
  await filmed(browser, testInfo, 'mobile-375', async (page) => {
    await expect(page.getByRole('button', { name: 'Спланировать поездку' })).toBeVisible();
    await still(page, 'mobile-375', '01-discover');
    await page.getByRole('button', { name: 'Спланировать поездку' }).click();
    await expect(page.getByText('Соберите Москву по дням', { exact: true })).toBeVisible();
    await still(page, 'mobile-375', '02-create-trip');
    await page.getByPlaceholder('2026-10-02').fill(moscowTomorrow());
    await page.getByText('2', { exact: true }).click();
    await page.getByText('Создать поездку', { exact: true }).click();
    await expect(page.getByText('День 1', { exact: true })).toBeVisible();
    await still(page, 'mobile-375', '03-trip-today');
    await page.getByText('+ Добавить', { exact: true }).click();
    await page.getByPlaceholder('Например: Большой театр').fill('Большой театр · демонстрационный билет');
    await page.getByText('Театр', { exact: true }).click();
    await page.getByText('Билет', { exact: true }).click();
    await page.getByText('Добавить в день', { exact: true }).click();
    await expect(page.getByText('Большой театр · демонстрационный билет', { exact: true }).first()).toBeVisible();
    await still(page, 'mobile-375', '04-user-declared-ticket');
    await page.getByText('Я был здесь', { exact: true }).click();
    await expect(page.getByText('МОЯ ИСТОРИЯ МОСКВЫ', { exact: true })).toBeVisible();
    await still(page, 'mobile-375', '05-personal-passport');
    await page.reload();
    await russian(page);
    await expect(page.getByText('Большой театр · демонстрационный билет', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/отмечено вами/)).toBeVisible();
    await still(page, 'mobile-375', '06-reloaded-history', 1200);
  });
});

test('record presentation walkthrough: real desktop city discovery', async ({ browser }, testInfo) => {
  await filmed(browser, testInfo, 'desktop-1440', async (page) => {
    await expect(page.getByRole('button', { name: 'Спланировать поездку' })).toBeVisible();
    await still(page, 'desktop-1440', '01-discover', 2500);
    await page.getByRole('button', { name: 'Третьяковская галерея' }).click();
    await expect(page.getByRole('button', { name: 'Найти адрес на карте' })).toBeVisible();
    await still(page, 'desktop-1440', '02-city-place', 2600);
    await page.getByRole('button', { name: 'Главное за полчаса' }).click();
    await expect(page.getByText(/редакционная оценка, не подтверждённая навигация/)).toBeVisible();
    await still(page, 'desktop-1440', '03-short-walk', 2800);
    await page.getByRole('button', { name: 'Спланировать поездку' }).click();
    await expect(page.getByText('Соберите Москву по дням', { exact: true })).toBeVisible();
    await still(page, 'desktop-1440', '04-trip-entry', 2600);
    await page.getByPlaceholder('2026-10-02').fill(moscowTomorrow());
    await page.getByText('2', { exact: true }).click();
    await page.getByText('Создать поездку', { exact: true }).click();
    await expect(page.getByText('День 1', { exact: true })).toBeVisible();
    await still(page, 'desktop-1440', '05-trip-timeline', 2800);
    await page.getByText('+ Добавить', { exact: true }).click();
    await page.getByPlaceholder('Например: Большой театр').fill('Вечер в театре · демо');
    await page.getByText('Билет', { exact: true }).click();
    await page.getByText('Добавить в день', { exact: true }).click();
    await expect(page.getByText('Вечер в театре · демо', { exact: true }).first()).toBeVisible();
    await still(page, 'desktop-1440', '06-planned-ticket', 2000);
  });
});


test('record presentation walkthrough: source-controlled restaurant visit and personal booking', async ({ browser }, testInfo) => {
  await filmed(browser, testInfo, 'services-375', async (page) => {
    await expect(page.getByRole('button', { name: 'Рестораны', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Рестораны', exact: true }).click();
    await page.getByRole('button', { name: 'Кафе Пушкинъ', exact: true }).click();
    await still(page, 'services-375', '01-source-backed-restaurant', 1800);
    await page.getByRole('button', { name: 'Добавить место в поездку' }).click();
    await expect(page.getByText('Соберите Москву по дням', { exact: true })).toBeVisible();
    await page.getByPlaceholder('2026-10-02').fill(moscowTomorrow());
    await page.getByText('2', { exact: true }).click();
    await page.getByText('Создать поездку', { exact: true }).click();
    const intake = page.getByTestId('venue-service-intake');
    await expect(intake).toBeVisible();
    await still(page, 'services-375', '02-venue-in-trip', 1600);
    await intake.getByRole('button', { name: 'Открыть запись времени или билета' }).click();
    await intake.getByRole('button', { name: 'Уже есть мой билет или бронь' }).click();
    await intake.getByTestId('venue-service-party-size').fill('2');
    await intake.getByTestId('venue-service-reference').fill('DEMO-NO-SUPPLIER');
    await intake.scrollIntoViewIfNeeded();
    await still(page, 'services-375', '03-user-declared-booking', 2300);
    await intake.getByRole('button', {
      name: 'Сохранить в мою поездку без подтверждения поставщика'
    }).click();
    await expect(intake).toHaveCount(0);
    const wallet = page.getByTestId('travel-booking-wallet');
    await expect(wallet.getByText('Добавлено вами · поставщик не проверен', { exact: true })).toBeVisible();
    await wallet.scrollIntoViewIfNeeded();
    await still(page, 'services-375', '04-wallet-no-provider-proof', 2200);
  });
});
