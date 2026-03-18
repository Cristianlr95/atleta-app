import { Injectable } from '@angular/core';
import { catchError, firstValueFrom, of, timeout } from 'rxjs';
import { CreateFieldLocationRequest, FieldLocation } from 'src/app/features/fields/models/field-location.models';
import { FieldLocationsApiService } from 'src/app/features/fields/services/field-locations-api.service';
import { Venue } from '../models/progressive-match.models';

@Injectable({ providedIn: 'root' })
export class VenueService {
  private readonly requestTimeoutMs = 4000;
  private readonly cacheTtlMs = 30000;
  private cacheExpiresAt = 0;
  private cachedFields: FieldLocation[] = [];
  private inFlightFields: Promise<FieldLocation[]> | null = null;

  constructor(private readonly fieldLocationsApiService: FieldLocationsApiService) {}

  async getActiveVenues(): Promise<Venue[]> {
    const fields = await this.fetchFieldsSafe();
    return fields.slice(0, 30).map((item) => this.mapFieldToVenue(item));
  }

  async searchVenues(query: string): Promise<Venue[]> {
    const normalized = query.trim().toLowerCase();
    const fields = await this.fetchFieldsSafe();

    const filtered = normalized
      ? fields.filter((item) => this.matchesQuery(item, normalized))
      : fields;

    return filtered.slice(0, 12).map((item) => this.mapFieldToVenue(item));
  }

  async getVenueById(id: number): Promise<Venue | null> {
    const fields = await this.fetchFieldsSafe();
    const found = fields.find((field) => field.id === id);
    return found ? this.mapFieldToVenue(found) : null;
  }

  async getVenueByCoordinates(lat: number, lng: number): Promise<Venue | null> {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    const fields = await this.fetchFieldsSafe();
    if (fields.length === 0) {
      return null;
    }

    const targetLat = Number(lat);
    const targetLng = Number(lng);
    const venues = fields.map((item) => this.mapFieldToVenue(item)).filter((item) => !!item.coordinates);

    if (venues.length === 0) {
      return null;
    }

    let nearest: Venue | null = null;
    let nearestDistance = Number.MAX_SAFE_INTEGER;

    for (const venue of venues) {
      const coords = venue.coordinates!;
      const distance = this.distanceMeters(targetLat, targetLng, coords.lat, coords.lng);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = venue;
      }
    }

    return nearestDistance <= 120 ? nearest : null;
  }

  async createVenue(input: { name: string; address: string; city: string; lat?: number; lng?: number }): Promise<Venue> {
    const payload: CreateFieldLocationRequest = {
      nombre: input.name.trim(),
      direccion: input.address.trim(),
      ciudad: input.city.trim() || 'Concepcion',
      latitud: Number.isFinite(input.lat) ? (input.lat as number) : -36.82699,
      longitud: Number.isFinite(input.lng) ? (input.lng as number) : -73.04977,
      activo: true,
    };

    const created = await firstValueFrom(this.fieldLocationsApiService.createFieldLocation(payload));
    this.cachedFields = [created, ...this.cachedFields];
    this.cacheExpiresAt = Date.now() + this.cacheTtlMs;
    return this.mapFieldToVenue(created);
  }

  private async fetchFieldsSafe(): Promise<FieldLocation[]> {
    const now = Date.now();
    if (this.cachedFields.length > 0 && now < this.cacheExpiresAt) {
      return this.cachedFields;
    }

    if (this.inFlightFields) {
      return this.inFlightFields;
    }

    this.inFlightFields = firstValueFrom(
      this.fieldLocationsApiService.getFieldLocations(undefined, true).pipe(
        timeout(this.requestTimeoutMs),
        catchError(() => of([] as FieldLocation[])),
      ),
    )
      .then((fields) => {
        this.cachedFields = fields;
        this.cacheExpiresAt = Date.now() + this.cacheTtlMs;
        return fields;
      })
      .finally(() => {
        this.inFlightFields = null;
      });

    return this.inFlightFields;
  }

  private matchesQuery(field: FieldLocation, query: string): boolean {
    return (
      field.nombre.toLowerCase().includes(query) ||
      field.direccion.toLowerCase().includes(query) ||
      field.ciudad.toLowerCase().includes(query)
    );
  }

  private mapFieldToVenue(field: FieldLocation): Venue {
    const lat = Number(field.latitud);
    const lng = Number(field.longitud);

    return {
      id: field.id,
      name: field.nombre,
      address: field.direccion,
      city: field.ciudad,
      coordinates: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined,
    };
  }

  private distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadius = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }
}
