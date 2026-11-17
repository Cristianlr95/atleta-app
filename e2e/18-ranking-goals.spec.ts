import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { installH0H3Fixture } from './helpers/h0-h3-fixture';

for (const width of [390, 1440]) {
  test(`ranking muestra goles de trayectoria y posición a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await installH0H3Fixture(page, 'data');
    await page.route('**/api/v1/ratings/leaderboard**', route => route.fulfill({ json: [
      { playerProfileId: 'ath-h3', alias: 'Ana', score: 80, roleType: 'ATAQUE', matchesPlayed: 3, goalsScored: 5, goalsForRole: 0, mvpCount: 2, mvpForRole: 1, recentResults: ['VICTORIA', 'EMPATE', 'DERROTA'], resultsForRole: ['EMPATE'] },
    ] }));
    await page.route('**/api/v1/teams/10/leaderboard', route => route.fulfill({ json: [
      { rank: 1, playerProfileId: 'ath-h3', alias: 'Ana', score: 80, matchesPlayed: 2, rated: true, goalsScored: 2, mvpCount: 1, recentResults: ['EMPATE', 'VICTORIA'] },
    ] }));
    await page.goto('/leaderboard');
    await expect(page.locator('.leaderboard__goals').first()).toHaveText('5');
    await page.getByLabel('Clasificar por').selectOption('ROLE');
    await expect(page.getByText('Posición: la registrada para cada partido.')).toBeVisible();
    await expect(page.locator('.leaderboard__goals').first()).toContainText('Total: 5');
    await expect(page.locator('.leaderboard__goals').first()).toContainText('Posición: 0');
    await expect(page.locator('.leaderboard__mvp').first()).toContainText('Total: 2');
    await expect(page.locator('.leaderboard__mvp').first()).toContainText('Posición: 1');
    const results = page.locator('.leaderboard__form').first();
    await expect(results).toContainText('Total:');
    await expect(results).toContainText('Posición:');
    await expect(results.locator('.leaderboard__result')).toHaveText(['G', 'E', 'P', 'E']);
    await expect(results.getByRole('group', { name: 'Últimos resultados de trayectoria, más reciente a la derecha' })).toBeVisible();
    await expect(results.getByRole('group', { name: 'Últimos resultados en la posición, más reciente a la derecha' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const table = page.getByRole('region', { name: 'Estadísticas de jugadores, desplazamiento horizontal' });
    await table.scrollIntoViewIfNeeded();
    if (width === 390) {
      await table.focus();
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => table.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
    }
    await table.evaluate(element => { element.scrollLeft = element.scrollWidth; });
    const directory = join(process.cwd(), 'docs', 'ranking-stats-2026-11-17');
    mkdirSync(directory, { recursive: true });
    await page.screenshot({ path: join(directory, `ranking-posicion-${width}.png`), animations: 'disabled' });
    await page.getByLabel('Mostrar').selectOption('TEAM');
    await expect(page.locator('.leaderboard__goals').first()).toHaveText('2');
    await expect(page.locator('.leaderboard__mvp').first()).toHaveText('1');
    await expect(page.locator('.leaderboard__form').first().locator('.leaderboard__result')).toHaveText(['E', 'G']);
    await expect(page.getByRole('group', { name: 'Últimos resultados del equipo, más reciente a la derecha' })).toBeVisible();
  });
}
