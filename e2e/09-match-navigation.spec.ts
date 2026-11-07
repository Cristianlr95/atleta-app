import { expect, test } from '@playwright/test';
import { apiLogin, createMatchWithInvites } from './helpers/api-helpers';
import { loadSmokeUsers } from './helpers/env';
import { loginWithUi, readConfirmedCount } from './helpers/ui-helpers';

const users = loadSmokeUsers();

test.describe('Smoke - Navegación entre Social y partido', () => {
  test.skip(!users, 'Missing E2E_USER_A/B credentials in environment variables.');

  test('invited player can reopen an accepted match without losing its state', async ({ page }) => {
    const creator = await apiLogin(users!.userA.email, users!.userA.password);
    const invited = await apiLogin(users!.userB.email, users!.userB.password);
    const seed = await createMatchWithInvites(creator, [invited]);

    await loginWithUi(page, users!.userB);
    await page.goto('/social?tab=matches');
    const invite = page.locator('.match-item').filter({ hasText: `#${seed.matchId}` });
    await invite.getByRole('button', { name: 'Aceptar' }).click();
    await expect(invite).toHaveCount(0);
    await expect(page.getByText('Invitacion aceptada.')).toBeVisible();
    await page.goto('/social?tab=activity');
    const activity = page.locator('app-activity-card').filter({ hasText: `partido #${seed.matchId}` });

    for (let attempt = 0; attempt < 3; attempt++) {
      await activity.getByRole('button', { name: 'Abrir partido' }).click();
      await expect(page).toHaveURL(new RegExp(`/matches/${seed.matchId}$`));
      const progress = page.locator('.match-confirmation-progress__title');
      await expect(progress).toBeVisible();
      await expect.poll(async () => readConfirmedCount(await progress.textContent())).toBeGreaterThanOrEqual(2);
      await page.goBack();
      await expect(page).toHaveURL(/\/social/);
      await expect(activity.getByRole('button', { name: 'Abrir partido' })).toBeVisible();
    }
  });
});
