import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { AppToastService } from 'src/app/core/services/app-toast.service';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { MatchHistoryViewItem } from 'src/app/features/matches/services/match-history.service';
import { MatchHistoryService } from 'src/app/features/matches/services/match-history.service';
import { RatingsApiService } from 'src/app/features/ratings/services/ratings-api.service';
import { provideAppConfigMock, provideHttpTesting } from 'src/test/testbed-providers';
import { PlayerProfile } from '../../models/user.models';
import { PlayerPositionStateService } from '../../services/player-position-state.service';
import { UserApiService } from '../../services/user-api.service';
import { PlayerProfilePage } from './player-profile.page';

describe('PlayerProfilePage', () => {
  let component: PlayerProfilePage;
  let fixture: ComponentFixture<PlayerProfilePage>;
  let authSessionService: { currentSession: unknown };
  let userApiService: jasmine.SpyObj<UserApiService>;
  let appToastService: jasmine.SpyObj<AppToastService>;

  beforeEach(async () => {
    authSessionService = {
      currentSession: null,
    };
    userApiService = jasmine.createSpyObj<UserApiService>('UserApiService', [
      'getPlayerProfile',
      'changePassword',
    ]);
    userApiService.getPlayerProfile.and.returnValue(of({} as PlayerProfile));
    userApiService.changePassword.and.returnValue(of(void 0));
    appToastService = jasmine.createSpyObj<AppToastService>('AppToastService', ['success', 'error', 'info']);
    appToastService.success.and.resolveTo();
    appToastService.error.and.resolveTo();
    appToastService.info.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [PlayerProfilePage],
      providers: [
        provideAppConfigMock(),
        ...provideHttpTesting(),
        {
          provide: AuthSessionService,
          useValue: authSessionService,
        },
        {
          provide: UserApiService,
          useValue: userApiService,
        },
        {
          provide: AppToastService,
          useValue: appToastService,
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

  it('keeps Partidos Jugados aligned with victories, draws and losses', () => {
    const history: MatchHistoryViewItem[] = [
      buildHistoryItem(1, 'GANADO'),
      buildHistoryItem(2, 'EMPATADO'),
      buildHistoryItem(3, 'PERDIDO'),
      buildHistoryItem(4, null),
    ];

    (component as any).applyProfileData(
      'Jugador',
      'demo@atleta.cl',
      null,
      {
        playerProfileId: 'ath-1',
        alias: 'Demo',
        hybridOVR: 68.1,
        weightedOVR: 68.1,
        simpleOVR: 68.1,
        classification: 'Avanzado',
        versatilityIndex: 0.11,
        consistencyScore: 0.5,
        bestRole: 'ATAQUE',
        bestRoleRating: 79,
        totalRatings: 3,
        totalMatchesPlayed: 99,
        roleBreakdown: {
          ATAQUE: 79,
          MEDIOCAMPO: 60,
          CARRILERO: 50,
          DEFENSA: 48,
          ARQUERO: 30,
          DT: 40,
        },
      },
      [],
      history,
      [],
      [],
    );

    const played = Number(component.summaryStats.find((stat) => stat.label === 'Partidos Jugados')?.value);
    const totalOutcomes = component.outcomeStats.reduce((sum, stat) => sum + Number(stat.value), 0);

    expect(played).toBe(3);
    expect(played).toBe(totalOutcomes);
  });

  it('changes password for the authenticated athlete and clears sensitive fields', async () => {
    authSessionService.currentSession = {
      user: {
        atletaUuid: 'ath-1',
      },
    };
    component.currentPassword = 'old-pass-123';
    component.newPassword = 'new-pass-123';
    component.confirmNewPassword = 'new-pass-123';

    await component.onChangePassword();

    expect(userApiService.changePassword).toHaveBeenCalledOnceWith('ath-1', {
      currentPassword: 'old-pass-123',
      newPassword: 'new-pass-123',
    });
    expect(component.currentPassword).toBe('');
    expect(component.newPassword).toBe('');
    expect(component.confirmNewPassword).toBe('');
    expect(component.passwordChangeMessage).toBe('Contrasena actualizada correctamente.');
  });

  it('validates password confirmation before calling the API', async () => {
    authSessionService.currentSession = {
      user: {
        atletaUuid: 'ath-1',
      },
    };
    component.currentPassword = 'old-pass-123';
    component.newPassword = 'new-pass-123';
    component.confirmNewPassword = 'different-pass';

    await component.onChangePassword();

    expect(userApiService.changePassword).not.toHaveBeenCalled();
    expect(component.passwordChangeError).toBe('La confirmacion no coincide con la nueva contrasena.');
  });
});

function buildHistoryItem(
  id: number,
  outcome: MatchHistoryViewItem['outcome'],
): MatchHistoryViewItem {
  return {
    id,
    scheduledAtEpoch: null,
    modality: 'CINCO_VS_CINCO',
    status: 'FINALIZADO',
    displayStatusKey: 'FINISHED',
    modalityLabel: '5 vs 5',
    dateLabel: '2026-03-19',
    statusLabel: 'Finalizado',
    outcome,
    teamLabel: 'Demo',
    positionLabel: 'Ataque',
    minutesPlayedLabel: '60',
    goals: 0,
    assists: 0,
    matchRatingLabel: '70.0',
    mvpLabel: 'No',
    scoreLabel: '1 - 0',
  };
}
