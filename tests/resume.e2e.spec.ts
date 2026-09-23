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

test('experience resume survives browser reload without resetting place, time or trust', async ({ page }) => {
  await page.goto('/');
  await ensureRussian(page);

  // Prove a non-default place/time survives reload.
  await page.getByRole('button', { name: 'Старый Английский двор' }).first().click();
  let slider = page.getByRole('slider', { name: 'Выберите историческую эпоху' });
  await slider.focus();
  await slider.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuenow', '1');
  await expect(page.getByText('1960-е', { exact: true })).toBeVisible();

  await page.reload();
  await ensureRussian(page);
  await expect(page.getByText('Старый Английский двор', { exact: true }).last()).toBeVisible();
  slider = page.getByRole('slider', { name: 'Выберите историческую эпоху' });
  await expect(slider).toHaveAttribute('aria-valuenow', '1');
  await expect(page.getByText('1960-е', { exact: true })).toBeVisible();

  // Switch to Romanov and prove era/trust survive a second restart and still reach spatial state.
  await page.getByRole('button', { name: 'Палаты бояр Романовых' }).first().click();
  slider = page.getByRole('slider', { name: 'Выберите историческую эпоху' });
  await expect(slider).toHaveAttribute('aria-valuenow', '0');
  await slider.focus();
  await slider.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuenow', '1');
  await page.getByText('Только факты', { exact: true }).click();

  await page.reload();
  await ensureRussian(page);
  await expect(page.getByText('Палаты бояр Романовых', { exact: true }).last()).toBeVisible();
  slider = page.getByRole('slider', { name: 'Выберите историческую эпоху' });
  await expect(slider).toHaveAttribute('aria-valuenow', '1');

  await page.getByText('Открыть 3D', { exact: true }).click();
  await expect(page.getByText('Одна историческая модель — несколько режимов')).toBeVisible();
  await page.getByLabel('3D · Открыть spatial mode').click();
  await expect(page.getByText('Выбрано: 1859 / 1883 · только факты.')).toBeVisible();
});
