import { expect, test } from '@playwright/test';
import {
  apiLogin,
  createMatchWithInvites,
  getMatchInvitesForUser,
  getMatchMvp,
  respondMatchInvite,
  updateMatchStatus,
  voteMatchMvp,
} from './helpers/api-helpers';
import { loadSmokeUsers } from './helpers/env';
import { loginWithUi } from './helpers/ui-helpers';

const users = loadSmokeUsers();

test.describe('Smoke 06 - MVP vote after match close', () => {
  test.skip(!users, 'Missing E2E_USER_A/B credentials in environment variables.');

  test('confirmed participant can vote MVP after match is finalized', async ({ page }) => {
    const creator = await apiLogin(users!.userA.email, users!.userA.password);
    const invited = await apiLogin(users!.userB.email, users!.userB.password);
    const seed = await createMatchWithInvites(creator, [invited]);

    const invites = await getMatchInvitesForUser(invited);
    const invite = invites.find((item) => item.matchId === seed.matchId);
    expect(invite, 'Invite for seeded match was not found').toBeTruthy();
    await respondMatchInvite(invited, invite!.id, true);

    await updateMatchStatus(creator, seed.matchId, 'INICIADO');
    await updateMatchStatus(creator, seed.matchId, 'FINALIZADO');

    const mvpState = await getMatchMvp(invited, seed.matchId);
    expect(mvpState.open).toBeTruthy();
    expect(mvpState.candidates.length).toBeGreaterThan(0);

    const votedUserId = mvpState.candidates[0].userId;
    const voteResult = await voteMatchMvp(invited, seed.matchId, votedUserId);
    expect(voteResult.myVote).toBe(votedUserId);

    await loginWithUi(page, users!.userB);
    await page.goto(`/matches/${seed.matchId}/mvp-vote`);

    await expect(page.getByText('Votacion MVP')).toBeVisible();
    await expect(page.getByText('Tu voto actual')).toBeVisible();
  });
});
