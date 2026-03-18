import { expect, test } from '@playwright/test';
import { apiLogin, createMatchWithInvites } from './helpers/api-helpers';
import { loadSmokeUsers } from './helpers/env';
import { loginWithUi, openMatchDetail, readConfirmedCount } from './helpers/ui-helpers';

const users = loadSmokeUsers();

test.describe('Smoke 05 - Match detail live updates', () => {
  test.skip(!users, 'Missing E2E_USER_A/B credentials in environment variables.');

  test('creator sees confirmed count update without manual refresh', async ({ browser }) => {
    const creator = await apiLogin(users!.userA.email, users!.userA.password);
    const invited = await apiLogin(users!.userB.email, users!.userB.password);
    const seed = await createMatchWithInvites(creator, [invited]);

    const creatorContext = await browser.newContext();
    const invitedContext = await browser.newContext();

    const creatorPage = await creatorContext.newPage();
    const invitedPage = await invitedContext.newPage();

    try {
      await loginWithUi(creatorPage, users!.userA);
      await openMatchDetail(creatorPage, seed.matchId);

      const title = creatorPage.locator('.match-confirmation-progress__title');
      await expect(title).toBeVisible();
      const initialConfirmed = readConfirmedCount(await title.textContent());

      await loginWithUi(invitedPage, users!.userB);
      await invitedPage.goto('/social?tab=matches');

      const inviteRow = invitedPage.locator('.match-item').filter({ hasText: `#${seed.matchId}` }).first();
      await expect(inviteRow).toBeVisible();
      await inviteRow.getByRole('button', { name: 'Aceptar' }).click();

      await expect.poll(async () => {
        const raw = await title.textContent();
        return readConfirmedCount(raw);
      }, {
        timeout: 30_000,
        intervals: [1000, 2000, 3000],
      }).toBeGreaterThan(initialConfirmed);
    } finally {
      await creatorContext.close();
      await invitedContext.close();
    }
  });
});
