import { expect, test } from '@playwright/test';
import { loadSmokeUsers } from './helpers/env';
import { loginWithUi } from './helpers/ui-helpers';

const users = loadSmokeUsers();

test.describe('Smoke 02 - Crear partido wizard', () => {
  test.skip(!users, 'Missing E2E_USER_A/B credentials in environment variables.');

  test('creator can complete wizard and send invitations', async ({ page }) => {
    await loginWithUi(page, users!.userA);
    await page.goto('/matches/create');

    await page.getByRole('button', { name: 'Enfrentamiento Interno' }).click();

    const teamSelect = page.locator('app-metallic-select').filter({ hasText: 'Equipo' }).locator('select');
    if ((await teamSelect.count()) > 0) {
      const options = await teamSelect.locator('option').count();
      if (options > 1) {
        await teamSelect.selectOption({ index: 1 });
      }
    }

    const future = new Date(Date.now() + 90 * 60 * 1000);
    const iso = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}T${String(future.getHours()).padStart(2, '0')}:${String(future.getMinutes()).padStart(2, '0')}:00`;

    const dateTime = page.locator('ion-datetime');
    await dateTime.evaluate((el, value) => {
      (el as { value: string }).value = value;
      el.dispatchEvent(new CustomEvent('ionChange', { detail: { value }, bubbles: true }));
    }, iso);

    const venueInput = page.locator('input[placeholder="Nombre o direccion"]');
    await venueInput.click();
    const firstVenue = page.locator('.venue-result').first();
    await expect(firstVenue).toBeVisible();
    await firstVenue.click();

    // Paso 1 concentra formato, agenda, equipo y cancha.
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Paso 2 concentra vestimenta y convocatoria con sobrecupo permitido.
    const selectAllButton = page.getByRole('button', { name: 'Seleccionar todos' });
    await expect(selectAllButton).toBeVisible();
    await selectAllButton.click();

    await page.getByRole('button', { name: 'Continuar' }).click();

    // Paso 3 confirma el resumen y ejecuta la creación orquestada.
    const sendButton = page.getByRole('button', { name: 'Enviar invitaciones' });
    await expect(sendButton).toBeVisible();
    await sendButton.click();

    await expect(page).toHaveURL(/\/matches\//);
    await expect(page.getByText('Estado del partido')).toBeVisible();
  });
});
