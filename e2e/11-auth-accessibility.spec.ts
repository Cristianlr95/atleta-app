import { expect, test } from '@playwright/test';

test.describe('Acceso y recuperación accesibles', () => {
  for (const width of [320, 1366]) {
    test(`muestra validación de acceso y recuperación a ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/login');
      const email = page.getByLabel('Email');
      const password = page.getByLabel('Contraseña', { exact: true });
      const placeholderColor = await email.evaluate(element => getComputedStyle(element, '::placeholder').color);
      expect(placeholderColor).toBe('rgb(174, 186, 200)');
      await email.fill('correo-invalido');
      await email.blur();
      await password.fill('corta');
      await password.blur();
      await expect(email).toHaveAttribute('aria-invalid', 'true');
      await email.focus();
      await expect.poll(() => email.evaluate(element => getComputedStyle(element).borderTopColor))
        .toBe('rgb(239, 71, 111)');
      const invalidFieldStyles = await email.evaluate(element => ({
        borderColor: getComputedStyle(element).borderTopColor,
        boxShadow: getComputedStyle(element).boxShadow,
      }));
      expect(invalidFieldStyles.borderColor).toBe('rgb(239, 71, 111)');
      expect(invalidFieldStyles.boxShadow).toContain('239, 71, 111');
      await expect(page.locator('#login-email-error')).toBeVisible();
      await expect(page.locator('#login-password-error')).toBeVisible();
      const submit = page.getByRole('button', { name: 'Iniciar sesión' });
      await expect(submit).toBeDisabled();
      expect(await submit.evaluate(element => getComputedStyle(element).opacity)).toBe('0.38');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      await page.getByRole('button', { name: '¿Olvidaste tu contraseña?' }).click();
      const recoveryEmail = page.locator('app-password-reset').getByLabel('Email');
      await recoveryEmail.fill('correo-invalido');
      await recoveryEmail.blur();
      await expect(recoveryEmail).toHaveAttribute('aria-describedby', 'reset-email-error');
      await expect(page.locator('#reset-email-error')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Enviar enlace' })).toBeDisabled();

      await page.goto('/register');
      const registerEmail = page.getByLabel('Email');
      await registerEmail.fill('correo-invalido');
      await registerEmail.blur();
      await expect(registerEmail).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('#register-email-error')).toBeVisible();

      const gender = page.getByLabel('Genero');
      await gender.focus();
      await gender.blur();
      await expect(gender).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('#register-genero-error')).toBeVisible();
    });
  }
});
