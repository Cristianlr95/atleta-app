import { expect, test } from '@playwright/test';
import { installSquad } from './helpers/team-squad-fixture';

test('edits and archives as the current captain with keyboard focus and refreshed Social data', async ({ page }) => {
  await installSquad(page);
  let name = 'Atleta Prueba FC';
  let archived = false;
  let archiveActor: string | null = null;
  const updates: unknown[] = [];
  await page.route(/\/api\/v1\/teams\/10(?:\?.*)?$/, async route => {
    const request = route.request();
    if (request.method() === 'PATCH') {
      expect(request.headers()['authorization']).toBe('Bearer h0-h3-local-fixture');
      const payload = request.postDataJSON();
      updates.push(payload);
      if (payload.nombre === 'Ocupado') return route.fulfill({ status: 409, json: {} });
      name = payload.nombre;
    }
    if (request.method() === 'DELETE') {
      expect(request.headers()['authorization']).toBe('Bearer h0-h3-local-fixture');
      archiveActor = new URL(request.url()).searchParams.get('actorUuid');
      archived = true;
      return route.fulfill({ status: 204 });
    }
    if (archived) return route.fulfill({ status: 404, json: {} });
    return route.fulfill({ json: { id: 10, nombre: name, creadorUuid: 'former-captain' } });
  });
  await page.route('**/api/v1/teams/by-player/ath-h3', route => route.fulfill({ json: [
    ...(archived ? [] : [{ id: 10, nombre: name }]),
    { id: 11, nombre: 'Equipo Activo' },
  ] }));

  await page.goto('/teams/10');
  const edit = page.getByRole('button', { name: 'Editar nombre' });
  const input = page.getByRole('textbox', { name: 'Nombre del equipo' });
  await edit.click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue(name);
  await input.press('Escape');
  await expect(edit).toBeFocused();
  await expect(input).toHaveCount(0);
  expect(updates).toEqual([]);

  await edit.click();
  await input.fill('Ocupado');
  await input.press('Enter');
  await expect(page.getByRole('alert')).toHaveText('Ese nombre ya está en uso. Prueba con otro.');
  await expect(input).toHaveValue('Ocupado');
  await expect(input).toBeFocused();
  await input.fill('  Fútbol Sur  ');
  await input.press('Enter');
  await expect(page.getByRole('heading', { name: 'Fútbol Sur' })).toBeVisible();
  await expect(page.getByText('Nombre del equipo actualizado.')).toBeFocused();
  expect(updates).toEqual([{ nombre: 'Ocupado' }, { nombre: 'Fútbol Sur' }]);

  const archive = page.getByRole('button', { name: 'Archivar equipo', exact: true });
  const cancel = page.getByRole('button', { name: 'Cancelar archivado' });
  await archive.click();
  await expect(cancel).toBeFocused();
  await cancel.press('Escape');
  await expect(archive).toBeFocused();
  expect(archived).toBe(false);

  await archive.click();
  await page.getByRole('button', { name: 'Confirmar archivado' }).click();
  await expect(page).toHaveURL(/\/social\?tab=teams$/);
  const notice = page.locator('app-social-page').getByRole('status').filter({ hasText: 'Equipo Fútbol Sur archivado.' });
  await expect(notice).toBeFocused();
  await expect(page.getByRole('button', { name: 'Abrir equipo Equipo Activo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir equipo Fútbol Sur' })).toHaveCount(0);
  expect(archiveActor).toBe('ath-h3');
});

test('hides both administrative actions after an archive 403 confirms lost captaincy', async ({ page }) => {
  await installSquad(page);
  let forbidden = false;
  await page.route(/\/api\/v1\/teams\/10\?actorUuid=/, route => {
    forbidden = true;
    return route.fulfill({ status: 403, json: {} });
  });
  await page.route('**/api/v1/teams/10/members/active', route => route.fulfill({ json: [
    { playerUuid: 'ath-h3', alias: 'Ana', rol: forbidden ? 'JUGADOR' : 'CAPITAN' },
    { playerUuid: 'leo', alias: 'Leo', rol: forbidden ? 'CAPITAN' : 'JUGADOR' },
  ] }));

  await page.goto('/teams/10');
  await page.getByRole('button', { name: 'Archivar equipo', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar archivado' }).click();
  await expect(page.getByText('Ya no tienes permiso para administrar este equipo.')).toBeFocused();
  await expect(page.getByRole('button', { name: 'Abandonar equipo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Archivar equipo' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Editar nombre' })).toHaveCount(0);
  await expect(page).toHaveURL(/\/teams\/10$/);
});

for (const width of [390, 1440]) {
  test(`protects a dirty draft when leaving Plantel at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await installSquad(page);
    const mutations: string[] = [];
    page.on('request', request => {
      if (['PATCH', 'DELETE'].includes(request.method())) mutations.push(request.method());
    });

    await page.goto('/social?tab=teams');
    const openTeam = page.getByRole('button', { name: 'Abrir equipo Atleta Prueba FC' });
    await openTeam.click();
    const edit = page.getByRole('button', { name: 'Editar nombre', exact: true });
    const input = page.getByRole('textbox', { name: 'Nombre del equipo' });
    const archive = page.getByRole('button', { name: 'Archivar equipo', exact: true });
    const dialog = page.getByRole('alertdialog', { name: '¿Descartar cambios?' });
    const keepEditing = dialog.getByRole('button', { name: 'Seguir editando' });
    const discard = dialog.getByRole('button', { name: 'Descartar cambios' });

    await edit.focus();
    await page.keyboard.press('Enter');
    await input.fill('Nombre por guardar');
    await page.getByRole('button', { name: '‹ Volver' }).press('Enter');
    await expect(dialog).toBeVisible({ timeout: 4000 });
    await expect(keepEditing).toBeFocused();
    await page.screenshot({ path: testInfo.outputPath('confirmacion-borrador.png') });
    await page.keyboard.press('Tab');
    await expect(discard).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(keepEditing).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('Nombre por guardar');
    await expect(page).toHaveURL(/\/teams\/10$/);

    await page.evaluate(() => history.back());
    await expect(dialog).toBeVisible();
    await keepEditing.click();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('Nombre por guardar');
    await expect(page).toHaveURL(/\/teams\/10$/);

    await archive.click();
    await expect(dialog).toBeVisible();
    await discard.click();
    const cancelArchive = page.getByRole('button', { name: 'Cancelar archivado' });
    await expect(cancelArchive).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(archive).toBeFocused();

    await edit.click();
    await input.fill('Otro nombre sin guardar');
    await page.getByRole('button', { name: 'Cancelar edición' }).click();
    await expect(dialog).toBeVisible();
    await discard.click();
    await expect(edit).toBeFocused();

    await edit.click();
    await input.fill('  Atleta Prueba FC  ');
    await input.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(edit).toBeFocused();

    await edit.click();
    await input.fill('Nombre para probar el historial');
    await page.locator('app-team-detail-page').getByRole('navigation', { name: 'Navegación inferior' })
      .getByRole('button', { name: 'Inicio' }).click();
    await expect(dialog).toBeVisible();
    await keepEditing.click();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('Nombre para probar el historial');
    await expect(page).toHaveURL(/\/teams\/10$/);

    await page.evaluate(() => history.back());
    await expect(dialog).toBeVisible();
    await discard.click();
    await expect(openTeam).toBeVisible();
    await expect(page).toHaveURL(/\/social\?tab=teams$/);
    expect(mutations).toEqual([]);
  });

  for (const reducedMotion of ['reduce', 'no-preference'] as const) {
    test(`archive respects ${reducedMotion} motion at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.emulateMedia({ reducedMotion });
      await installSquad(page);
      let deletes = 0;
      await page.route(/\/api\/v1\/teams\/10\?actorUuid=/, route => {
        expect(route.request().method()).toBe('DELETE');
        deletes++;
        return route.fulfill({ status: 204 });
      });
      await page.route('**/api/v1/teams/by-player/ath-h3', route => route.fulfill({ json: deletes
        ? [{ id: 11, nombre: 'Equipo Activo' }]
        : [{ id: 10, nombre: 'Atleta Prueba FC' }, { id: 11, nombre: 'Equipo Activo' }],
      }));
      await page.goto('/teams/10');
      await page.getByRole('button', { name: 'Archivar equipo', exact: true }).click();
      await page.evaluate(() => {
        const transitions: string[] = [];
        Reflect.set(window, 'socialTransitions', transitions);
        const monitor = setInterval(() => {
          for (const animation of document.getAnimations()) {
            const effect = animation.effect as KeyframeEffect | null;
            if (effect?.target?.tagName === 'APP-SOCIAL-PAGE') {
              transitions.push(...effect.getKeyframes().map(frame => String(frame.transform ?? '')));
            }
          }
        }, 10);
        setTimeout(() => clearInterval(monitor), 1500);
      });
      await page.getByRole('button', { name: 'Confirmar archivado' }).press('Enter');
      const notice = page.locator('app-social-page').getByRole('status').filter({ hasText: 'archivado.' });
      await expect(notice).toBeFocused();
      await expect(page.getByRole('button', { name: 'Abrir equipo Equipo Activo' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Abrir equipo Atleta Prueba FC' })).toHaveCount(0);
      const transitions = await page.evaluate(() => Reflect.get(window, 'socialTransitions'));
      const spatialTransition = /translate[XYZ]?\(/.test(JSON.stringify(transitions));
      expect(spatialTransition).toBe(reducedMotion === 'no-preference');
      expect(deletes).toBe(1);
      await page.screenshot({ path: testInfo.outputPath('social-tras-archivar.png') });
    });
  }
}
