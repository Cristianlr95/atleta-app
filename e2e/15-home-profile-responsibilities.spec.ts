import { expect, test } from '@playwright/test';
import { installH0H3Fixture } from './helpers/h0-h3-fixture';

for (const width of [390, 1440]) {
  test('Inicio y Perfil tienen información propia a ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await installH0H3Fixture(page, 'data');
    let role = 'CAPITAN';
    await page.route('**/api/v1/teams/10/members/active', route => route.fulfill({ json: [
      { playerUuid: 'ath-h3', alias: 'Ana', rol: role },
    ] }));
    await page.goto('/home');
    const home = page.locator('app-home-page');
    const team = home.getByRole('button', { name: 'Ver integrantes de Atleta Prueba FC' });
    const invite = home.getByRole('button', { name: 'Invitaciones de Atleta Prueba FC' });
    await expect(home.getByRole('heading', { name: 'Mi equipo' })).toBeVisible();
    await expect(home.getByText('Ana Torres', { exact: true })).toHaveCount(0);
    await expect(home.getByText('OVR', { exact: true })).toHaveCount(0);
    await expect(invite).toBeVisible();
    await team.press('Enter');
    await expect(page).toHaveURL(/\/teams\/10$/);
    await expect(page.getByRole('button', { name: 'Editar nombre', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Archivar equipo', exact: true })).toBeVisible();

    role = 'JUGADOR';
    await page.getByRole('button', { name: '‹ Volver' }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(team).toBeFocused();
    await expect(invite).toHaveCount(0);
    await team.click();
    await expect(page.getByRole('heading', { name: 'Plantel activo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Editar nombre', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Archivar equipo', exact: true })).toHaveCount(0);

    await page.goto('/player/profile');
    await expect(page.locator('.ovr-block')).toContainText('68');
    await expect(page.getByRole('heading', { name: 'Mi equipo', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Ver integrantes de Atleta Prueba FC' })).toHaveCount(0);
  });

  test('Inicio permite crear equipo sin membresía a ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await installH0H3Fixture(page, 'empty');
    await page.goto('/home');
    const create = page.locator('app-home-page').getByRole('button', { name: 'Crear equipo', exact: true });
    await expect(create).toHaveCount(1);
    await create.click();
    await expect(page).toHaveURL(/\/sessions\/create$/);
    await expect(page.locator('app-create-session-page').getByRole('button', { name: 'Crear equipo', exact: true })).toBeVisible();
  });
}
