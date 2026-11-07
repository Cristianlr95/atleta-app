import { expect, test } from '@playwright/test';
import { loadSmokeUsers } from './helpers/env';
import { loginWithUi } from './helpers/ui-helpers';

const users = loadSmokeUsers();
const matchId = process.env.E2E_FULL_MATCH_ID;

for (const role of ['userA', 'userB'] as const) {
  test(`a full match appears in Social for ${role}`, async ({ page }) => {
    test.skip(!users || !matchId, 'Requires smoke users and E2E_FULL_MATCH_ID with all slots confirmed.');

    await loginWithUi(page, users![role]);
    await page.goto('/social?tab=matches');
    await page.getByRole('button', { name: 'Abrir detalle' }).click();
    await expect(page).toHaveURL(new RegExp(`/matches/${matchId}$`));
    await expect(page.locator('.match-confirmation-progress__title')).toContainText('10');
  });
}
