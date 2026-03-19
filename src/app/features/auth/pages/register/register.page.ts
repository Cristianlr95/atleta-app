import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { finalize } from 'rxjs/operators';
import { ApiError } from 'src/app/core/models/api-error.model';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { UserFeedbackService } from 'src/app/core/services/user-feedback.service';
import { MetallicButtonComponent } from 'src/app/shared/ui/metallic-button/metallic-button.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { MetallicFormSectionComponent } from 'src/app/shared/ui/metallic-form-section/metallic-form-section.component';
import { MetallicInputComponent } from 'src/app/shared/ui/metallic-input/metallic-input.component';
import { MetallicSelectComponent, MetallicSelectOption } from 'src/app/shared/ui/metallic-select/metallic-select.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    MetallicCardComponent,
    MetallicInputComponent,
    MetallicSelectComponent,
    MetallicButtonComponent,
    MetallicFormSectionComponent,
  ],
})
export class RegisterPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly navigationService = inject(NavigationService);
  private readonly userFeedbackService = inject(UserFeedbackService);

  readonly iconBase = 'assets/icons/atleta';
  readonly registerTitleIconAsset = `${this.iconBase}/ic_nav_profile_24.svg`;
  readonly accountSectionIconAsset = `${this.iconBase}/ic_action_edit_24.svg`;
  readonly securitySectionIconAsset = `${this.iconBase}/ic_action_save_24.svg`;

  isSubmitting = false;
  registerError: string | null = null;
  registerSuccess: string | null = null;
  readonly genderOptions: MetallicSelectOption[] = [
    { label: 'Masculino', value: 'MASCULINO' },
    { label: 'Femenino', value: 'FEMENINO' },
  ];

  readonly registerForm = this.formBuilder.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      genero: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [this.passwordsMatchValidator],
    },
  );

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.registerError = null;
    this.registerSuccess = null;

    const formValue = this.registerForm.getRawValue();

    this.authService
      .register({
        nombre: formValue.nombre.trim(),
        email: formValue.email.trim().toLowerCase(),
        password: formValue.password,
        genero: formValue.genero as 'MASCULINO' | 'FEMENINO',
      })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          void this.navigationService.safeNavigate(['/login'], {
            queryParams: {
              next: '/player/onboarding',
              email: formValue.email.trim().toLowerCase(),
            },
          });
        },
        error: (error: ApiError) => {
          this.registerError = this.userFeedbackService.registerError(error);
        },
      });
  }

  onGoToLogin(): void {
    void this.navigationService.safeNavigate(['/login']);
  }

  hasControlError(controlName: string, errorKey: string): boolean {
    const control = this.registerForm.get(controlName);
    if (!control) {
      return false;
    }

    return control.hasError(errorKey) && (control.touched || control.dirty);
  }

  get hasPasswordMismatch(): boolean {
    const confirmPassword = this.registerForm.get('confirmPassword');
    return Boolean(
      this.registerForm.hasError('passwordMismatch') &&
        confirmPassword &&
        (confirmPassword.touched || confirmPassword.dirty),
    );
  }

  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  }
}

