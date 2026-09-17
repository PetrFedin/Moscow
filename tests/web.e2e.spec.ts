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
  await expect(page.getByText('MOSCOW · TIME')).toBeVisible();
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

  // Second object must use the same story/time interaction language without borrowing Romanov assets.
  await page.getByText('Старый Английский двор', { exact: true }).first().click();
  await expect(page.getByText('Открыть историю', { exact: true })).toBeVisible();
  await page.getByText('Открыть историю', { exact: true }).click();
  await expect(page.getByText('Старый Английский двор', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('МАШИНА ВРЕМЕНИ', { exact: true })).toBeVisible();
  await expect(page.getByText('1556', { exact: true }).first()).toBeVisible();

  // The community slider web implementation is responder-driven: prove the same direct drag a user performs.
  const englishTimeSlider = page.locator('[aria-label="Выберите историческую эпоху"]');
  await expect(englishTimeSlider).toHaveCount(1);
  const englishTimeBox = await englishTimeSlider.boundingBox();
  expect(englishTimeBox).not.toBeNull();
  if (englishTimeBox) {
    const y = englishTimeBox.y + englishTimeBox.height / 2;
    await page.mouse.move(englishTimeBox.x + 15, y);
    await page.mouse.down();
    await page.mouse.move(englishTimeBox.x + englishTimeBox.width * 0.34, y, { steps: 8 });
    await page.mouse.up();
  }
  await expect(page.getByText('1960-е', { exact: true })).toBeVisible();
  await expect(page.getByText('Исследовательская реконструкция', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Линза · готовится')).toBeDisabled();
  await expect(page.getByLabel('3D · готовится')).toBeDisabled();
  await expect(page.getByText('3D MODEL · ROMANOV', { exact: true })).toHaveCount(0);

  // Romanov remains the current candidate spatial pipeline.
  await page.getByText('Палаты бояр Романовых', { exact: true }).first().click();
  await expect(page.getByText('МАШИНА ВРЕМЕНИ', { exact: true })).toBeVisible();

  const timeSlider = page.locator('[aria-label="Выберите историческую эпоху"]');
  await expect(timeSlider).toHaveCount(1);
  const timeBox = await timeSlider.boundingBox();
  if (timeBox) {
    const y = timeBox.y + timeBox.height / 2;
    await page.mouse.move(timeBox.x + 15, y);
    await page.mouse.down();
    await page.mouse.move(timeBox.x + timeBox.width * 0.52, y, { steps: 8 });
    await page.mouse.up();
  }

  await page.getByText('Линза времени', { exact: true }).click();
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
