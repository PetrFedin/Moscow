import { expect, test } from '@playwright/test';
import { parseMoscowStagingTarget } from '../src/travel/stagingAcceptanceTarget';
import { probeMoscowRelease } from '../src/travel/releaseCandidateProbe';

// Manual only. This test is NOT included in the regular quality workflow.
// A dedicated non-production Render service and its exact commit must exist.
const target = parseMoscowStagingTarget(process.env);
test.beforeAll(async () => {
  const report = await probeMoscowRelease(target);
  if (!report.acceptance.releaseReady) {
    throw new Error('Staging identity/readiness blocked: ' + JSON.stringify(report));
  }
});
test('isolated staging: create journey, preserve declared ticket and visit note after reload', async ({ page }) => {
  await page.goto(target.url);
  const en = page.getByText('EN', { exact: true });
  if (await en.count() && await en.first().isVisible().catch(() => false)) await en.first().click();
  await page.getByRole('tab', {name:'Поездка'}).click();
  const start = new Date(Date.now() + 86400000).toISOString().slice(0,10);
  await page.getByPlaceholder('2026-10-02').fill(start);
  await page.getByText('3', {exact:true}).click();
  await page.getByText('Создать поездку', {exact:true}).click();
  await expect(page.getByText('День 1', {exact:true})).toBeVisible();
  await page.getByText('+ Добавить', {exact:true}).click();
  await page.getByPlaceholder('Например: Большой театр').fill('Тестовый спектакль — staging');
  await page.getByText('Театр',{exact:true}).click();
  await page.getByText('Билет',{exact:true}).click();
  await page.getByText('Добавить в день',{exact:true}).click();
  await expect(page.getByText('Добавлено вами · не проверено провайдером',{exact:true})).toBeVisible();
  await page.getByText('Я был здесь',{exact:true}).click();
  await page.getByRole('button',{name:'Редактировать заметку: Тестовый спектакль — staging'}).click();
  await page.getByLabel('Текст личной заметки').fill('Проверка сохранения заметки в staging');
  await page.getByRole('button',{name:'Сохранить заметку'}).click();
  await expect.poll(async () => page.evaluate(() => {
    const raw=localStorage.getItem('moscow:v1:personal-trip');
    if(!raw) return false;
    const trip=JSON.parse(raw);
    return trip.items?.some((item:{title:string;commitment?:{verification:string}}) =>
      item.title==='Тестовый спектакль — staging'&&item.commitment?.verification==='user-declared')
      && trip.visits?.some((visit:{note?:string})=>visit.note==='Проверка сохранения заметки в staging');
  })).toBe(true);
  await page.reload();
  await expect(page.getByText('Тестовый спектакль — staging',{exact:true}).first()).toBeVisible();
  await expect(page.getByText('Проверка сохранения заметки в staging',{exact:true})).toBeVisible();
  await expect(page.getByText('Подтверждено провайдером',{exact:true})).toHaveCount(0);
});
