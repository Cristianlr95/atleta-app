import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface SavedFieldLocation {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  latitud: number;
  longitud: number;
  activo: boolean;
}

export interface SaveFieldLocationRequest {
  nombre: string;
  direccion: string;
  ciudad: string;
  latitud: number;
  longitud: number;
}

@Component({
  selector: 'app-metallic-location-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metallic-location-picker.component.html',
  styleUrls: ['./metallic-location-picker.component.scss'],
})
export class MetallicLocationPickerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() selectedLat: number | null = null;
  @Input() selectedLng: number | null = null;
  @Input() centerLat = -34.603722;
  @Input() centerLng = -58.381592;
  @Input() zoom = 13;
  @Input() useCurrentLocationOnInit = true;
  @Input() savedFields: SavedFieldLocation[] = [];
  @Input() isSavingField = false;

  @Output() coordinatesChange = new EventEmitter<LocationCoordinates>();
  @Output() saveField = new EventEmitter<SaveFieldLocationRequest>();

  @ViewChild('mapContainer', { static: true })
  private readonly mapContainer?: ElementRef<HTMLDivElement>;

  private leaflet?: typeof import('leaflet');
  private map?: import('leaflet').Map;
  private marker?: import('leaflet').CircleMarker;
  private savedFieldMarkersLayer?: import('leaflet').LayerGroup;

  searchQuery = '';
  isSearching = false;
  helperMessage = '';
  selectedFieldId = '';
  fieldName = '';
  fieldAddress = '';
  fieldCity = 'Concepcion';

  async ngAfterViewInit(): Promise<void> {
    if (typeof window === 'undefined' || !this.mapContainer) {
      return;
    }

    this.leaflet = await import('leaflet');
    this.map = this.leaflet.map(this.mapContainer.nativeElement, {
      center: [this.centerLat, this.centerLng],
      zoom: this.zoom,
      zoomControl: true,
      attributionControl: true,
    });

    this.leaflet
      .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      })
      .addTo(this.map);

    this.map.on('click', (event: import('leaflet').LeafletMouseEvent) => {
      this.updateSelectedLocation(event.latlng.lat, event.latlng.lng, false);
      this.selectedFieldId = '';
      this.helperMessage = 'Punto del mapa seleccionado.';
    });

    this.renderSavedFieldMarkers();

    const hasExternalSelection = this.selectedLat !== null && this.selectedLng !== null;
    if (hasExternalSelection) {
      this.syncMarkerFromInputs();
    } else if (this.useCurrentLocationOnInit) {
      await this.useCurrentLocation();
    }

    window.setTimeout(() => {
      this.map?.invalidateSize();
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    const selectedLatChanged = !!changes['selectedLat'];
    const selectedLngChanged = !!changes['selectedLng'];
    const savedFieldsChanged = !!changes['savedFields'];

    if (savedFieldsChanged) {
      this.renderSavedFieldMarkers();
    }

    if (selectedLatChanged || selectedLngChanged) {
      this.syncMarkerFromInputs();
    }
  }

  ngOnDestroy(): void {
    this.savedFieldMarkersLayer?.clearLayers();
    this.savedFieldMarkersLayer = undefined;
    this.map?.remove();
    this.map = undefined;
    this.marker = undefined;
  }

  async onSearchLocation(): Promise<void> {
    const query = this.searchQuery.trim();
    if (!query) {
      this.helperMessage = 'Escribe una direccion o lugar para buscar.';
      return;
    }

    this.isSearching = true;
    this.helperMessage = '';

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      if (!response.ok) {
        this.helperMessage = 'No se pudo consultar el buscador de ubicaciones.';
        return;
      }

      const results = (await response.json()) as Array<{ lat: string; lon: string }>;
      if (!Array.isArray(results) || results.length === 0) {
        this.helperMessage = 'No se encontraron resultados para esa busqueda.';
        return;
      }

      const lat = Number(results[0].lat);
      const lng = Number(results[0].lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        this.helperMessage = 'El resultado de la ubicacion no es valido.';
        return;
      }

      this.updateSelectedLocation(lat, lng, true);
      this.helperMessage = 'Ubicacion encontrada y seleccionada.';
      this.selectedFieldId = '';
    } catch {
      this.helperMessage = 'Error al buscar ubicacion. Intenta de nuevo.';
    } finally {
      this.isSearching = false;
    }
  }

  async useCurrentLocation(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.helperMessage = 'Tu navegador no soporta geolocalizacion.';
      return;
    }

    this.isSearching = true;
    this.helperMessage = '';

    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.updateSelectedLocation(position.coords.latitude, position.coords.longitude, true);
          this.helperMessage = 'Ubicacion actual aplicada.';
          this.selectedFieldId = '';
          resolve();
        },
        () => {
          this.helperMessage = 'No se pudo obtener tu ubicacion actual.';
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        },
      );
    });

    this.isSearching = false;
  }

  onSelectSavedField(event: Event): void {
    const selectedId = (event.target as HTMLSelectElement).value;
    this.selectedFieldId = selectedId;

    if (!selectedId) {
      return;
    }

    const selected = this.savedFields.find((item) => String(item.id) === selectedId);
    if (!selected) {
      return;
    }

    this.updateSelectedLocation(selected.latitud, selected.longitud, true);
    this.helperMessage = `Cancha seleccionada: ${selected.nombre}.`;
  }

  onSaveField(): void {
    const nombre = this.fieldName.trim();
    const direccion = this.fieldAddress.trim();
    const ciudad = this.fieldCity.trim();

    if (!nombre || !direccion || !ciudad) {
      this.helperMessage = 'Completa nombre, direccion y ciudad para guardar la cancha.';
      return;
    }

    if (this.selectedLat === null || this.selectedLng === null) {
      this.helperMessage = 'Selecciona primero un punto en el mapa para guardar la cancha.';
      return;
    }

    this.saveField.emit({
      nombre,
      direccion,
      ciudad,
      latitud: this.selectedLat,
      longitud: this.selectedLng,
    });
  }

  private syncMarkerFromInputs(): void {
    if (this.selectedLat === null || this.selectedLng === null) {
      return;
    }

    if (!Number.isFinite(this.selectedLat) || !Number.isFinite(this.selectedLng)) {
      return;
    }

    this.updateSelectedLocation(this.selectedLat, this.selectedLng, true);
  }

  private updateSelectedLocation(lat: number, lng: number, recenterMap: boolean): void {
    const roundedLat = this.roundCoordinate(lat);
    const roundedLng = this.roundCoordinate(lng);

    this.selectedLat = roundedLat;
    this.selectedLng = roundedLng;
    this.setMarker(roundedLat, roundedLng, recenterMap);
    this.coordinatesChange.emit({
      lat: roundedLat,
      lng: roundedLng,
    });
  }

  private setMarker(lat: number, lng: number, recenterMap: boolean): void {
    if (!this.map || !this.leaflet) {
      return;
    }

    const location: [number, number] = [this.roundCoordinate(lat), this.roundCoordinate(lng)];

    if (!this.marker) {
      this.marker = this.leaflet.circleMarker(location, {
        radius: 7,
        weight: 2,
        color: '#0f1625',
        fillColor: '#d4dce8',
        fillOpacity: 0.95,
      });
      this.marker.addTo(this.map);
    } else {
      this.marker.setLatLng(location);
    }

    if (recenterMap) {
      this.map.setView(location, this.map.getZoom(), { animate: false });
    }
  }

  private renderSavedFieldMarkers(): void {
    if (!this.map || !this.leaflet) {
      return;
    }

    if (!this.savedFieldMarkersLayer) {
      this.savedFieldMarkersLayer = this.leaflet.layerGroup().addTo(this.map);
    }

    this.savedFieldMarkersLayer.clearLayers();

    for (const field of this.savedFields) {
      if (!Number.isFinite(field.latitud) || !Number.isFinite(field.longitud)) {
        continue;
      }

      const marker = this.leaflet.circleMarker([field.latitud, field.longitud], {
        radius: 5,
        weight: 1.5,
        color: '#1f2a40',
        fillColor: '#9fc7ff',
        fillOpacity: 0.9,
      });

      marker.bindTooltip(field.nombre, {
        direction: 'top',
        opacity: 0.95,
      });

      marker.on('click', () => {
        this.selectedFieldId = String(field.id);
        this.updateSelectedLocation(field.latitud, field.longitud, true);
        this.helperMessage = `Cancha seleccionada: ${field.nombre}.`;
      });

      marker.addTo(this.savedFieldMarkersLayer);
    }
  }

  private roundCoordinate(value: number): number {
    return Math.round(value * 1_000_000) / 1_000_000;
  }
}
