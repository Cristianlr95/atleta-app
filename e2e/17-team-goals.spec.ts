import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { installSquad } from './helpers/team-squad-fixture';

for (const width of [390, 1440]) {
  test(`plantel distingue goles del equipo, totales, cero y ausencia a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await installSquad(page);
    await page.route('**/api/v1/teams/10/members/active', route => route.fulfill({ json: [
      { playerUuid: 'ath-h3', alias: 'Ana', rol: 'CAPITAN', primaryPositionName: 'Delantero', teamGoals: 2, totalGoals: 12 },
      { playerUuid: 'leo', alias: 'Leo', rol: 'JUGADOR', primaryPositionName: 'Mediocampo', teamGoals: 0, totalGoals: 0 },
      { playerUuid: 'new', alias: 'Camila', rol: 'JUGADOR', primaryPositionName: null },
    ] }));
    await page.goto('/teams/10');
    const ana = page.locator('.team-member').filter({ hasText: 'Ana' });
    const leo = page.locator('.team-member').filter({ hasText: 'Leo' });
    const camila = page.locator('.team-member').filter({ hasText: 'Camila' });
    await expect(ana.locator('td').nth(3)).toHaveText('2');
    await expect(ana.locator('td').nth(4)).toHaveText('12');
    await expect(leo.locator('td').nth(3)).toHaveText('0');
    await expect(leo.locator('td').nth(4)).toHaveText('0');
    await expect(camila.locator('td').nth(3)).toHaveText('Sin datos');
    await expect(camila.locator('td').nth(4)).toHaveText('Sin datos');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const directory = join(process.cwd(), 'docs/team-goals-2026-11-17');
    mkdirSync(directory, { recursive: true });
    await ana.getByRole('button', { name: 'Ver ficha de Ana' }).click();
    await expect(page.getByRole('dialog', { name: 'Ficha del jugador' })).toBeVisible();
    const dialog = page.locator('ion-modal.player-modal');
    await expect(dialog.locator('dl.player-dialog__details > div').filter({ hasText: 'Goles con el equipo' })).toHaveText('Goles con el equipo2');
    await expect(dialog.locator('dl.player-dialog__details > div').filter({ hasText: 'Goles totales' })).toHaveText('Goles totales12');
    await page.screenshot({ path: join(directory, `goles-modal-${width}.png`), animations: 'disabled' });
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(ana.getByRole('button')).toBeFocused();
    await page.screenshot({ path: join(directory, `goles-plantel-${width}.png`), animations: 'disabled' });
  });
}
