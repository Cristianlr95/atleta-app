import { inject, Injectable } from '@angular/core';
import { Match, Venue } from '../models/progressive-match.models';
import { VenueService } from './venue.service';

@Injectable({ providedIn: 'root' })
export class MatchVenueResolverService {
  private readonly venueService = inject(VenueService);

  async resolveVenue(match: Match): Promise<Venue | null> {
    if (match.venueId) {
      const byId = await this.venueService.getVenueById(match.venueId);
      if (byId) {
        return byId;
      }
    }

    if (match.latitude !== undefined && match.longitude !== undefined) {
      const byCoordinates = await this.venueService.getVenueByCoordinates(match.latitude, match.longitude);
      if (byCoordinates) {
        return byCoordinates;
      }
    }

    if (!match.venueName && !match.venueAddress && !match.location) {
      return null;
    }

    return {
      id: match.venueId ?? 0,
      name: match.venueName ?? 'Cancha seleccionada',
      address: match.venueAddress ?? match.location ?? 'Sin direccion',
      coordinates:
        match.latitude !== undefined && match.longitude !== undefined
          ? { lat: match.latitude, lng: match.longitude }
          : undefined,
      googlePlaceId: match.googlePlaceId,
    };
  }
}
