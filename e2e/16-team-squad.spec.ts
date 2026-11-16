import { expect, Page, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { installSquad } from './helpers/team-squad-fixture';

async function capture(page: Page, state: string, width: number) {
  const directory = join(process.cwd(), 'docs/team-squad-2026-11-16/after');
  mkdirSync(directory, { recursive: true });
  const name = `${state}-${width}`;
  await expect(page.getByRole('navigation', { name: 'Navegación inferior' })).toHaveCount(1);
  await page.screenshot({ path: join(directory, `${name}.png`) });
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
    const ana = page.getByRole('article', { name: 'Ficha de Ana', exact: true });
    const leo = page.getByRole('article', { name: 'Ficha de Leo', exact: true });
    const camila = page.getByRole('article', { name: 'Ficha de Camila', exact: true });
    await expect(ana.locator('.team-member__ovr')).toContainText('68');
    await expect(ana.locator('.team-member__ratings')).toContainText('Mediocampo0');
    await expect(ana.locator('.team-member__ratings')).toContainText('DefensaSin valoración');
    await expect(leo.locator('.team-member__ovr')).toHaveText('OVR0');
    await expect(camila.locator('.team-member__ovr')).toHaveText('OVRSin valoración');
    await expect(camila).toContainText('Sin posición');
    await capture(page, 'plantel-data', width);
    await ana.locator('.team-member__analysis').scrollIntoViewIfNeeded();
    const fontSize = await ana.locator('.metallic-role-hexagon__label').first().evaluate(el => {
      const svg = el.closest('svg')!;
      return parseFloat(getComputedStyle(el).fontSize) * svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    });
    expect(fontSize).toBeGreaterThanOrEqual(11);
    await capture(page, 'plantel-values', width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await ana.getByRole('button', { name: 'Ver jugador Ana' }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/players\/ath-h3$/);
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
    const ana = page.getByRole('article', { name: 'Ficha de Ana', exact: true });
    await expect(ana.getByRole('alert')).toContainText('No pudimos cargar las valoraciones.');
    await expect(ana.locator('.team-member__ovr')).toHaveText('OVRNo disponible');
    await expect(page.locator('.team-member')).toHaveCount(3);
    await capture(page, 'rating-error', width);
    await page.unroute(endpoint);
    await ana.getByRole('button', { name: 'Reintentar valoraciones de Ana' }).click();
    await expect(ana.getByRole('alert')).toHaveCount(0);
    await expect(ana.locator('.team-member__ovr')).toHaveText('OVR68');
    await capture(page, 'rating-recovered', width);
  });
}
