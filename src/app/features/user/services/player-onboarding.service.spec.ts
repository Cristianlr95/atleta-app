import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { RatingsApiService } from '../../ratings/services/ratings-api.service';
import { PlayerPositionStateService } from './player-position-state.service';
import { PlayerOnboardingService } from './player-onboarding.service';
import { UserApiService } from './user-api.service';

describe('PlayerOnboardingService', () => {
  let service: PlayerOnboardingService;
  let userApiService: jasmine.SpyObj<UserApiService>;

  beforeEach(() => {
    userApiService = jasmine.createSpyObj<UserApiService>('UserApiService', [
      'createPlayerProfile',
      'assignPosition',
    ]);
    userApiService.createPlayerProfile.and.returnValue(
      of({
        atletaUuid: 'uuid-test',
        alias: 'Demo',
      }),
    );
    userApiService.assignPosition.and.returnValue(of(void 0));

    TestBed.configureTestingModule({
      providers: [
        PlayerOnboardingService,
        {
          provide: AuthSessionService,
          useValue: {
            currentSession: {
              user: {
                atletaUuid: 'uuid-test',
                email: 'demo@atleta.cl',
                nombre: 'Demo',
              },
              tokens: {
                accessToken: 'token',
              },
            },
          },
        },
        { provide: UserApiService, useValue: userApiService },
        {
          provide: RatingsApiService,
          useValue: {
            initializeBaseRatings: () => of([]),
          },
        },
        {
          provide: PlayerPositionStateService,
          useValue: {
            storePosition: () => void 0,
          },
        },
      ],
    });

    service = TestBed.inject(PlayerOnboardingService);
  });

  it('creates the player profile without resending genero', (done) => {
    service
      .completeOnboarding({
        alias: 'Demo',
        positions: [
          { positionId: 1, positionName: 'Delantero', prioridad: 1 },
          { positionId: 2, positionName: 'Mediocampo', prioridad: 2 },
          { positionId: 3, positionName: 'Defensa', prioridad: 3 },
        ],
      })
      .subscribe(() => {
        expect(userApiService.createPlayerProfile).toHaveBeenCalledWith({
          atletaUuid: 'uuid-test',
          alias: 'Demo',
        });
        done();
      });
  });
});
