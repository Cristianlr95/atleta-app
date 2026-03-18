import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { MatchHistoryService } from 'src/app/features/matches/services/match-history.service';
import { RatingsApiService } from 'src/app/features/ratings/services/ratings-api.service';
import { provideAppConfigMock, provideHttpTesting } from 'src/test/testbed-providers';
import { PlayerPositionStateService } from '../../services/player-position-state.service';
import { UserApiService } from '../../services/user-api.service';
import { PlayerProfilePage } from './player-profile.page';

describe('PlayerProfilePage', () => {
  let component: PlayerProfilePage;
  let fixture: ComponentFixture<PlayerProfilePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerProfilePage],
      providers: [
        provideAppConfigMock(),
        ...provideHttpTesting(),
        {
          provide: AuthSessionService,
          useValue: {
            currentSession: null,
          },
        },
        {
          provide: UserApiService,
          useValue: {
            getPlayerProfile: () => of(null),
          },
        },
        {
          provide: RatingsApiService,
          useValue: {
            getOverall: () => of(null),
            getByRole: () => of([]),
          },
        },
        {
          provide: MatchHistoryService,
          useValue: {
            getPlayerHistory: () => of([]),
          },
        },
        {
          provide: PlayerPositionStateService,
          useValue: {
            getByPlayer: () => [],
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: () => Promise.resolve(true),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
