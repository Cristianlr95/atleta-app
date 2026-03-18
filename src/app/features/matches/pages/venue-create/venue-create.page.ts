import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { catchError, firstValueFrom, of, timeout } from 'rxjs';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { FieldLocationsApiService } from 'src/app/features/fields/services/field-locations-api.service';
import {
  MetallicLocationPickerComponent,
  SaveFieldLocationRequest,
  SavedFieldLocation,
} from 'src/app/shared/ui/metallic-location-picker/metallic-location-picker.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { PageNavComponent } from 'src/app/shared/ui/page-nav/page-nav.component';

@Component({
  selector: 'app-venue-create-page',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    MetallicCardComponent,
    MetallicLocationPickerComponent,
    PageNavComponent,
  ],
  templateUrl: './venue-create.page.html',
  styleUrls: ['./venue-create.page.scss'],
})
export class VenueCreatePage implements OnInit {
  private readonly fieldLocationsApiService = inject(FieldLocationsApiService);
  private readonly navigationService = inject(NavigationService);
  private readonly route = inject(ActivatedRoute);

  readonly titleIconAsset = 'assets/icons/atleta/ic_match_location_24.svg';

  readonly fields = signal<SavedFieldLocation[]>([]);
  readonly loading = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly selectedLat = signal<number | null>(null);
  readonly selectedLng = signal<number | null>(null);

  readonly hasCoordinates = computed(() => this.selectedLat() !== null && this.selectedLng() !== null);

  async ngOnInit(): Promise<void> {
    void this.loadFields();
  }

  async onSaveField(payload: SaveFieldLocationRequest): Promise<void> {
    this.loading.set(true);
    this.saveError.set(null);

    try {
      const created = await firstValueFrom(this.fieldLocationsApiService.createFieldLocation(payload));
      await this.loadFields();

      const returnTo = this.route.snapshot.queryParamMap.get('returnTo') || '/matches/create';
      await this.navigationService.safeNavigateByUrl(`${returnTo}?venueCreated=${created.id}`);
    } catch {
      this.saveError.set('No se pudo guardar la cancha. Revisa los datos e intenta nuevamente.');
    } finally {
      this.loading.set(false);
    }
  }

  onCoordinatesChange(coords: { lat: number; lng: number }): void {
    this.selectedLat.set(coords.lat);
    this.selectedLng.set(coords.lng);
  }

  private async loadFields(): Promise<void> {
    const fields = await firstValueFrom(
      this.fieldLocationsApiService.getFieldLocations(undefined, true).pipe(
        timeout(4000),
        catchError(() => of([])),
      ),
    );
    this.fields.set(
      fields.map((item) => ({
        id: item.id,
        nombre: item.nombre,
        direccion: item.direccion,
        ciudad: item.ciudad,
        latitud: item.latitud,
        longitud: item.longitud,
        activo: item.activo,
      })),
    );
  }
}
