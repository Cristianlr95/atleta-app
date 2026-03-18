import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { ApiError } from 'src/app/core/models/api-error.model';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { UserFeedbackService } from 'src/app/core/services/user-feedback.service';
import { MetallicButtonComponent } from 'src/app/shared/ui/metallic-button/metallic-button.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { MetallicFormSectionComponent } from 'src/app/shared/ui/metallic-form-section/metallic-form-section.component';
import { MetallicInputComponent } from 'src/app/shared/ui/metallic-input/metallic-input.component';
import { MetallicSelectComponent, MetallicSelectOption } from 'src/app/shared/ui/metallic-select/metallic-select.component';
import {
  MetallicPositionFieldOption,
  MetallicPositionFieldPickerComponent,
} from 'src/app/shared/ui/metallic-position-field-picker/metallic-position-field-picker.component';
import { PositionPriorityLevel } from '../../models/position.models';
import { PlayerOnboardingService } from '../../services/player-onboarding.service';
import { UserApiService } from '../../services/user-api.service';

@Component({
  selector: 'app-player-onboarding',
  standalone: true,
  templateUrl: './player-onboarding.page.html',
  styleUrls: ['./player-onboarding.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    MetallicCardComponent,
    MetallicFormSectionComponent,
    MetallicInputComponent,
    MetallicPositionFieldPickerComponent,
    MetallicSelectComponent,
    MetallicButtonComponent,
  ],
})
export class PlayerOnboardingPage implements OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly userApiService = inject(UserApiService);
  private readonly onboardingService = inject(PlayerOnboardingService);
  private readonly route = inject(ActivatedRoute);
  private readonly navigationService = inject(NavigationService);
  private readonly userFeedbackService = inject(UserFeedbackService);
  private readonly isDemoMode: boolean;
  private readonly leave$ = new Subject<void>();

  readonly iconBase = 'assets/icons/atleta';
  readonly titleIconAsset = `${this.iconBase}/ic_nav_profile_24.svg`;
  readonly profileSectionIconAsset = `${this.iconBase}/ic_action_edit_24.svg`;
  readonly positionSectionIconAsset = `${this.iconBase}/ic_match_lineup_24.svg`;

  isLoadingPositions = false;
  isSubmitting = false;
  submitError: string | null = null;
  selectedPositionIds: string[] = [];
  readonly genderOptions: MetallicSelectOption[] = [
    { label: 'Masculino', value: 'MASCULINO' },
    { label: 'Femenino', value: 'FEMENINO' },
  ];

  positionOptions: ReadonlyArray<MetallicPositionFieldOption> = [];

  readonly onboardingForm = this.formBuilder.nonNullable.group(
    {
      alias: ['', [Validators.required, Validators.maxLength(30)]],
      genero: ['', [Validators.required]],
      primaryPositionId: ['', [Validators.required]],
      secondaryPositionId: ['', [Validators.required]],
      tertiaryPositionId: ['', [Validators.required]],
    },
    {
      validators: [this.uniquePositionsValidator],
    },
  );

  constructor() {
    this.isDemoMode = this.route.snapshot.queryParamMap.get('demo') === '1';
  }

  ionViewWillEnter(): void {
    this.submitError = null;
    if (this.isDemoMode) {
      this.loadDemoPositions();
      return;
    }

    if (!this.authSessionService.currentSession) {
      void this.navigationService.safeNavigate(['/login']);
      return;
    }

    this.loadPositions();
  }

  ionViewWillLeave(): void {
    this.leave$.next();
  }

  ngOnDestroy(): void {
    this.leave$.next();
    this.leave$.complete();
  }

  onFinishSetup(): void {
    if (this.onboardingForm.invalid) {
      this.onboardingForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitError = null;

    const formValue = this.onboardingForm.getRawValue();

    if (this.isDemoMode) {
      this.isSubmitting = false;
      void this.navigationService.safeNavigate(['/player/profile'], { queryParams: { demo: '1' } });
      return;
    }

    this.onboardingService
      .completeOnboarding({
        alias: formValue.alias.trim(),
        genero: formValue.genero as 'MASCULINO' | 'FEMENINO',
        positions: [
          this.toPositionSelection(formValue.primaryPositionId, 1),
          this.toPositionSelection(formValue.secondaryPositionId, 2),
          this.toPositionSelection(formValue.tertiaryPositionId, 3),
        ],
      })
      .pipe(
        takeUntil(this.leave$),
        finalize(() => (this.isSubmitting = false)),
      )
      .subscribe({
        next: () => {
          void this.navigationService.safeNavigate(['/player/profile']);
        },
        error: (error: ApiError) => {
          this.submitError = this.userFeedbackService.onboardingError(error);
        },
      });
  }

  onPositionsSelected(positionIds: string[]): void {
    this.selectedPositionIds = [...positionIds];
    const [primary = '', secondary = '', tertiary = ''] = this.selectedPositionIds;

    this.onboardingForm.controls.primaryPositionId.setValue(primary);
    this.onboardingForm.controls.secondaryPositionId.setValue(secondary);
    this.onboardingForm.controls.tertiaryPositionId.setValue(tertiary);

    if (this.selectedPositionIds.length > 0) {
      this.onboardingForm.controls.primaryPositionId.markAsTouched();
    }
    if (this.selectedPositionIds.length > 1) {
      this.onboardingForm.controls.secondaryPositionId.markAsTouched();
    }
    if (this.selectedPositionIds.length > 2) {
      this.onboardingForm.controls.tertiaryPositionId.markAsTouched();
    }

    this.onboardingForm.updateValueAndValidity({ onlySelf: false, emitEvent: false });
  }

  private toPositionSelection(positionId: string, prioridad: PositionPriorityLevel) {
    const selectedPosition = this.positionOptions.find((option) => option.value === positionId);
    return {
      positionId: Number(positionId),
      prioridad,
      positionName: selectedPosition?.label ?? 'Posicion principal',
    };
  }

  private loadDemoPositions(): void {
    this.positionOptions = [
      { id: 1, nombre: 'Arquero' },
      { id: 2, nombre: 'Defensa Central' },
      { id: 3, nombre: 'Carrilero Derecho' },
      { id: 4, nombre: 'Mediocampo' },
      { id: 5, nombre: 'Carrilero Izquierdo' },
      { id: 6, nombre: 'Delantero' },
      { id: 7, nombre: 'DT' },
    ].map((position) => ({
      label: position.nombre,
      value: String(position.id),
    }));
  }

  private loadPositions(): void {
    this.isLoadingPositions = true;
    this.userApiService
      .getPositions()
      .pipe(
        takeUntil(this.leave$),
        finalize(() => (this.isLoadingPositions = false)),
      )
      .subscribe({
        next: (positions) => {
          this.positionOptions = this.ensureCoachOption(this.decoratePositionLabels(positions)).map((position) => ({
            label: position.nombre,
            value: String(position.id),
          }));
        },
        error: (error: ApiError) => {
          this.submitError = this.userFeedbackService.onboardingError(error);
        },
      });
  }

  private uniquePositionsValidator(group: AbstractControl): ValidationErrors | null {
    const primary = group.get('primaryPositionId')?.value;
    const secondary = group.get('secondaryPositionId')?.value;
    const tertiary = group.get('tertiaryPositionId')?.value;

    if (!primary || !secondary || !tertiary) {
      return null;
    }

    const values = [primary, secondary, tertiary];
    const uniqueValues = new Set(values);

    return uniqueValues.size === values.length ? null : { duplicatePositions: true };
  }

  private decoratePositionLabels(
    positions: ReadonlyArray<{ id: number; nombre: string }>,
  ): ReadonlyArray<{ id: number; nombre: string }> {
    const normalizedBase = positions.map((position) => ({
      ...position,
      nombre: this.normalizePositionName(position.nombre),
    }));

    const carrileros = normalizedBase.filter((position) =>
      position.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes('carrilero'),
    );

    if (carrileros.length < 2) {
      return normalizedBase;
    }

    let renamed = 0;
    return normalizedBase.map((position) => {
      const normalized = position.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const hasSide = normalized.includes('derech') || normalized.includes('izquierd');
      const isCarrilero = normalized.includes('carrilero');

      if (!isCarrilero || hasSide) {
        return position;
      }

      renamed += 1;
      return {
        ...position,
        nombre: renamed === 1 ? 'Carrilero Derecho' : 'Carrilero Izquierdo',
      };
    });
  }

  private normalizePositionName(name: string): string {
    const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (normalized.includes('laterla derech') || normalized.includes('lateral derech')) {
      return 'Carrilero Derecho';
    }

    if (normalized.includes('laterla izquierd') || normalized.includes('lateral izquierd')) {
      return 'Carrilero Izquierdo';
    }

    return name;
  }

  private ensureCoachOption(
    positions: ReadonlyArray<{ id: number; nombre: string }>,
  ): ReadonlyArray<{ id: number; nombre: string }> {
    const hasCoach = positions.some((position) => {
      const normalized = position.nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return (
        normalized === 'dt' ||
        normalized.includes('director tecnico') ||
        normalized.includes('entrenador') ||
        normalized.includes('coach')
      );
    });

    if (hasCoach) {
      return positions;
    }

    const fallbackId = positions.reduce((maxId, position) => Math.max(maxId, position.id), 0) + 1;
    return [...positions, { id: fallbackId, nombre: 'DT' }];
  }

  onRetryLoadPositions(): void {
    if (this.isDemoMode) {
      this.loadDemoPositions();
      return;
    }
    this.loadPositions();
  }

}
