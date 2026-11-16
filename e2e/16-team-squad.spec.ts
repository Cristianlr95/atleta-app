import { expect, Page, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { installSquad } from './helpers/team-squad-fixture';

async function capture(page: Page, state: string, width: number) {
  const directory = join(process.cwd(), 'docs/team-list-2026-11-16/after');
  mkdirSync(directory, { recursive: true });
  const name = `${state}-${width}`;
  if (await page.getByRole('dialog').count() === 0) await expect(page.getByRole('navigation', { name: 'Navegación inferior' })).toHaveCount(1);
  await page.screenshot({ path: join(directory, `${name}.png`), animations: 'disabled' });
  writeFileSync(join(directory, `${name}.json`), JSON.stringify({
    route: new URL(page.url()).pathname, viewport: page.viewportSize(), state,
    environment: 'local, API simulada, sesión de prueba, sin demo',
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    sourceChanges: execFileSync('git', ['diff', 'HEAD', '--name-only', '--', 'src'], { encoding: 'utf8' }).trim(),
  }, null, 2));
}

for (const width of [390, 1440]) {
  test(`fichas del plantel, datos reales y teclado a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await installSquad(page);
    const runtimeErrors: string[] = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    await page.goto('/player/profile');
    await page.getByRole('button', { name: 'Ver integrantes de Atleta Prueba FC' }).click();
    await expect(page).toHaveURL(/\/teams\/10$/);
    await expect(page.locator('.team-member')).toHaveCount(3);
    const ana = page.locator('.team-member').filter({ hasText: 'Ana' });
    const leo = page.locator('.team-member').filter({ hasText: 'Leo' });
    const camila = page.locator('.team-member').filter({ hasText: 'Camila' });
    await expect(page.locator('.team-overall')).toContainText('34.1');
    await expect(page.locator('.team-overall')).toContainText('2 de 3 jugadores valorados');
    await expect(leo.locator('.team-member__ovr')).toHaveText('0');
    await expect(camila.locator('.team-member__ovr')).toHaveText('Sin valoración');
    await expect(camila).toContainText('Sin posición');
    await expect(ana).toContainText('Sin datos');
    await capture(page, 'plantel-list', width);
    const scrollRegion = page.getByRole('region', { name: 'Lista de jugadores, desplazamiento horizontal' });
    if (width === 390) {
      await scrollRegion.focus();
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => scrollRegion.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
    }
    const trigger = ana.getByRole('button', { name: 'Ver ficha de Ana' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Ficha del jugador' })).toBeVisible();
    const dialog = page.locator('ion-modal.player-modal');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Ana', exact: true })).toBeVisible();
    await expect(dialog.locator('.player-dialog__ovr')).toHaveText('OVR68.1');
    await expect(dialog.locator('.player-dialog__ratings')).toContainText('Mediocampo0');
    await expect(dialog.locator('.player-dialog__ratings')).toContainText('DefensaSin valoración');
    await expect(page).toHaveURL(/\/teams\/10$/);
    const ovrBox = await dialog.locator('.player-dialog__ovr').boundingBox();
    const chart = dialog.getByRole('img', { name: 'Rendimiento de Ana' });
    const chartBox = await chart.boundingBox();
    expect(ovrBox!.x + ovrBox!.width).toBeLessThanOrEqual(chartBox!.x + 2);
    expect(Math.abs((ovrBox!.y + ovrBox!.height / 2) - (chartBox!.y + chartBox!.height / 2))).toBeLessThan(100);
    const fontSize = await dialog.locator('.metallic-role-hexagon__label').first().evaluate(el => {
      const svg = el.closest('svg')!;
      return parseFloat(getComputedStyle(el).fontSize) * svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    });
    expect(fontSize).toBeGreaterThanOrEqual(11);
    const close = dialog.getByRole('button', { name: 'Cerrar ficha' });
    await close.focus();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await capture(page, 'player-modal', width);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(page).toHaveURL(/\/teams\/10$/);
    await leo.getByRole('button', { name: 'Ver ficha de Leo' }).click();
    await expect(dialog.locator('.player-dialog__ovr')).toHaveText('OVR0');
    await dialog.getByRole('button', { name: 'Cerrar ficha' }).click();
    await expect(dialog).not.toBeVisible();
    await camila.getByRole('button', { name: 'Ver ficha de Camila' }).click();
    await expect(dialog.locator('.player-dialog__ovr')).toHaveText('OVRSin valoración');
    await expect(dialog.getByRole('img')).toHaveCount(0);
    await capture(page, 'unrated-modal', width);
    await dialog.getByRole('button', { name: 'Cerrar ficha' }).click();
    await expect(dialog).not.toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(runtimeErrors).toEqual([]);
  });

  test(`plantel carga, vacío y 500 con reintento a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await installSquad(page);
    let release!: () => void;
    const waiting = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/api/v1/teams/10/members/active', async route => { await waiting; await route.fulfill({ json: [] }); });
    await page.goto('/teams/10');
    await expect(page.getByRole('status')).toHaveText('Cargando equipo...');
    await capture(page, 'plantel-loading', width);
    release();
    await expect(page.getByText('No hay integrantes activos.', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Atleta Prueba FC', exact: true })).toBeVisible();
    await capture(page, 'plantel-empty', width);
    const endpoint = '**/api/v1/teams/10';
    await page.route(endpoint, route => route.fulfill({ status: 500, json: {} }));
    await page.goto('/teams/10');
    await expect(page.getByRole('alert')).toContainText('No pudimos cargar el equipo.');
    await capture(page, 'plantel-error', width);
    await page.unroute(endpoint);
    // Restore just the team response; member loading is already released.
    await page.route(endpoint, route => route.fulfill({ json: { id: 10, nombre: 'Atleta Prueba FC' } }));
    await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText('No hay integrantes activos.', { exact: true })).toBeVisible();
    await capture(page, 'plantel-recovered', width);
  });

  test(`valoración fallida conserva el jugador y permite reintentar a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await installSquad(page);
    const endpoint = '**/api/v1/ratings/player/ath-h3/overall';
    await page.route(endpoint, route => route.fulfill({ status: 500, json: {} }));
    await page.goto('/teams/10');
    const ana = page.locator('.team-member').filter({ hasText: 'Ana' });
    await expect(ana.getByRole('alert')).toContainText('No pudimos cargar las valoraciones.');
    await expect(ana.locator('.team-member__ovr')).toContainText('No disponible');
    await expect(page.locator('.team-member')).toHaveCount(3);
    await capture(page, 'rating-error', width);
    await page.unroute(endpoint);
    await ana.getByRole('button', { name: 'Reintentar valoraciones de Ana' }).click();
    await expect(ana.getByRole('alert')).toHaveCount(0);
    await expect(ana.locator('.team-member__ovr')).toHaveText('68.1');
    await capture(page, 'rating-recovered', width);
  });
}
