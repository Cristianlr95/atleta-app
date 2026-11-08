import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

const isolatedApi = process.env.ATLETA_E2E_ISOLATED_API;

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

test('a newly registered account reaches onboarding and Profile with a persistent session', async ({ page }) => {
  test.setTimeout(90_000);
  test.skip(!isolatedApi, 'Requires a disposable local API and database.');
  expect(isolatedApi).toMatch(/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
  await page.context().route('**/api/v1/**', route =>
    new URL(route.request().url()).origin === isolatedApi ? route.continue() : route.abort(),
  );

  const id = randomUUID().slice(0, 8);
  const email = `AtletaH3-${id}@example.test`;
  const password = randomUUID();
  const alias = `PruebaH3-${id}`;
  const login = page.locator('app-login:visible');
  const register = page.locator('app-register:visible');
  const loginButton = login.getByRole('button', { name: 'Iniciar sesión', exact: true });
  const loginResponse = (loginPage = page) => loginPage.waitForResponse(response =>
    response.url() === `${isolatedApi}/api/v1/athletes/login` && response.request().method() === 'POST',
  );

  await page.goto('/player/profile');
  await expect(page).toHaveURL(/\/login\?next=/);
  await login.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
  await register.getByLabel('Nombre completo').fill('Prueba Atleta H3');
  await register.getByLabel('Email').fill(email);
  await register.getByLabel('Genero').selectOption('MASCULINO');
  await register.getByLabel('Contraseña', { exact: true }).fill(password);
  await register.getByLabel('Confirmar contraseña').fill(password);
  await register.getByRole('button', { name: 'Crear cuenta', exact: true }).click();

  await expect(page).toHaveURL(/\/login\?next=/);
  await expect(login.getByLabel('Email')).toHaveValue(email.toLowerCase());
  const registeredLoginUrl = page.url();
  await login.getByLabel('Contraseña', { exact: true }).fill(randomUUID());
  const invalid = loginResponse();
  await loginButton.click();
  expect((await invalid).status()).toBe(401);
  await expect(login.getByRole('alert')).toContainText('incorrectos');
  await expect(page).toHaveURL(registeredLoginUrl);

  await login.getByLabel('Email').fill(email);
  await login.getByLabel('Contraseña', { exact: true }).fill(password);
  const valid = loginResponse();
  await loginButton.click();
  expect((await valid).status()).toBe(200);
  await expect(page).toHaveURL(/\/player\/onboarding$/);
  await expect(page.getByRole('heading', { name: 'Configura tu jugador' })).toBeVisible();
  await page.getByLabel('Alias').fill(alias);
  const positions = page.getByRole('group', { name: 'Selecciona tus posiciones por orden de prioridad' });
  for (const position of ['Defensa', 'Mediocampo', 'Delantero']) {
    await positions.getByRole('button', { name: `${position}, disponible`, exact: true }).click();
    await expect(positions.getByRole('button', { name: new RegExp(`^${position}, prioridad`), pressed: true })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Guardar perfil' }).click();
  await expect(page).toHaveURL(/\/player\/profile$/);
  await expect(page.locator('.profile-alias')).toHaveText(alias);
  await expect(page.locator('.position-priority-list li')).toHaveCount(3);
  await page.reload();
  await expect(page.locator('.profile-alias')).toHaveText(alias);

  const returning = await page.context().newPage();
  await returning.goto('/login');
  await returning.getByLabel('Email').fill(email.toLowerCase());
  await returning.getByLabel('Contraseña', { exact: true }).fill(password);
  const lowercase = loginResponse(returning);
  await returning.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  expect((await lowercase).status()).toBe(200);
  await expect(returning).toHaveURL(/\/home$/);
  await expect(returning.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '0 de 100 XP');

  await page.goto('/player/onboarding-status');
  await page.getByRole('button', { name: 'Cerrar sesion' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/player/profile');
  await expect(page).toHaveURL(/\/login\?next=/);
});
