import { expect, test } from '@playwright/test';
import { loadSmokeUsers } from './helpers/env';
import { loginWithUi } from './helpers/ui-helpers';

const users = loadSmokeUsers();

test.describe('Smoke 01 - Auth login', () => {
  test.skip(!users, 'Missing E2E_USER_A/B credentials in environment variables.');

  test('login redirects and keeps session', async ({ page }) => {
    await loginWithUi(page, users!.userA);

    await expect(page).toHaveURL(/\/(player\/profile|player\/onboarding|sessions\/create|matches\/history|social)/);

    await page.goto('/player/profile');
    await expect(page).not.toHaveURL(/\/login$/);
  });
});
