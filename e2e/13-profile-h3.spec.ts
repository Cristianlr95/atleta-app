import { expect, Page, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { installH0H3Fixture } from './helpers/h0-h3-fixture';

const evidenceDir = join(process.cwd(), 'docs/home-profile-2026-11-16/profile-states');

async function capture(page: Page, state: string, width: number, responses: unknown[] = []) {
  mkdirSync(evidenceDir, { recursive: true });
  await page.evaluate(() => Promise.all(Array.from(document.images, img => img.decode().catch(() => undefined))));
  const name = `perfil-${state}-${width}`;
  await page.screenshot({ path: join(evidenceDir, `${name}.png`), fullPage: true });
  writeFileSync(join(evidenceDir, `${name}.json`), JSON.stringify({
    route: new URL(page.url()).pathname, environment: 'local, API interceptada, environmentName=test, sin demo',
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    sourceChanges: execFileSync('git', ['diff', 'HEAD', '--name-only', '--', 'src'], { encoding: 'utf8' }).trim(),
    viewport: page.viewportSize(), state, responses,
  }, null, 2) + '\n');
}

for (const width of [390, 1440]) {
  test(`H3 perfil normal con datos, teclado y accesos a ${width}px`, async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
    await page.setViewportSize({ width, height: 844 });
    const fixture = await installH0H3Fixture(page, 'data');
    await page.goto('/player/profile');
    await expect(page.locator('.ovr-block')).toContainText('68');
    await expect(page.getByText('NIVEL GENERAL', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Aún no hay estadísticas', { exact: true })).toHaveCount(0);
    const details = page.locator('.performance-details');
    await expect(details).not.toHaveAttribute('open');
    const values = page.locator('.role-stat-values');
    await expect(values.locator('div')).toHaveCount(6);
    await expect(values.locator('div').filter({ hasText: 'Mediocampo' })).toHaveText('Mediocampo0');
    await expect(values.locator('div').filter({ hasText: 'Defensa' })).toHaveText('DefensaSin valoración');
    await page.getByRole('button', { name: 'Ajustes', exact: true }).focus();
    await page.keyboard.press('Tab');
    const ovr = page.getByRole('button', { name: 'Ver qué significa OVR' });
    await expect(ovr).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('.ovr-popover-content')).toContainText('Valoración general');
    await capture(page, 'ovr-explanation', width, fixture.requests);
    await page.keyboard.press('Escape');
    await expect(page.locator('.ovr-popover-content')).toHaveCount(0);
    const teamActionBox = await page.getByRole('button', { name: 'Ver integrantes de Atleta Prueba FC' }).boundingBox();
    const initialFooterBox = await page.locator('.profile-footer').boundingBox();
    expect(teamActionBox!.y + teamActionBox!.height).toBeLessThanOrEqual(initialFooterBox!.y);
    await capture(page, 'data', width, fixture.requests);
    await details.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(details).toHaveAttribute('open');
    const chart = page.getByRole('img', { name: 'Hexagono de habilidades' });
    await page.locator('app-metallic-role-hexagon').evaluate(el => el.scrollIntoView({ block: 'start' }));
    const chartBox = await chart.boundingBox();
    const footerBox = await page.locator('.profile-footer').boundingBox();
    expect(chartBox!.y + chartBox!.height).toBeLessThanOrEqual(footerBox!.y);
    const labelSize = await page.locator('.metallic-role-hexagon__label').first().evaluate(el => {
      const svg = el.closest('svg')!;
      return parseFloat(getComputedStyle(el).fontSize) * svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    });
    expect(labelSize).toBeGreaterThanOrEqual(11);
    await capture(page, 'chart', width, fixture.requests);
    await values.scrollIntoViewIfNeeded();
    await expect(values.getByText('Sin valoración', { exact: true })).toHaveCount(4);
    await expect(values).toBeVisible();
    await capture(page, 'text-values', width, fixture.requests);
    await page.getByRole('heading', { name: 'Trofeos y metas', exact: true }).scrollIntoViewIfNeeded();
    await expect(page.locator('.achievement-card')).toContainText('Partidos jugados');
    const team = page.getByRole('button', { name: 'Ver integrantes de Atleta Prueba FC' });
    await capture(page, 'teams-trophies', width, fixture.requests);
    await team.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/teams\/10$/);
    await expect(page.getByRole('navigation', { name: 'Navegación inferior' })).toHaveCount(1);
    await expect(page.locator('.team-member')).toContainText('Ana');
    await capture(page, 'team-roster', width, fixture.requests);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto('/player/profile');
    await expect(page.locator('.ovr-block')).toContainText('68');
    await page.getByRole('button', { name: 'Ajustes', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/player\/settings$/);
    expect(runtimeErrors).toEqual([]);
  });

  test(`H3 carga de perfil a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const fixture = await installH0H3Fixture(page, 'loading');
    await page.goto('/player/profile');
    await expect(page.getByRole('status')).toHaveText('Actualizando estadísticas...');
    await expect(page.locator('.player-command-center')).toHaveCount(0);
    await capture(page, 'loading', width, fixture.requests);
    fixture.release();
    await expect(page.locator('.ovr-block')).toContainText('68');
  });

  test(`H3 perfil nuevo sin estadísticas a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const fixture = await installH0H3Fixture(page, 'empty');
    await page.goto('/player/profile');
    await expect(page.getByText('Aún no hay estadísticas', { exact: true })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.locator('.role-stat-values')).toHaveCount(0);
    await expect(page.locator('.competition-metrics')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Reintentar estadísticas' })).toHaveCount(0);
    await capture(page, 'empty', width, fixture.requests);
    await page.getByRole('heading', { name: 'Trofeos y metas', exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByText('No hay trofeos disponibles.', { exact: true })).toBeVisible();
    await page.getByRole('heading', { name: 'Mi equipo', exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByText('Aun no perteneces a ningun equipo.', { exact: true })).toBeVisible();
    await capture(page, 'empty-teams-trophies', width, fixture.requests);
  });

  test(`H3 HTTP 500 por fuente y reintento exitoso a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const fixture = await installH0H3Fixture(page, 'data');
    for (const [source, endpoint] of [['overall', '/overall'], ['roles', ''], ['history', '/history']]) {
      const pattern = `**/api/v1/ratings/player/ath-h3${endpoint}`;
      await page.route(pattern, route => {
        fixture.requests.push({ path: new URL(route.request().url()).pathname, status: 500 });
        return route.fulfill({ status: 500, json: {} });
      });
      await page.goto('/player/profile');
      await expect(page.getByRole('alert')).toHaveText('No pudimos cargar las estadísticas.');
      await expect(page.getByText('Aún no hay estadísticas', { exact: true })).toHaveCount(0);
      await expect(page.locator('.competition-metrics')).toHaveCount(0);
      const retry = page.getByRole('button', { name: 'Reintentar estadísticas' });
      await retry.focus();
      await capture(page, `error-${source}`, width, fixture.requests);
      await page.unroute(pattern);
      await page.keyboard.press('Enter');
      await expect(page.getByRole('alert')).toHaveCount(0);
      await expect(page.locator('.role-stat-values')).toContainText('Ataque79');
      await expect(page.locator('.competition-metrics')).toBeVisible();
      await capture(page, `recovered-${source}`, width, fixture.requests);
    }
  });
}
