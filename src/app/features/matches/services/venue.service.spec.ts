import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FieldLocationsApiService } from 'src/app/features/fields/services/field-locations-api.service';
import { VenueService } from './venue.service';

describe('VenueService', () => {
  let service: VenueService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VenueService,
        {
          provide: FieldLocationsApiService,
          useValue: {
            getFieldLocations: () =>
              of([
                {
                  id: 1,
                  nombre: 'Cancha Norte',
                  direccion: 'Av Norte 123',
                  ciudad: 'Concepcion',
                  latitud: -36.82,
                  longitud: -73.05,
                  activo: true,
                  createdAt: '',
                  updatedAt: null,
                },
              ]),
          },
        },
      ],
    });

    service = TestBed.inject(VenueService);
  });

  it('maps and filters venues by query', async () => {
    const result = await service.searchVenues('norte');

    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Cancha Norte');
    expect(result[0].coordinates?.lat).toBe(-36.82);
  });

  it('reports a failed venue lookup instead of treating it as an empty list', async () => {
    spyOn(TestBed.inject(FieldLocationsApiService), 'getFieldLocations').and.returnValue(throwError(() => new Error('offline')));
    await expectAsync(service.getActiveVenues()).toBeRejected();
  });
});
