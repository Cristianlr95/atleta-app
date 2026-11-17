import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { ApiError } from 'src/app/core/models/api-error.model';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { UserFeedbackService } from 'src/app/core/services/user-feedback.service';
import { MetallicButtonComponent } from 'src/app/shared/ui/metallic-button/metallic-button.component';
import { MetallicInputComponent } from 'src/app/shared/ui/metallic-input/metallic-input.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { AuthService } from '../../services/auth.service';
import { GoogleIdentityService } from '../../services/google-identity.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MetallicButtonComponent,
    MetallicInputComponent,
    MetallicCardComponent,
    IonicModule,
  ],
})
export class LoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly googleIdentityService = inject(GoogleIdentityService);
  private readonly navigationService = inject(NavigationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly userFeedbackService = inject(UserFeedbackService);

  readonly iconBase = 'assets/icons/atleta-raster-v1';
  readonly googleIconAsset = `${this.iconBase}/ic_brand_google_96.png`;
  get googleAvailable(): boolean {
    return this.googleIdentityService.isConfigured();
  }
  isSubmitting = false;
  authError: string | null = null;
  authNotice: string | null = null;
  private redirectUrl: string | null = null;

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.authNotice = params.get('reset') === 'success'
        ? 'Contrasena actualizada. Inicia sesion con tu nueva clave.'
        : null;
      this.redirectUrl = this.sanitizeRedirectUrl(params.get('next'));
      const email = params.get('email');
      if (email) {
        this.loginForm.patchValue({ email });
      }
    });
  }

  async onLogin(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.authError = null;
    this.isSubmitting = true;

    try {
      await firstValueFrom(this.authService.login(this.loginForm.getRawValue()));
      await this.navigateAfterLogin();
    } catch (error) {
      this.authError = this.userFeedbackService.loginError(error as ApiError);
    } finally {
      this.isSubmitting = false;
    }
  }

  onForgotPassword(): void {
    void this.navigationService.safeNavigate(['/password-reset']);
  }

  async onContinueWithGoogle(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.authError = null;
    this.isSubmitting = true;

    try {
      const idToken = await this.googleIdentityService.requestIdToken();
      await firstValueFrom(this.authService.loginWithGoogleIdToken(idToken));
      await this.navigateAfterLogin();
    } catch (error) {
      this.authError = error instanceof Error
        ? error.message
        : 'No se pudo iniciar sesion con Google.';
    } finally {
      this.isSubmitting = false;
    }
  }

  onCreateAccount(): void {
    void this.navigationService.safeNavigate(['/register']);
  }

  private sanitizeRedirectUrl(next: string | null): string | null {
    if (!next) {
      return null;
    }

    if (next === 'player-onboarding') {
      return '/player/onboarding';
    }

    return next.startsWith('/') && !next.startsWith('//') && !/^\/login(?:[/?#;]|$)/.test(next)
      ? next
      : null;
  }

  private async navigateAfterLogin(): Promise<void> {
    // An auth transition must run even during the debounce for ordinary navigation.
    const navigated = await this.router.navigateByUrl(this.redirectUrl ?? '/home').catch(() => false);
    if (!navigated) {
      this.authError = 'No se pudo abrir la aplicación. Intenta nuevamente.';
    }
  }
}
