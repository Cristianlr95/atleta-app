import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonicModule } from '@ionic/angular';
import { Subject, catchError, from, of, switchMap, tap, timer } from 'rxjs';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { MetallicButtonComponent } from 'src/app/shared/ui/metallic-button/metallic-button.component';
import { MetallicInputComponent } from 'src/app/shared/ui/metallic-input/metallic-input.component';
import { Venue } from '../../models/progressive-match.models';
import { VenueService } from '../../services/venue.service';

@Component({
  selector: 'app-venue-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, MetallicInputComponent, MetallicButtonComponent],
  templateUrl: './venue-search.component.html',
  styleUrls: ['./venue-search.component.scss'],
})
export class VenueSearchComponent implements OnInit, OnChanges {
  private readonly destroyRef = inject(DestroyRef);
  private readonly venueService = inject(VenueService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly navigationService = inject(NavigationService);
  private readonly route = inject(ActivatedRoute);

  @Input() selectedVenue: Venue | null = null;
  @Output() venueSelected = new EventEmitter<Venue>();

  readonly queryForm = this.formBuilder.group({
    query: this.formBuilder.nonNullable.control(''),
  });

  venues: Venue[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  isEditingSelection = false;
  isListOpen = false;

  private readonly queryChange$ = new Subject<string>();

  constructor() {
    this.queryChange$
      .pipe(
        tap(() => {
          this.isLoading = true;
          this.errorMessage = null;
        }),
        switchMap((query) =>
          timer(280).pipe(
            switchMap(() => from(query.trim().length > 0 ? this.venueService.searchVenues(query) : this.venueService.getActiveVenues())),
            catchError(() => {
              this.errorMessage = 'No se pudo buscar canchas. Intenta nuevamente.';
              return of([]);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (venues) => {
          this.venues = venues;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'No se pudo buscar canchas. Intenta nuevamente.';
        },
      });

    this.queryForm.controls.query.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.queryChange$.next(value));
  }

  ngOnInit(): void {
    this.handleVenueCreatedQueryParam();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedVenue'] && this.selectedVenue) {
      this.isEditingSelection = false;
    }
  }

  get showSelector(): boolean {
    return !this.selectedVenue || this.isEditingSelection;
  }

  onRetry(): void {
    this.queryChange$.next(this.queryForm.controls.query.value);
  }

  onSelectVenue(venue: Venue): void {
    this.isEditingSelection = false;
    this.isListOpen = false;
    this.venueSelected.emit(venue);
  }

  onChangeSelection(): void {
    this.isEditingSelection = true;
    this.isListOpen = true;
    this.queryChange$.next(this.queryForm.controls.query.value);
  }

  onOpenList(): void {
    if (this.isListOpen) {
      return;
    }
    this.isListOpen = true;
    this.queryChange$.next(this.queryForm.controls.query.value);
  }

  onGoToCreateVenue(): void {
    void this.navigationService.safeNavigate(['/matches/venues/new'], {
      queryParams: {
        returnTo: '/matches/create',
      },
    });
  }

  private handleVenueCreatedQueryParam(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const raw = params.get('venueCreated');
      if (!raw) {
        return;
      }

      const venueId = Number(raw);
      if (!Number.isFinite(venueId)) {
        this.clearVenueCreatedQueryParam();
        return;
      }

      void this.venueService.getVenueById(venueId).then((venue) => {
        this.queryChange$.next(this.queryForm.controls.query.value);
        if (venue) {
          this.isEditingSelection = false;
          this.isListOpen = false;
          this.venueSelected.emit(venue);
        }
        this.clearVenueCreatedQueryParam();
      });
    });
  }

  private clearVenueCreatedQueryParam(): void {
    void this.navigationService.safeNavigate([], {
      relativeTo: this.route,
      queryParams: {
        venueCreated: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
