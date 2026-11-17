import { expect, test } from '@playwright/test';
import { installH0H3Fixture } from './helpers/h0-h3-fixture';

for (const width of [390, 1440]) {
  test(`ranking muestra goles de trayectoria y posición a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await installH0H3Fixture(page, 'data');
    await page.route('**/api/v1/ratings/leaderboard**', route => route.fulfill({ json: [
      { playerProfileId: 'ath-h3', alias: 'Ana', score: 80, roleType: 'ATAQUE', matchesPlayed: 2, goalsScored: 5, goalsForRole: 0 },
    ] }));
    await page.goto('/leaderboard');
    await expect(page.locator('.leaderboard__goals').first()).toHaveText('5');
    await page.getByLabel('Clasificar por').selectOption('ROLE');
    await expect(page.locator('.leaderboard__goals').first()).toContainText('Total: 5');
    await expect(page.locator('.leaderboard__goals').first()).toContainText('Posición: 0');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
