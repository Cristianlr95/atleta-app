import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { finalize } from 'rxjs/operators';
import { ApiError } from 'src/app/core/models/api-error.model';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { UserFeedbackService } from 'src/app/core/services/user-feedback.service';
import { MetallicButtonComponent } from 'src/app/shared/ui/metallic-button/metallic-button.component';
import { MetallicInputComponent } from 'src/app/shared/ui/metallic-input/metallic-input.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { AuthService } from '../../services/auth.service';

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
  private readonly navigationService = inject(NavigationService);
  private readonly route = inject(ActivatedRoute);
  private readonly userFeedbackService = inject(UserFeedbackService);

  readonly iconBase = 'assets/icons/atleta';
  readonly loginTitleIconAsset = `${this.iconBase}/ic_nav_profile_24.svg`;
  readonly googleIconAsset = `${this.iconBase}/ic_brand_google_24.svg`;
  isSubmitting = false;
  authError: string | null = null;
  private readonly redirectUrl: string | null;

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    const next = this.route.snapshot.queryParamMap.get('next');
    const email = this.route.snapshot.queryParamMap.get('email');

    this.redirectUrl = this.sanitizeRedirectUrl(next);

    if (email) {
      this.loginForm.patchValue({ email });
    }
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.authError = null;
    this.isSubmitting = true;

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          if (this.redirectUrl) {
            void this.navigationService.safeNavigateByUrl(this.redirectUrl);
            return;
          }

          void this.navigationService.safeNavigate(['/home']);
        },
        error: (error: ApiError) => {
          this.authError = this.userFeedbackService.loginError(error);
        },
      });
  }

  onForgotPassword(): void {
    // Navigate to recover-password flow.
  }

  onContinueWithGoogle(): void {
    // Trigger Google auth flow.
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

    return next.startsWith('/') ? next : null;
  }
}
