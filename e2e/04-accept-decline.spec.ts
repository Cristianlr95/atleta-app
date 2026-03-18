import { expect, test } from '@playwright/test';
import { apiLogin, createMatchWithInvites, getMatchInvitesForUser } from './helpers/api-helpers';
import { loadSmokeUsers } from './helpers/env';
import { loginWithUi } from './helpers/ui-helpers';

const users = loadSmokeUsers();

test.describe('Smoke 04 - Aceptar/Rechazar invitaciones', () => {
  test.skip(!users, 'Missing E2E_USER_A/B credentials in environment variables.');

  test('invited player can accept one invite and reject another', async ({ page }) => {
    const creator = await apiLogin(users!.userA.email, users!.userA.password);
    const invited = await apiLogin(users!.userB.email, users!.userB.password);

    const acceptedSeed = await createMatchWithInvites(creator, [invited]);
    const declinedSeed = await createMatchWithInvites(creator, [invited]);

    await loginWithUi(page, users!.userB);
    await page.goto('/social?tab=matches');

    const acceptedRow = page.locator('.match-item').filter({ hasText: `#${acceptedSeed.matchId}` }).first();
    await expect(acceptedRow).toBeVisible();
    await acceptedRow.getByRole('button', { name: 'Aceptar' }).click();

    const declinedRow = page.locator('.match-item').filter({ hasText: `#${declinedSeed.matchId}` }).first();
    await expect(declinedRow).toBeVisible();
    await declinedRow.getByRole('button', { name: 'No puedo' }).click();

    await expect.poll(async () => {
      const invites = await getMatchInvitesForUser(invited);
      const accepted = invites.find((item) => item.matchId === acceptedSeed.matchId)?.status ?? '';
      const declined = invites.find((item) => item.matchId === declinedSeed.matchId)?.status ?? '';
      return `${accepted}|${declined}`;
    }).toContain('ACEPTADA|RECHAZADA');
  });
});
