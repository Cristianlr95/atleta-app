import { expect, Page, test } from '@playwright/test';

const viewports = [
  { width: 320, height: 760 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
] as const;

test.describe('Responsive shell and onboarding', () => {
  for (const viewport of viewports) {
    test(`keeps onboarding inside ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await openDemoOnboarding(page);

      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

      await expect(page.locator('app-player-onboarding')).toHaveCount(1);
      await expect(page.locator('ion-router-outlet > .ion-page:not(.ion-page-hidden)')).toHaveCount(1);
      await expect(page.getByText('Configura tu jugador', { exact: true })).toBeVisible();

      const card = page.getByRole('form', { name: 'Configura tu jugador' });
      const cardBox = await card.boundingBox();
      expect(cardBox).not.toBeNull();
      expect(cardBox!.x).toBeGreaterThanOrEqual(0);
      expect(cardBox!.x + cardBox!.width).toBeLessThanOrEqual(viewport.width);

      const pitchControls = page.locator('.field-picker__position');
      await expect(pitchControls).toHaveCount(6);
      for (const control of await pitchControls.all()) {
        await expect(control).toBeVisible();
        const box = await control.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
      }
      await expect(page.locator('.field-picker__role-card')).toBeVisible();
      const positions = page.locator('.field-picker__position');
      await positions.nth(0).click();
      await positions.nth(1).click();
      await positions.nth(2).click();
      await expect(positions.nth(0)).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByText('3/3 elegidas')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Guardar perfil' })).toBeDisabled();
      await page.getByLabel('Alias').fill('Jugador');
      await expect(page.getByRole('button', { name: 'Guardar perfil' })).toBeEnabled();
      await page.screenshot({ path: `docs/flow-captures/onboarding-selected-${viewport.width}.png` });

      if (viewport.width === 390 || viewport.width === 1366) {
        await testInfo.attach(`onboarding-${viewport.width}x${viewport.height}`, {
          body: await page.screenshot({ fullPage: true }),
          contentType: 'image/png',
        });
      }
    });
  }
});

async function openDemoOnboarding(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const session = {
      user: {
        atletaUuid: 'ath-responsive',
        email: 'responsive@atleta.local',
        nombre: 'Responsive',
      },
      tokens: { accessToken: 'responsive-test-token' },
    };
    localStorage.setItem('atleta.dev.access-token', 'responsive-test-token');
    localStorage.setItem('atleta.dev.auth-session', JSON.stringify(session));
  });
  await page.route('**/api/v1/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route('**/api/v1/athletes/ath-responsive', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ atletaUuid: 'ath-responsive', email: 'responsive@atleta.local', nombre: 'Responsive' }) });
  });
  await page.route('**/api/v1/player-profiles/ath-responsive', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
  await page.goto('/player/onboarding?demo=1');
  await expect(page.locator('.field-picker__pitch')).toBeVisible();
}
