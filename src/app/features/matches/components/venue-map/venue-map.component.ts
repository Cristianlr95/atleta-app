import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Coordinates } from '../../models/progressive-match.models';

@Component({
  selector: 'app-venue-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './venue-map.component.html',
  styleUrls: ['./venue-map.component.scss'],
})
export class VenueMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() coordinates: Coordinates | null = null;
  @Input() zoom = 16;

  @ViewChild('mapContainer', { static: true })
  private readonly mapContainer?: ElementRef<HTMLDivElement>;

  private leaflet?: typeof import('leaflet');
  private map?: import('leaflet').Map;
  private marker?: import('leaflet').CircleMarker;
  private viewReady = false;

  get resolvedCoordinates(): Coordinates | null {
    if (!this.coordinates) {
      return null;
    }

    const lat = Number(this.coordinates.lat);
    const lng = Number(this.coordinates.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }

  async ngAfterViewInit(): Promise<void> {
    this.viewReady = true;
    await this.renderMap();
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['coordinates']) {
      await this.renderMap();
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = undefined;
    this.marker = undefined;
  }

  private async renderMap(): Promise<void> {
    if (!this.viewReady || typeof window === 'undefined' || !this.mapContainer) {
      return;
    }

    const coords = this.resolvedCoordinates;
    if (!coords) {
      return;
    }

    if (!this.leaflet) {
      this.leaflet = await import('leaflet');
    }

    if (!this.map) {
      this.map = this.leaflet.map(this.mapContainer.nativeElement, {
        center: [coords.lat, coords.lng],
        zoom: this.zoom,
        zoomControl: false,
        attributionControl: false,
      });

      this.leaflet
        .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        })
        .addTo(this.map);
    }

    if (!this.marker) {
      this.marker = this.leaflet.circleMarker([coords.lat, coords.lng], {
        radius: 7,
        weight: 2,
        color: '#0f1625',
        fillColor: '#d4dce8',
        fillOpacity: 0.95,
      });
      this.marker.addTo(this.map);
    }

    this.marker.setLatLng([coords.lat, coords.lng]);
    this.map.setView([coords.lat, coords.lng], this.zoom, { animate: false });
    window.setTimeout(() => this.map?.invalidateSize(), 0);
  }
}
