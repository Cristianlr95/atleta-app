import { expect, Page, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { installH0H3Fixture } from './helpers/h0-h3-fixture';

async function capture(page: Page, name: string) {
  const directory = join(process.cwd(), 'docs/home-profile-2026-11-16/after');
  mkdirSync(directory, { recursive: true });
  await expect(page.getByRole('navigation', { name: 'Navegación inferior' })).toHaveCount(1);
  await page.screenshot({ path: join(directory, `${name}.png`) });
  writeFileSync(join(directory, `${name}.json`), JSON.stringify({
    route: new URL(page.url()).pathname, viewport: page.viewportSize(), state: name,
    environment: 'local, API simulada, sesión de prueba, sin demo',
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    sourceChanges: execFileSync('git', ['diff', 'HEAD', '--name-only', '--', 'src'], { encoding: 'utf8' }).trim(),
  }, null, 2));
}

for (const width of [390, 1440]) {
  test(`Inicio y Perfil tienen información propia a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const fixture = await installH0H3Fixture(page, 'data');
    await page.goto('/home');
    await expect(page.locator('.home-priority')).toContainText('partido');
    await expect(page.locator('.home-invitations')).toContainText('Invitaciones pendientes');
    await expect(page.locator('.home-activity')).toBeVisible();
    await expect(page.getByText('Atleta Prueba FC', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Ana Torres', { exact: true })).toHaveCount(0);
    await expect(page.getByText('OVR', { exact: true })).toHaveCount(0);
    expect(fixture.requests.some(request => request.path.endsWith('/overall'))).toBe(false);
    expect(fixture.requests.some(request => request.path.includes('/teams/by-player/'))).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await capture(page, `inicio-data-${width}`);
    await page.getByRole('button', { name: 'Perfil', exact: true }).click();
    await expect(page.locator('.ovr-block')).toContainText('68');
    await expect(page.getByText('Atleta Prueba FC', { exact: true })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Ver integrantes de Atleta Prueba FC' })).toBeVisible();
    await capture(page, `perfil-data-${width}`);
  });

  test(`Crear equipo se conserva en Perfil sin equipo a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await installH0H3Fixture(page, 'empty');
    await page.goto('/player/profile');
    await expect(page.getByText('Aun no perteneces a ningun equipo.', { exact: true })).toBeVisible();
    const create = page.getByRole('button', { name: 'Crear equipo', exact: true });
    await expect(create).toHaveCount(1);
    await capture(page, `perfil-empty-${width}`);
    await create.click();
    await expect(page).toHaveURL(/\/sessions\/create$/);
    await expect(page.getByRole('button', { name: 'Crear equipo', exact: true })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Crear equipo', exact: true })).toBeVisible();
  });
}
