export interface SmokeUsers {
  userA: { email: string; password: string };
  userB: { email: string; password: string };
}

export function loadSmokeUsers(): SmokeUsers | null {
  const userAEmail = process.env.E2E_USER_A_EMAIL;
  const userAPassword = process.env.E2E_USER_A_PASSWORD;
  const userBEmail = process.env.E2E_USER_B_EMAIL;
  const userBPassword = process.env.E2E_USER_B_PASSWORD;

  if (!userAEmail || !userAPassword || !userBEmail || !userBPassword) {
    return null;
  }

  return {
    userA: { email: userAEmail, password: userAPassword },
    userB: { email: userBEmail, password: userBPassword },
  };
}
