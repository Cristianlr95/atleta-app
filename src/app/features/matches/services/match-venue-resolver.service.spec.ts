import { TestBed } from '@angular/core/testing';
import {
  Match,
  MatchGenderCategory,
  MatchSize,
  MatchStatus,
  MatchType,
  Venue,
} from '../models/progressive-match.models';
import { MatchVenueResolverService } from './match-venue-resolver.service';
import { VenueService } from './venue.service';

describe('MatchVenueResolverService', () => {
  let service: MatchVenueResolverService;
  let venueService: jasmine.SpyObj<VenueService>;

  beforeEach(() => {
    venueService = jasmine.createSpyObj<VenueService>('VenueService', ['getVenueById', 'getVenueByCoordinates']);

    TestBed.configureTestingModule({
      providers: [
        MatchVenueResolverService,
        { provide: VenueService, useValue: venueService },
      ],
    });

    service = TestBed.inject(MatchVenueResolverService);
  });

  it('prefers venue lookup by id', async () => {
    const venue: Venue = { id: 7, name: 'Cancha API', address: 'Centro' };
    venueService.getVenueById.and.resolveTo(venue);

    await expectAsync(service.resolveVenue(buildMatch({ venueId: 7 }))).toBeResolvedTo(venue);
    expect(venueService.getVenueByCoordinates).not.toHaveBeenCalled();
  });

  it('falls back to coordinates and then match text data', async () => {
    venueService.getVenueById.and.resolveTo(null);
    venueService.getVenueByCoordinates.and.resolveTo(null);

    const venue = await service.resolveVenue(
      buildMatch({
        venueId: 7,
        venueName: 'Cancha manual',
        venueAddress: 'Direccion manual',
        latitude: -36.8,
        longitude: -73.0,
        googlePlaceId: 'place-1',
      }),
    );

    expect(venue).toEqual({
      id: 7,
      name: 'Cancha manual',
      address: 'Direccion manual',
      coordinates: { lat: -36.8, lng: -73.0 },
      googlePlaceId: 'place-1',
    });
  });

  it('returns null when there is no venue evidence', async () => {
    await expectAsync(service.resolveVenue(buildMatch({ location: '' }))).toBeResolvedTo(null);
  });
});

function buildMatch(overrides: Partial<Match>): Match {
  return {
    id: 'match-1',
    creatorUuid: 'creator-1',
    creatorName: 'Creador',
    type: MatchType.FRIENDLY,
    modality: MatchSize.FIVE_VS_FIVE,
    genderCategory: MatchGenderCategory.MIXED,
    status: MatchStatus.CREATED,
    team: { id: 1, name: 'Equipo' },
    location: 'Cancha',
    scheduledAt: '2026-06-15T20:00:00',
    invitedCount: 0,
    minRequired: 10,
    homePlayers: [],
    awayPlayers: [],
    createdAt: '2026-06-15T10:00:00',
    ...overrides,
  };
}
