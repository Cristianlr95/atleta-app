import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { MatchHistoryService } from 'src/app/features/matches/services/match-history.service';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { InvitationsStore } from 'src/app/features/matches/stores/invitations.store';
import { RatingsApiService } from 'src/app/features/ratings/services/ratings-api.service';
import { TeamApiService } from 'src/app/features/teams/services/team-api.service';
import { UserApiService } from 'src/app/features/user/services/user-api.service';
import { HomePage } from './home.page';

describe('HomePage OVR', () => {
  let fixture: ComponentFixture<HomePage>;
  let rating: number | null;
  let historyFails: boolean;
  let teamsFail: boolean;
  let invitationsFail: boolean;
  let profile: unknown;

  beforeEach(async () => {
    rating = 63.4;
    historyFails = false;
    teamsFail = false;
    invitationsFail = false;
    profile = null;
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        { provide: AuthSessionService, useValue: { currentSession: { user: { atletaUuid: 'player-1', nombre: 'Ana' } } } },
        { provide: NavigationService, useValue: { safeNavigate: jasmine.createSpy('safeNavigate') } },
        { provide: UserApiService, useValue: { getPlayerProfile: () => of(profile) } },
        { provide: RatingsApiService, useValue: { getOverall: () => of(rating === null ? null : { hybridOVR: rating }) } },
        { provide: MatchHistoryService, useValue: { getPlayerHistory: () => historyFails ? throwError(() => new Error('offline')) : of([]) } },
        { provide: TeamApiService, useValue: { getByPlayer: () => teamsFail ? throwError(() => new Error('offline')) : of([]) } },
        { provide: InvitationsStore, useValue: { loadPendingInvitations: async () => !invitationsFail, pendingInvitations: () => [] } },
        { provide: NotificationBadgeService, useValue: { refresh: async () => {}, totalPending: () => 0 } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HomePage);
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
    const xp = fixture.nativeElement.querySelectorAll('.home-metric')[2].textContent;
    expect(xp).toContain('XP posición principal');
    expect(xp).toContain('120');
    expect(xp).not.toContain('170');
    expect(fixture.nativeElement.textContent).toContain('Nivel de posición 2');
    expect(fixture.nativeElement.querySelector('[role=progressbar]').getAttribute('aria-valuetext')).toBe('20 de 125 XP');
  });

  it('no muestra XP inventada si la posición principal no tiene datos válidos', async () => {
    profile = { positions: [{ prioridad: 1, xp: -3 }] };
    fixture.componentInstance.ionViewWillEnter();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.home-metric strong')[2].textContent.trim()).toBe('--');
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

  it('ofrece crear equipo cuando el jugador no tiene uno', () => {
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.home-team').click();
    expect(TestBed.inject(NavigationService).safeNavigate).toHaveBeenCalledWith(['/sessions/create']);
    expect(fixture.nativeElement.querySelector('.home-team').textContent).toContain('Crear equipo');
  });

  it('no afirma que no hay equipo si falla su carga y permite reintentar', async () => {
    teamsFail = true;
    fixture.componentInstance.ionViewWillEnter();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.home-team').textContent).toContain('Reintentar');
    expect(fixture.nativeElement.querySelector('.home-team').textContent).not.toContain('Sin equipo');
    teamsFail = false;
    fixture.nativeElement.querySelector('.home-team').click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.home-team').textContent).toContain('Sin equipo');
    expect(TestBed.inject(NavigationService).safeNavigate).not.toHaveBeenCalled();
  });

  it('no muestra cero invitaciones si no se pudieron cargar', async () => {
    invitationsFail = true;
    fixture.componentInstance.ionViewWillEnter();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.home-metric strong')[1].textContent.trim()).toBe('--');
    expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar las invitaciones');
  });

  it('abre el historial desde la actividad reciente', () => {
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.home-activity__heading button').click();
    expect(TestBed.inject(NavigationService).safeNavigate).toHaveBeenCalledWith(['/matches/history']);
  });

  for (const scenario of [
    { value: 63.4, expected: '63' },
    { value: 0, expected: '0' },
    { value: null, expected: '--' },
  ]) {
    it(`shows ${scenario.expected} for API OVR ${scenario.value}`, async () => {
      rating = scenario.value;
      fixture.componentInstance.ionViewWillEnter();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.home-metric strong').textContent.trim()).toBe(scenario.expected);
    });
  }
});
