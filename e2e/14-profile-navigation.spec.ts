import { expect, test } from '@playwright/test';
import { installH0H3Fixture } from './helpers/h0-h3-fixture';

for (const width of [390, 1440]) {
  test(`un único acceso global a Perfil y Ranking a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await installH0H3Fixture(page, 'data');
    for (const route of ['/home', '/matches', '/leaderboard', '/player/profile', '/stats', '/social', '/sessions/create']) {
      await page.goto(route);
      const nav = page.getByRole('navigation', { name: 'Navegación inferior' });
      await expect(nav).toBeVisible();
      for (const name of ['Perfil', 'Ranking']) {
        await expect(page.getByRole('button', { name, exact: true })).toHaveCount(1);
        await expect(nav.getByRole('button', { name, exact: true })).toBeVisible();
      }
      await expect(page.getByRole('button', { name: 'Ver ranking completo' })).toHaveCount(0);
    }
    await page.getByRole('button', { name: 'Perfil', exact: true }).click();
    await expect(page).toHaveURL(/\/player\/profile$/);
    await expect(page.getByRole('button', { name: 'Ranking', exact: true })).toHaveCount(1);
    await expect(page.getByRole('button', { name: /Ver partidos|Próximos/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Ranking', exact: true }).click();
    await expect(page).toHaveURL(/\/leaderboard$/);
    await page.goto('/ranking');
    await expect(page).toHaveURL(/\/leaderboard$/);
    await page.goto('/matches/venues/new');
    await expect(page.getByRole('button', { name: 'Atras', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /^(Perfil|Ranking)$/ })).toHaveCount(0);
  });
}
