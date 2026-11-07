import { expect, test } from '@playwright/test';

test.describe('Acceso y recuperación accesibles', () => {
  for (const width of [320, 1366]) {
    test(`muestra validación de acceso y recuperación a ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/login');
      const email = page.getByLabel('Email');
      const password = page.getByLabel('Contraseña', { exact: true });
      await email.fill('correo-invalido');
      await email.blur();
      await password.fill('corta');
      await password.blur();
      await expect(email).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('#login-email-error')).toBeVisible();
      await expect(page.locator('#login-password-error')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeDisabled();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      await page.getByRole('button', { name: '¿Olvidaste tu contraseña?' }).click();
      const recoveryEmail = page.locator('app-password-reset').getByLabel('Email');
      await recoveryEmail.fill('correo-invalido');
      await recoveryEmail.blur();
      await expect(recoveryEmail).toHaveAttribute('aria-describedby', 'reset-email-error');
      await expect(page.locator('#reset-email-error')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Enviar enlace' })).toBeDisabled();
    });
  }
});
