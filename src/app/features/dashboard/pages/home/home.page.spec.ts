import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { MatchHistoryService } from 'src/app/features/matches/services/match-history.service';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { InvitationsStore } from 'src/app/features/matches/stores/invitations.store';
import { RatingsApiService } from 'src/app/features/ratings/services/ratings-api.service';
import { TeamApiService } from 'src/app/features/teams/services/team-api.service';
import { UserApiService } from 'src/app/features/user/services/user-api.service';
import { AppToastService } from 'src/app/core/services/app-toast.service';
import { ErrorMapperService } from 'src/app/core/services/error-mapper.service';
import { SocialApiService } from 'src/app/features/social/services/social-api.service';
import { TeamActiveMember } from 'src/app/features/teams/models/team.models';
import { HomePage } from './home.page';

describe('HomePage agenda', () => {
  let fixture: ComponentFixture<HomePage>;
  let historyFails: boolean;
  let invitationsFail: boolean;
  let profile: unknown;
  let component: HomePage;
  let teamApiService: jasmine.SpyObj<TeamApiService>;
  let socialApiService: jasmine.SpyObj<SocialApiService>;
  let appToastService: jasmine.SpyObj<AppToastService>;

  beforeEach(async () => {
    historyFails = false;
    invitationsFail = false;
    profile = null;
    teamApiService = jasmine.createSpyObj<TeamApiService>('TeamApiService', ['getByPlayer', 'getActiveMembers']);
    teamApiService.getByPlayer.and.returnValue(of([]));
    teamApiService.getActiveMembers.and.returnValue(of([]));
    socialApiService = jasmine.createSpyObj<SocialApiService>('SocialApiService', ['createTeamInvite', 'searchPlayers']);
    appToastService = jasmine.createSpyObj<AppToastService>('AppToastService', ['error', 'success']);
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        { provide: AuthSessionService, useValue: { currentSession: { user: { atletaUuid: 'player-1', nombre: 'Ana' } } } },
        { provide: NavigationService, useValue: { safeNavigate: jasmine.createSpy('safeNavigate').and.resolveTo(true) } },
        { provide: UserApiService, useValue: { getPlayerProfile: () => of(profile) } },
        { provide: RatingsApiService, useValue: { getOverall: jasmine.createSpy('getOverall').and.returnValue(of(null)) } },
        { provide: MatchHistoryService, useValue: { getPlayerHistory: () => historyFails ? throwError(() => new Error('offline')) : of([]) } },
        { provide: TeamApiService, useValue: teamApiService },
        { provide: SocialApiService, useValue: socialApiService },
        { provide: AppToastService, useValue: appToastService },
        { provide: ErrorMapperService, useValue: {} },
        { provide: InvitationsStore, useValue: { loadPendingInvitations: async () => !invitationsFail, pendingInvitations: () => [] } },
        { provide: NotificationBadgeService, useValue: { refresh: async () => {}, totalPending: () => 0 } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
  });

  it('no presenta XP ni nivel derivados del OVR como datos reales', async () => {
    fixture.componentInstance.ionViewWillEnter();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('XP y nivel no disponibles');
    expect(fixture.nativeElement.textContent).not.toContain('7608');
    expect(fixture.nativeElement.querySelector('[role=progressbar]')).toBeNull();
  });

  it('muestra XP de la posición principal sin inventar un nivel', async () => {
    profile = { positions: [{ prioridad: 2, xp: 50 }, { prioridad: 1, xp: 120 }] };
    fixture.componentInstance.ionViewWillEnter();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nivel de posición 2');
    expect(fixture.nativeElement.querySelector('[role=progressbar]').getAttribute('aria-valuetext')).toBe('20 de 125 XP');
  });

  it('no muestra XP inventada si la posición principal no tiene datos válidos', async () => {
    profile = { positions: [{ prioridad: 1, xp: -3 }] };
    fixture.componentInstance.ionViewWillEnter();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=progressbar]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('XP y nivel no disponibles.');
  });

  it('permite reintentar la actividad si falla el historial', async () => {
    historyFails = true;
    fixture.componentInstance.ionViewWillEnter();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se pudo cargar la actividad reciente');
    expect(fixture.nativeElement.textContent).not.toContain('Sin partido agendado');
    expect(fixture.nativeElement.textContent).not.toContain('0 partidos consecutivos');

    historyFails = false;
    fixture.nativeElement.querySelector('.home-retry').click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin partido agendado');
    expect(fixture.nativeElement.querySelector('.home-retry')).toBeNull();
  });

  it('muestra el equipo en Inicio y reserva identidad y OVR al Perfil', async () => {
    fixture.componentInstance.ionViewWillEnter();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.home-team')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.home-identity')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('OVR');
    expect(TestBed.inject(RatingsApiService).getOverall).not.toHaveBeenCalled();
    expect(teamApiService.getByPlayer).toHaveBeenCalledOnceWith('player-1');
  });

  it('no muestra cero invitaciones si no se pudieron cargar', async () => {
    invitationsFail = true;
    fixture.componentInstance.ionViewWillEnter();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.home-invitations strong').textContent.trim()).toBe('--');
    expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar las invitaciones');
  });

  it('opens the team roster from its single member action', () => {
    const navigate = TestBed.inject(NavigationService).safeNavigate;
    teamApiService.getByPlayer.and.returnValue(of([{ id: 7, nombre: 'Azul' }]));
    component.loadTeams();
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.profile-team__btn--icon');
    expect(button.getAttribute('aria-label')).toBe('Ver integrantes de Azul');
    button.click();
    expect(navigate).toHaveBeenCalledWith(['/teams', '7']);
  });

  it('offers team creation in empty Inicio', () => {
    const navigate = TestBed.inject(NavigationService).safeNavigate;
    component.loadTeams();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.home-create-team').click();
    expect(navigate).toHaveBeenCalledWith(['/sessions/create']);
  });

  it('does not offer team creation on a team API failure and retries', () => {
    const teams = teamApiService.getByPlayer.and.returnValue(throwError(() => ({ status: 500 })));
    component.ionViewWillEnter();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar los equipos.');
    expect(fixture.nativeElement.querySelector('.home-create-team')).toBeNull();
    teams.and.returnValue(of([]));
    fixture.nativeElement.querySelector('.home-teams-retry').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.home-teams-retry')).toBeNull();
    expect(fixture.nativeElement.querySelector('.home-create-team')).not.toBeNull();
  });

  it('reuses the roster in the invite form and hides it on 403 and on reentry until confirmed', async () => {
    teamApiService.getByPlayer.and.returnValue(of([{ id: 7, nombre: 'Azul', creadorUuid: 'founder' }]));
    const captain: TeamActiveMember = { playerUuid: 'player-1', alias: 'Ana', rol: 'CAPITAN', primaryPositionId: null, primaryPositionName: null };
    const roster = new Subject<TeamActiveMember[]>();
    teamApiService.getActiveMembers.and.returnValue(roster);
    component.ionViewWillEnter();
    fixture.detectChanges();
    const adminButton = () => fixture.nativeElement.querySelector('.profile-team__btn--admin');
    const inviteInput = () => fixture.nativeElement.querySelector('.profile-team-invite__input');
    expect(adminButton()).toBeNull();

    roster.next([captain]);
    roster.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.profile-team__btn--danger')).toBeNull();
    adminButton().click();
    fixture.detectChanges();
    expect(inviteInput()).not.toBeNull();
    expect(teamApiService.getActiveMembers).toHaveBeenCalledOnceWith(7);

    const updatedRoster = new Subject<TeamActiveMember[]>();
    teamApiService.getActiveMembers.and.returnValue(updatedRoster);
    socialApiService.createTeamInvite.and.returnValue(throwError(() => ({ status: 403 })));
    await component.onSendTeamInvite('target');
    fixture.detectChanges();
    expect(inviteInput()).toBeNull();
    expect(appToastService.error).toHaveBeenCalledOnceWith('Solo el capitán activo del equipo puede enviar invitaciones.');
    updatedRoster.next([{ ...captain, rol: 'JUGADOR' }]);
    updatedRoster.complete();
    await component.onSendTeamInvite('target');
    expect(socialApiService.createTeamInvite).toHaveBeenCalledOnceWith({ teamId: 7, requesterUuid: 'player-1', targetUuid: 'target' });

    component.ionViewWillLeave();
    teamApiService.getActiveMembers.and.returnValue(of([captain]));
    component.ionViewWillEnter();
    fixture.detectChanges();
    expect(adminButton()).not.toBeNull();
    expect(teamApiService.getActiveMembers.calls.allArgs()).toEqual([[7], [7], [7]]);
  });

  it('abre el historial desde la actividad reciente', () => {
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.home-activity__heading button').click();
    expect(TestBed.inject(NavigationService).safeNavigate).toHaveBeenCalledWith(['/matches/history']);
  });

});
