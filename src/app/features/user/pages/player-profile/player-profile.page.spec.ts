import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AppToastService } from 'src/app/core/services/app-toast.service';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { AuthService } from 'src/app/features/auth/services/auth.service';
import { MatchHistoryViewItem } from 'src/app/features/matches/services/match-history.service';
import { MatchHistoryService } from 'src/app/features/matches/services/match-history.service';
import { MatchType } from 'src/app/features/matches/models/progressive-match.models';
import { RatingsApiService } from 'src/app/features/ratings/services/ratings-api.service';
import { provideAppConfigMock, provideHttpTesting } from 'src/test/testbed-providers';
import { PlayerProfile } from '../../models/user.models';
import { PlayerPositionStateService } from '../../services/player-position-state.service';
import { UserApiService } from '../../services/user-api.service';
import { PlayerProfilePage } from './player-profile.page';

describe('PlayerProfilePage', () => {
  let component: PlayerProfilePage;
  let fixture: ComponentFixture<PlayerProfilePage>;
  let authSessionService: { currentSession: any; updateCurrentUser: jasmine.Spy };
  let userApiService: jasmine.SpyObj<UserApiService>;
  let appToastService: jasmine.SpyObj<AppToastService>;
  let authService: jasmine.SpyObj<AuthService>;
  let navigationService: jasmine.SpyObj<NavigationService>;

  beforeEach(async () => {
    authSessionService = {
      currentSession: null,
      updateCurrentUser: jasmine.createSpy('updateCurrentUser'),
    };
    userApiService = jasmine.createSpyObj<UserApiService>('UserApiService', [
      'getPlayerProfile',
      'changePassword',
      'getPositions',
      'updatePlayerProfile',
    ]);
    userApiService.getPlayerProfile.and.returnValue(of({} as PlayerProfile));
    userApiService.changePassword.and.returnValue(of(void 0));
    userApiService.getPositions.and.returnValue(of([
      { id: 1, nombre: 'Arquero' },
      { id: 2, nombre: 'Defensa' },
      { id: 3, nombre: 'Delantero' },
    ]));
    appToastService = jasmine.createSpyObj<AppToastService>('AppToastService', ['success', 'error', 'info']);
    appToastService.success.and.resolveTo();
    appToastService.error.and.resolveTo();
    appToastService.info.and.resolveTo();
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    navigationService = jasmine.createSpyObj<NavigationService>('NavigationService', [
      'goToLoginAfterLogout',
    ]);
    navigationService.goToLoginAfterLogout.and.resolveTo(true);

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
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: NavigationService,
          useValue: navigationService,
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
            clearForPlayer: jasmine.createSpy('clearForPlayer'),
            storePosition: jasmine.createSpy('storePosition'),
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

  it('clears the authenticated session and replaces the history entry on logout', async () => {
    await component.onLogout();

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(navigationService.goToLoginAfterLogout).toHaveBeenCalledTimes(1);
    expect(component.logoutLoading).toBeFalse();
  });

  it('updates name, alias and three prioritized positions without a new login', async () => {
    authSessionService.currentSession = {
      user: { atletaUuid: 'ath-1', nombre: 'Anterior', email: 'demo@atleta.cl' },
    };
    userApiService.updatePlayerProfile.and.returnValue(of({
      atletaUuid: 'ath-1',
      nombre: 'Nombre editado',
      alias: 'AliasEditado',
    }));
    component.displayName = 'Anterior';
    component.displayAlias = 'AnteriorAlias';
    (component as any).assignedPositions = [
      assignedPosition(1, 1),
      assignedPosition(2, 2),
      assignedPosition(3, 3),
    ];

    await component.onOpenProfileEdit();
    component.editName = 'Nombre editado';
    component.editAlias = 'AliasEditado';
    await component.onSaveProfile();

    expect(userApiService.updatePlayerProfile).toHaveBeenCalledOnceWith('ath-1', {
      nombre: 'Nombre editado',
      alias: 'AliasEditado',
      positionIds: [1, 2, 3],
    });
    expect(authSessionService.updateCurrentUser).toHaveBeenCalledOnceWith({ nombre: 'Nombre editado' });
    expect(component.displayName).toBe('Nombre editado');
    expect(component.profileEditOpen).toBeFalse();
  });

  it('shows a specific duplicate alias error and keeps the editor open', async () => {
    authSessionService.currentSession = {
      user: { atletaUuid: 'ath-1', nombre: 'Anterior', email: 'demo@atleta.cl' },
    };
    userApiService.updatePlayerProfile.and.returnValue(
      throwError(() => ({ status: 409, message: '' })),
    );
    component.profileEditOpen = true;
    component.editName = 'Nombre editado';
    component.editAlias = 'AliasOcupado';
    component.editPositionIds = ['1', '2', '3'];

    await component.onSaveProfile();

    expect(component.profileEditError).toBe('Ese alias ya esta en uso. Elige otro.');
    expect(component.profileEditOpen).toBeTrue();
  });

  it('keeps edits available when the network fails', async () => {
    authSessionService.currentSession = {
      user: { atletaUuid: 'ath-1', nombre: 'Anterior', email: 'demo@atleta.cl' },
    };
    userApiService.updatePlayerProfile.and.returnValue(
      throwError(() => ({ status: 0, message: '' })),
    );
    component.profileEditOpen = true;
    component.editName = 'Nombre editado';
    component.editAlias = 'AliasEditado';
    component.editPositionIds = ['1', '2', '3'];

    await component.onSaveProfile();

    expect(component.profileEditError).toBe('No se pudo conectar al servidor. Intenta nuevamente.');
    expect(component.editName).toBe('Nombre editado');
    expect(component.profileEditOpen).toBeTrue();
  });
});

function assignedPosition(positionId: number, prioridad: 1 | 2 | 3) {
  return {
    playerUuid: 'ath-1',
    positionId,
    positionName: `Posicion ${positionId}`,
    prioridad,
    assignedAt: '2026-07-21T20:00:00.000Z',
  };
}

function buildHistoryItem(
  id: number,
  outcome: MatchHistoryViewItem['outcome'],
): MatchHistoryViewItem {
  return {
    id,
    scheduledAtEpoch: null,
    modality: 'CINCO_VS_CINCO',
    matchType: MatchType.FRIENDLY,
    typeLabel: 'Amistoso',
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
