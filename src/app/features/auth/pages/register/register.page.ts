import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { finalize } from 'rxjs/operators';
import { ApiError } from 'src/app/core/models/api-error.model';
import { APP_CONFIG } from 'src/app/core/config/app-config.token';
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
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly navigationService = inject(NavigationService);
  private readonly userFeedbackService = inject(UserFeedbackService);
  readonly isBeta = inject(APP_CONFIG).environmentName === 'beta';

  readonly iconBase = 'assets/icons/atleta-raster-v1';
  readonly registerTitleIconAsset = `${this.iconBase}/ic_nav_profile_96.png`;
  readonly accountSectionIconAsset = `${this.iconBase}/ic_action_edit_96.png`;
  readonly securitySectionIconAsset = `${this.iconBase}/ic_auth_security_96.png`;

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
      invitationCode: ['', this.isBeta ? [Validators.required] : []],
    },
    {
      validators: [this.passwordsMatchValidator],
    },
  );

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      const firstInvalid = this.elementRef.nativeElement.querySelector<HTMLElement>(
        'form .ng-invalid input, form .ng-invalid select',
      ) ?? this.elementRef.nativeElement.querySelector<HTMLElement>(
        'app-metallic-input[formControlName="confirmPassword"] input',
      );
      firstInvalid?.focus();
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
      }, this.isBeta ? formValue.invitationCode.trim() : undefined)
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
          this.registerError = this.isBeta && error.status === 403
            ? 'El código de invitación no es válido.'
            : this.userFeedbackService.registerError(error);
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

  isControlInvalid(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
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

