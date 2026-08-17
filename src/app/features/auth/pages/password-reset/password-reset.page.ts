import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { ApiError } from 'src/app/core/models/api-error.model';
import { UserFeedbackService } from 'src/app/core/services/user-feedback.service';
import { MetallicButtonComponent } from 'src/app/shared/ui/metallic-button/metallic-button.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { MetallicInputComponent } from 'src/app/shared/ui/metallic-input/metallic-input.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  templateUrl: './password-reset.page.html',
  styleUrls: ['./password-reset.page.scss'],
  imports: [CommonModule, ReactiveFormsModule, IonicModule, MetallicButtonComponent, MetallicCardComponent, MetallicInputComponent],
})
export class PasswordResetPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly navigationService = inject(NavigationService);
  private readonly feedback = inject(UserFeedbackService);

  readonly token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';
  readonly confirmMode = this.token.length > 0;
  readonly requestForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });
  readonly confirmForm = this.formBuilder.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    confirmation: ['', [Validators.required]],
  });
  submitting = false;
  message: string | null = null;
  error: string | null = null;

  async onSubmitRequest(): Promise<void> {
    if (this.requestForm.invalid || this.submitting) {
      this.requestForm.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.error = null;
    try {
      await firstValueFrom(this.authService.requestPasswordReset(this.requestForm.getRawValue().email));
      this.message = 'Si el correo existe, recibiras un enlace de recuperacion.';
    } catch (error) {
      this.error = this.feedback.passwordResetError(error as ApiError);
    } finally {
      this.submitting = false;
    }
  }

  async onSubmitConfirmation(): Promise<void> {
    if (this.confirmForm.invalid || this.submitting) {
      this.confirmForm.markAllAsTouched();
      return;
    }
    const { password, confirmation } = this.confirmForm.getRawValue();
    if (password !== confirmation) {
      this.error = 'Las contrasenas no coinciden.';
      return;
    }
    this.submitting = true;
    this.error = null;
    try {
      await firstValueFrom(this.authService.confirmPasswordReset(this.token, password));
      await this.navigationService.safeNavigate(['/login'], { queryParams: { reset: 'success' } });
    } catch (error) {
      this.error = this.feedback.passwordResetError(error as ApiError);
    } finally {
      this.submitting = false;
    }
  }

  onBackToLogin(): void {
    void this.navigationService.safeNavigate(['/login']);
  }
}
