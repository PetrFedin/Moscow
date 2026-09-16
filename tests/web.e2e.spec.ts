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

test('resident journey: map → story → time → 3D → spatial → interruptible portal demo → back', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('MOSCOW · TIME')).toBeVisible();
  await ensureRussian(page);

  // Map is a real product surface, not a detached demo. Browser intentionally shows
  // the route preview instead of pretending to be native Yandex MapKit.
  await page.getByText('Карта', { exact: true }).last().click();
  await expect(page.getByText('PREVIEW КАРТЫ', { exact: true })).toBeVisible();
  await expect(page.getByText('Варварка — Зарядье', { exact: true })).toBeVisible();
  await expect(page.getByText('Тяните карточку пальцем: свернуть · preview · раскрыть')).toBeVisible();

  // Change place from the map and verify the physical sheet follows that selection.
  await page.getByText('Старый Английский двор', { exact: true }).first().click();
  await expect(page.getByText('Открыть историю', { exact: true })).toBeVisible();
  await page.getByText('Открыть историю', { exact: true }).click();
  await expect(page.getByText('Старый Английский двор', { exact: true }).last()).toBeVisible();

  // Return to the Romanov object through the normal discovery list.
  await page.getByText('Палаты бояр Романовых', { exact: true }).first().click();
  await expect(page.getByText('МАШИНА ВРЕМЕНИ')).toBeVisible();

  // The real TimeMachineSlider must be mounted in the story flow.
  const timeSlider = page.locator('[aria-label="Выберите историческую эпоху"]');
  await expect(timeSlider).toHaveCount(1);
  const timeBox = await timeSlider.boundingBox();
  if (timeBox) {
    await page.mouse.click(timeBox.x + timeBox.width * 0.52, timeBox.y + timeBox.height / 2);
  }

  await page.getByText('Открыть 3D', { exact: true }).click();
  await expect(page.getByText('Одна историческая модель — несколько режимов')).toBeVisible();

  await page.getByText('1859 / 1883 · после реставрации', { exact: true }).click();
  await page.getByText('Только факты', { exact: true }).click();
  await page.getByText('Открыть spatial mode', { exact: true }).click();

  await expect(page.getByText('AR runtime проверяется только в нативной сборке')).toBeVisible();
  await expect(page.getByText('SEARCHING', { exact: true })).toBeVisible();
  await expect(page.getByText('DEMO PORTAL · NOT VERIFIED')).toHaveCount(0);

  // Drag-to-enter is direct manipulation: no commit before the gesture reaches the threshold.
  const portalTrack = page.locator('[aria-label="Потяните → DEMO portal preview"]');
  await expect(portalTrack).toHaveCount(1);
  const handle = page.getByText('→', { exact: true });
  const trackBox = await portalTrack.boundingBox();
  const handleBox = await handle.boundingBox();
  expect(trackBox).not.toBeNull();
  expect(handleBox).not.toBeNull();

  if (trackBox && handleBox) {
    // First attempt is deliberately below the commit threshold: portal must snap back.
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(trackBox.x + trackBox.width * 0.48, handleBox.y + handleBox.height / 2, { steps: 5 });
    await page.mouse.up();
    await expect(page.getByText('DEMO PORTAL · NOT VERIFIED')).toHaveCount(0);

    // Second attempt crosses the semantic threshold and commits the demo portal.
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

  // Back/resume returns to the same 3D layer rather than resetting the app.
  await page.getByText('← 3D-модель', { exact: true }).click();
  await expect(page.getByText('Одна историческая модель — несколько режимов')).toBeVisible();
  await expect(page.getByText('Только факты', { exact: true })).toBeVisible();
});
