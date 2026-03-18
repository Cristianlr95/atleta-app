import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { finalize, map, switchMap } from 'rxjs/operators';
import { ApiError } from 'src/app/core/models/api-error.model';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { TeamSummary } from '../../models/team.models';
import { TeamApiService } from '../../services/team-api.service';
import { MetallicButtonComponent } from 'src/app/shared/ui/metallic-button/metallic-button.component';
import { MetallicInputComponent } from 'src/app/shared/ui/metallic-input/metallic-input.component';

@Component({
  selector: 'app-team-creator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MetallicInputComponent, MetallicButtonComponent],
  templateUrl: './team-creator.component.html',
  styleUrls: ['./team-creator.component.scss'],
})
export class TeamCreatorComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly teamApiService = inject(TeamApiService);

  @Output() teamCreated = new EventEmitter<TeamSummary>();

  isSubmitting = false;
  submitError: string | null = null;
  submitSuccess: string | null = null;
  selectedLogoFile: File | null = null;
  selectedLogoName: string | null = null;

  readonly createTeamForm = this.formBuilder.group({
    nombre: this.formBuilder.nonNullable.control('', {
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    }),
    anioFundacion: this.formBuilder.nonNullable.control('', {
      validators: [Validators.pattern(/^\d{4}$/)],
    }),
  });

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    this.selectedLogoFile = file;
    this.selectedLogoName = file?.name ?? null;
  }

  onCreateTeam(): void {
    if (this.createTeamForm.invalid) {
      this.createTeamForm.markAllAsTouched();
      return;
    }

    const session = this.authSessionService.currentSession;
    if (!session) {
      this.submitError = 'Debes iniciar sesion para crear un equipo.';
      this.submitSuccess = null;
      return;
    }

    const formValue = this.createTeamForm.getRawValue();
    const anio = formValue.anioFundacion.trim();

    this.isSubmitting = true;
    this.submitError = null;
    this.submitSuccess = null;

    this.resolveLogoUrl()
      .pipe(
        switchMap((logoUrl) =>
          this.teamApiService.createTeam({
            nombre: formValue.nombre.trim(),
            creadorUuid: session.user.atletaUuid,
            logoUrl: logoUrl || undefined,
            anioFundacion: anio ? Number(anio) : undefined,
          }),
        ),
      )
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (created) => {
          this.submitSuccess = created?.nombre
            ? `Equipo "${created.nombre}" creado correctamente.`
            : 'Equipo creado correctamente.';
          this.submitError = null;
          this.createTeamForm.reset({
            nombre: '',
            anioFundacion: '',
          });
          this.selectedLogoFile = null;
          this.selectedLogoName = null;
          this.teamCreated.emit(created);
        },
        error: (error: ApiError) => {
          this.submitError = error.message;
          this.submitSuccess = null;
        },
      });
  }

  private resolveLogoUrl(): Observable<string | null> {
    if (!this.selectedLogoFile) {
      return of(null);
    }

    return this.teamApiService.uploadTeamLogo(this.selectedLogoFile).pipe(
      map((response) => response.logoUrl ?? null),
    );
  }
}
