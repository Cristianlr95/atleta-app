import { expect, test } from '@playwright/test';
import {
  apiLogin,
  getMatchMvp,
} from './helpers/api-helpers';
import { loadFinalizedMatchId, loadSmokeUsers } from './helpers/env';
import { loginWithUi } from './helpers/ui-helpers';

const users = loadSmokeUsers();
const finalizedMatchId = loadFinalizedMatchId();

test.describe('Smoke 06 - MVP vote after match close', () => {
  test.skip(
    !users || !finalizedMatchId,
    'Missing E2E_USER_A/B credentials or E2E_FINALIZED_MATCH_ID for a match where user B is confirmed.',
  );

  test('confirmed participant can vote MVP after match is finalized', async ({ page }) => {
    const invited = await apiLogin(users!.userB.email, users!.userB.password);

    const mvpState = await getMatchMvp(invited, finalizedMatchId!);
    expect(mvpState.open).toBeTruthy();
    expect(mvpState.candidates.length).toBeGreaterThan(0);

    const votedUserId = mvpState.candidates[0].userId;
    expect(mvpState.myVote).toBeFalsy();

    await loginWithUi(page, users!.userB);
    await page.goto(`/matches/${finalizedMatchId}/mvp-vote`);

    await expect(page.getByRole('heading', { name: 'Jugador del Partido' })).toBeVisible();
    await page.locator('app-player-vote-card').first().getByRole('button', { name: 'Votar' }).click();
    await expect(page.getByRole('button', { name: 'Votado' })).toBeVisible();
    const voteResult = await getMatchMvp(invited, finalizedMatchId!);
    expect(voteResult.myVote).toBe(votedUserId);
  });
});
