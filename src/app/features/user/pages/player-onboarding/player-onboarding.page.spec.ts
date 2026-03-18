import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { PlayerOnboardingService } from '../../services/player-onboarding.service';
import { UserApiService } from '../../services/user-api.service';
import { PlayerOnboardingPage } from './player-onboarding.page';

describe('PlayerOnboardingPage', () => {
  let component: PlayerOnboardingPage;
  let fixture: ComponentFixture<PlayerOnboardingPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerOnboardingPage],
      providers: [
        {
          provide: AuthSessionService,
          useValue: {
            currentSession: {
              user: {
                atletaUuid: 'uuid-test',
              },
            },
          },
        },
        {
          provide: UserApiService,
          useValue: {
            getPositions: () => of([{ id: 1, nombre: 'Delantero' }]),
          },
        },
        {
          provide: PlayerOnboardingService,
          useValue: {
            completeOnboarding: () => of(void 0),
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

    fixture = TestBed.createComponent(PlayerOnboardingPage);
    component = fixture.componentInstance;
    component.ionViewWillEnter();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should include DT option when API does not return it', () => {
    const labels = component.positionOptions.map((option) => option.label);
    expect(labels).toContain('DT');
  });
});
