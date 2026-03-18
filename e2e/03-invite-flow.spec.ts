import { expect, test } from '@playwright/test';
import { apiLogin, createMatchWithInvites } from './helpers/api-helpers';
import { loadSmokeUsers } from './helpers/env';
import { loginWithUi } from './helpers/ui-helpers';

const users = loadSmokeUsers();

test.describe('Smoke 03 - Invitar jugadores', () => {
  test.skip(!users, 'Missing E2E_USER_A/B credentials in environment variables.');

  test('invitation created by creator is visible for invited player in Social', async ({ page }) => {
    const creator = await apiLogin(users!.userA.email, users!.userA.password);
    const invited = await apiLogin(users!.userB.email, users!.userB.password);
    const seed = await createMatchWithInvites(creator, [invited]);

    await loginWithUi(page, users!.userB);
    await page.goto('/social?tab=matches');

    await expect(page.getByText(`partido #${seed.matchId}`)).toBeVisible();
  });
});
