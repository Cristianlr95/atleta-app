import { expect, Page } from '@playwright/test';

export interface E2EUserCredentials {
  email: string;
  password: string;
}

export async function loginWithUi(page: Page, credentials: E2EUserCredentials): Promise<void> {
  await page.goto('/login');

  await page.locator('input[placeholder="tu@email.com"]').fill(credentials.email);
  await page.locator('input[placeholder="••••••••"]').fill(credentials.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  await expect(page).not.toHaveURL(/\/login$/);
}

export async function openInvitations(page: Page): Promise<void> {
  await page.goto('/invitations');
  await expect(page.getByText('Invitaciones')).toBeVisible();
}

export async function openMatchDetail(page: Page, matchId: number): Promise<void> {
  await page.goto(`/matches/${matchId}`);
  await expect(page.getByText('Estado del partido')).toBeVisible();
}

export function readConfirmedCount(raw: string | null | undefined): number {
  const text = raw ?? '';
  const match = text.match(/Confirmados\s+(\d+)\s*\//i);
  return match ? Number(match[1]) : 0;
}
