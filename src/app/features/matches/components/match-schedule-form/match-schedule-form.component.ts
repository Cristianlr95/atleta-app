import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MetallicSelectComponent, MetallicSelectOption } from 'src/app/shared/ui/metallic-select/metallic-select.component';
import { MatchSize, MatchGenderCategory, Venue } from '../../models/progressive-match.models';
import { VenueSearchComponent } from '../venue-search/venue-search.component';
import { VenueSelectedCardComponent } from '../venue-selected-card/venue-selected-card.component';

export interface MatchScheduleValue {
  teamId: number | null;
  modality: MatchSize;
  genderCategory: MatchGenderCategory;
  scheduledAt: string;
  location: string;
  venue: Venue | null;
  minRequired: number;
  maxPlayers: number;
}

@Component({
  selector: 'app-match-schedule-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    MetallicSelectComponent,
    VenueSearchComponent,
    VenueSelectedCardComponent,
  ],
  templateUrl: './match-schedule-form.component.html',
  styleUrls: ['./match-schedule-form.component.scss'],
})
export class MatchScheduleFormComponent implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);

  @Input() teams: MetallicSelectOption[] = [];
  @Input() loadingTeams = false;
  @Input() selectedTeamId: number | null = null;
  @Output() scheduleChange = new EventEmitter<MatchScheduleValue>();

  readonly modalityOptions: MetallicSelectOption[] = [
    { label: '5 vs 5', value: MatchSize.FIVE_VS_FIVE },
    { label: '6 vs 6', value: MatchSize.SIX_VS_SIX },
    { label: '7 vs 7', value: MatchSize.SEVEN_VS_SEVEN },
  ];

  readonly genderCategoryOptions: MetallicSelectOption[] = [
    { label: 'Mixto', value: MatchGenderCategory.MIXED },
    { label: 'Solo mujeres', value: MatchGenderCategory.WOMEN_ONLY },
    { label: 'Solo hombres', value: MatchGenderCategory.MEN_ONLY },
  ];

  selectedVenue: Venue | null = null;

  readonly scheduleForm = this.formBuilder.group({
    teamId: this.formBuilder.nonNullable.control('', [Validators.required]),
    modality: this.formBuilder.nonNullable.control(MatchSize.FIVE_VS_FIVE, [Validators.required]),
    genderCategory: this.formBuilder.nonNullable.control(MatchGenderCategory.MIXED, [Validators.required]),
    scheduledAt: this.formBuilder.nonNullable.control('', [Validators.required]),
    minRequired: this.formBuilder.nonNullable.control(10, [Validators.required, Validators.min(2), Validators.max(20)]),
    maxPlayers: this.formBuilder.nonNullable.control(10, [Validators.required, Validators.min(2), Validators.max(30)]),
  });

  constructor() {
    this.scheduleForm.valueChanges.subscribe(() => this.emitValue());
    this.scheduleForm.controls.modality.valueChanges.subscribe((value) => {
      const playersPerTeam = this.resolvePlayersPerTeam(value);
      this.scheduleForm.patchValue(
        {
          minRequired: playersPerTeam * 2,
          maxPlayers: playersPerTeam * 2,
        },
        { emitEvent: false },
      );
      this.emitValue();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedTeamId']) {
      this.scheduleForm.controls.teamId.setValue(this.selectedTeamId ? String(this.selectedTeamId) : '', {
        emitEvent: false,
      });
      this.emitValue();
    }
  }

  get isValid(): boolean {
    const value = this.scheduleForm.controls.scheduledAt.value;
    return this.scheduleForm.valid && this.isFutureDate(value) && !!this.selectedVenue;
  }

  markAllAsTouched(): void {
    this.scheduleForm.markAllAsTouched();
  }

  onVenueSelected(venue: Venue): void {
    this.selectedVenue = venue;
    this.emitValue();
  }

  private emitValue(): void {
    const raw = this.scheduleForm.getRawValue();
    this.scheduleChange.emit({
      teamId: raw.teamId ? Number(raw.teamId) : null,
      modality: raw.modality as MatchSize,
      genderCategory: raw.genderCategory as MatchGenderCategory,
      scheduledAt: raw.scheduledAt,
      location: this.selectedVenue?.address || this.selectedVenue?.name || '',
      venue: this.selectedVenue,
      minRequired: raw.minRequired,
      maxPlayers: raw.maxPlayers,
    });
  }

  private isFutureDate(value: string): boolean {
    if (!value) {
      return false;
    }

    return new Date(value).getTime() > Date.now();
  }

  private resolvePlayersPerTeam(modality: string | null): number {
    if (modality === MatchSize.SIX_VS_SIX) {
      return 6;
    }
    if (modality === MatchSize.SEVEN_VS_SEVEN) {
      return 7;
    }
    return 5;
  }
}
