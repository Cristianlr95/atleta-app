import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { AlertController, IonModal } from '@ionic/angular';
import { NEVER, Subject, of, throwError } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { RatingsApiService } from 'src/app/features/ratings/services/ratings-api.service';
import { UserApiService } from 'src/app/features/user/services/user-api.service';
import { TeamActiveMember, TeamCaptainResponse, TeamSummary } from '../../models/team.models';
import { TeamApiService } from '../../services/team-api.service';
import { TeamDetailPage } from './team-detail.page';

describe('TeamDetailPage', () => {
  let fixture: ComponentFixture<TeamDetailPage>;
  let component: TeamDetailPage;
  let teamApiService: jasmine.SpyObj<TeamApiService>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  let userApiService: jasmine.SpyObj<UserApiService>;
  let ratingsApiService: jasmine.SpyObj<RatingsApiService>;
  let alertController: jasmine.SpyObj<AlertController>;
  let session: { currentSession: { user: { atletaUuid: string } } };
  const captain: TeamActiveMember = {
    playerUuid: 'player-uuid', alias: 'Demo10', rol: 'CAPITAN', primaryPositionId: 9, primaryPositionName: 'Delantero',
  };
  const successor: TeamActiveMember = {
    playerUuid: 'successor', alias: 'Demo11', rol: 'JUGADOR', primaryPositionId: 3, primaryPositionName: 'Defensa',
  };

  beforeEach(async () => {
    session = { currentSession: { user: { atletaUuid: captain.playerUuid } } };
    teamApiService = jasmine.createSpyObj<TeamApiService>('TeamApiService', [
      'getById', 'getActiveMembers', 'transferCaptain', 'removeMember', 'leaveTeam', 'updateTeamName', 'deleteTeam',
    ]);
    navigationService = jasmine.createSpyObj<NavigationService>('NavigationService', [
      'safeNavigate', 'goBackOrProfile', 'goToProfile',
    ]);
    userApiService = jasmine.createSpyObj<UserApiService>('UserApiService', ['getPublicPlayerProfile']);
    ratingsApiService = jasmine.createSpyObj<RatingsApiService>('RatingsApiService', ['getOverall']);
    alertController = jasmine.createSpyObj<AlertController>('AlertController', ['create']);
    navigationService.safeNavigate.and.resolveTo(true);
    userApiService.getPublicPlayerProfile.and.returnValue(of({ pictureUrl: '/demo.jpg' } as any));
    ratingsApiService.getOverall.and.returnValue(of({ hybridOVR: 74 } as any));
    teamApiService.getById.and.returnValue(of({
      id: 77, nombre: 'Atleta FC', anioFundacion: 2020, creadorUuid: captain.playerUuid,
    }));
    teamApiService.getActiveMembers.and.returnValue(of([{
      playerUuid: 'player-uuid', alias: 'Demo10', rol: 'CAPITAN', primaryPositionId: 9,
      primaryPositionName: 'Delantero',
    }]));

    await TestBed.configureTestingModule({
      imports: [TeamDetailPage],
      providers: [
        { provide: TeamApiService, useValue: teamApiService },
        { provide: AuthSessionService, useValue: session },
        { provide: NavigationService, useValue: navigationService },
        { provide: UserApiService, useValue: userApiService },
        { provide: RatingsApiService, useValue: ratingsApiService },
        { provide: AlertController, useValue: alertController },
        { provide: NotificationBadgeService, useValue: { totalPending: () => 0 } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '77' } } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TeamDetailPage);
    component = fixture.componentInstance;
  });

  function loadCaptainRoster(): void {
    teamApiService.getActiveMembers.and.returnValue(of([captain, successor]));
    component.ionViewWillEnter();
    fixture.detectChanges();
  }

  function selectSuccessor(): HTMLButtonElement {
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#captain-target');
    select.value = successor.playerUuid;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.captain-transfer button');
  }

  function button(label: string): HTMLButtonElement | undefined {
    return Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button'))
      .find(item => item.textContent?.trim() === label);
  }

  function openNameEditor(): HTMLInputElement {
    button('Editar nombre')!.click();
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('#team-name');
  }

  function enterName(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function submit(form: string): void {
    fixture.nativeElement.querySelector(form).dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
  }

  it('shows edit and archive only to the active captain, including a successor', () => {
    loadCaptainRoster();
    expect(button('Editar nombre')).toBeDefined();
    expect(button('Archivar equipo')).toBeDefined();
    const pending = new Subject<TeamActiveMember[]>();
    teamApiService.getActiveMembers.and.returnValue(pending);
    component.ionViewWillEnter();
    fixture.detectChanges();
    expect(button('Editar nombre')).toBeUndefined();
    expect(button('Archivar equipo')).toBeUndefined();
    pending.next([{ ...captain, rol: 'JUGADOR' }, { ...successor, rol: 'CAPITAN' }]);
    pending.complete();
    fixture.detectChanges();
    expect(button('Editar nombre')).toBeUndefined();
    expect(button('Archivar equipo')).toBeUndefined();
    session.currentSession.user.atletaUuid = 'external';
    fixture.detectChanges();
    expect(button('Editar nombre')).toBeUndefined();
    session.currentSession.user.atletaUuid = successor.playerUuid;
    fixture.detectChanges();
    expect(button('Editar nombre')).toBeDefined();
    expect(button('Archivar equipo')).toBeDefined();
  });

  it('preloads the name, validates normalized input and allows cancellation without a request', () => {
    loadCaptainRoster();
    const input = openNameEditor();
    expect(input.value).toBe('Atleta FC');
    enterName(input, '\u00a0Atleta FC\u2003');
    expect(button('Guardar nombre')?.disabled).toBeTrue();
    submit('.team-name-form');
    for (const invalid of ['\u2003', 'a'.repeat(101), 'A\u007fB']) {
      enterName(input, invalid);
      submit('.team-name-form');
      expect(fixture.nativeElement.querySelector('.team-admin-error')).not.toBeNull();
    }
    enterName(input, '\u00a0Atleta FC\u2003');
    button('Cancelar edición')!.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#team-name')).toBeNull();
    expect(teamApiService.updateTeamName).not.toHaveBeenCalled();
  });

  it('keeps the editor while confirming a switch to archive and coalesces repeated clicks', async () => {
    loadCaptainRoster();
    const input = openNameEditor();
    enterName(input, 'Borrador');
    let dismiss!: (decision: { role: string }) => void;
    const decision = new Promise<{ role: string }>(resolve => { dismiss = resolve; });
    const alert = jasmine.createSpyObj('alert', ['present', 'onDidDismiss', 'querySelector']);
    alert.present.and.resolveTo();
    alert.onDidDismiss.and.returnValue(decision);
    alertController.create.and.resolveTo(alert);

    const archive = button('Archivar equipo')!;
    archive.click();
    archive.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(alertController.create).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('.team-archive-form')).toBeNull();

    dismiss({ role: 'cancel' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#team-name')?.value).toBe('Borrador');
    expect(teamApiService.deleteTeam).not.toHaveBeenCalled();
  });

  it('blocks PATCH if a successor is captain by the time the draft is submitted', () => {
    loadCaptainRoster();
    const input = openNameEditor();
    enterName(input, 'Borrador');
    teamApiService.updateTeamName.and.returnValue(of({ id: 77, nombre: 'Borrador' }));
    teamApiService.getActiveMembers.and.returnValue(of([{ ...captain, rol: 'JUGADOR' }, { ...successor, rol: 'CAPITAN' }]));

    submit('.team-name-form');

    expect(teamApiService.updateTeamName).not.toHaveBeenCalled();
    expect(teamApiService.getActiveMembers.calls.allArgs()).toEqual([[77], [77]]);
    expect(button('Editar nombre')).toBeUndefined();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Ya no tienes permiso');
  });

  it('keeps the draft and skips PATCH if captaincy cannot be verified', () => {
    loadCaptainRoster();
    const input = openNameEditor();
    enterName(input, 'Borrador');
    teamApiService.getActiveMembers.and.returnValue(throwError(() => ({ status: 503 })));

    submit('.team-name-form');

    expect(input.value).toBe('Borrador');
    expect(fixture.nativeElement.querySelector('.team-admin-error')).not.toBeNull();
    expect(teamApiService.updateTeamName).not.toHaveBeenCalled();
  });

  it('releases a stalled save without discarding the draft', fakeAsync(() => {
    loadCaptainRoster();
    const input = openNameEditor();
    enterName(input, 'Borrador');
    teamApiService.getActiveMembers.and.returnValue(NEVER);

    submit('.team-name-form');
    expect(component.canDeactivate()).toBeFalse();
    tick(30_000);
    fixture.detectChanges();

    expect(button('Guardar nombre')?.disabled).toBeFalse();
    expect(input.value).toBe('Borrador');
    expect(fixture.nativeElement.querySelector('.team-admin-error').textContent).toContain('a tiempo');
    expect(teamApiService.updateTeamName).not.toHaveBeenCalled();
  }));

  it('protects page unload only while a meaningful draft is open', () => {
    loadCaptainRoster();
    const input = openNameEditor();
    enterName(input, '  Atleta FC  ');
    const clean = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    component.protectDraftOnUnload(clean);
    expect(clean.defaultPrevented).toBeFalse();

    enterName(input, 'Borrador');
    const dirty = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    component.protectDraftOnUnload(dirty);
    expect(dirty.defaultPrevented).toBeTrue();
  });

  it('keeps the draft on 409, prevents duplicate updates and shows the returned name', () => {
    loadCaptainRoster();
    const input = openNameEditor();
    teamApiService.updateTeamName.and.returnValue(throwError(() => ({ status: 409 })));
    enterName(input, 'Fútbol Norte');
    submit('.team-name-form');
    expect(input.value).toBe('Fútbol Norte');
    expect(fixture.nativeElement.querySelector('.team-admin-error').textContent).toContain('ya está en uso');

    const pending = new Subject<TeamSummary>();
    teamApiService.updateTeamName.and.returnValue(pending);
    enterName(input, '\u00a0Fútbol Sur\u2003');
    submit('.team-name-form');
    expect(button('Guardar nombre')?.disabled).toBeTrue();
    submit('.team-name-form');
    expect(teamApiService.updateTeamName.calls.allArgs()).toEqual([[77, 'Fútbol Norte'], [77, 'Fútbol Sur']]);
    pending.next({ id: 77, nombre: 'Fútbol Sur' });
    pending.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Fútbol Sur');
    expect(fixture.nativeElement.querySelector('#team-name')).toBeNull();
    expect(component.members.length).toBe(2);
    expect(teamApiService.getActiveMembers.calls.allArgs()).toEqual([[77], [77], [77]]);
  });

  it('reloads the active roster when editing returns 403 and removes stale controls', () => {
    loadCaptainRoster();
    const input = openNameEditor();
    enterName(input, 'Otro nombre');
    teamApiService.updateTeamName.and.returnValue(throwError(() => ({ status: 403 })));
    teamApiService.getActiveMembers.and.returnValues(
      of([captain, successor]),
      of([{ ...captain, rol: 'JUGADOR' }, { ...successor, rol: 'CAPITAN' }]),
    );
    submit('.team-name-form');
    expect(teamApiService.updateTeamName).toHaveBeenCalledOnceWith(77, 'Otro nombre');
    expect(teamApiService.getActiveMembers.calls.allArgs()).toEqual([[77], [77], [77]]);
    expect(button('Editar nombre')).toBeUndefined();
    expect(button('Archivar equipo')).toBeUndefined();
    expect(component.captainFeedbackText).toContain('Ya no tienes permiso');
  });

  it('keeps the name draft when the server rejects the input with 400', () => {
    loadCaptainRoster();
    const input = openNameEditor();
    enterName(input, 'Nombre rechazado');
    teamApiService.updateTeamName.and.returnValue(throwError(() => ({ status: 400 })));
    submit('.team-name-form');
    expect(input.value).toBe('Nombre rechazado');
    expect(fixture.nativeElement.querySelector('.team-admin-error').textContent).toContain('El nombre no es válido');
    expect(teamApiService.getActiveMembers.calls.allArgs()).toEqual([[77], [77]]);
  });

  for (const scenario of [
    { status: 401, message: 'Tu sesión ya no es válida' },
    { status: 404, message: 'El equipo ya no está disponible' },
  ]) {
    it(`removes the stale detail when editing returns ${scenario.status}`, () => {
      loadCaptainRoster();
      const input = openNameEditor();
      enterName(input, 'Otro equipo');
      teamApiService.updateTeamName.and.returnValue(throwError(() => ({ status: scenario.status })));
      submit('.team-name-form');
      expect(fixture.nativeElement.querySelector('.team-name-form')).toBeNull();
      expect(fixture.nativeElement.querySelector('.team-hero')).toBeNull();
      expect(component.captainFeedbackText).toContain(scenario.message);
      expect(teamApiService.getActiveMembers.calls.allArgs()).toEqual([[77], [77]]);
    });
  }

  it('requires archive confirmation, prevents duplicate deletes and leaves the archived roster', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    loadCaptainRoster();
    button('Archivar equipo')!.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#team-archive-description').textContent).toContain('historial');
    button('Cancelar archivado')!.click();
    fixture.detectChanges();
    expect(teamApiService.deleteTeam).not.toHaveBeenCalled();

    button('Archivar equipo')!.click();
    fixture.detectChanges();
    const pending = new Subject<void>();
    teamApiService.deleteTeam.and.returnValue(pending);
    submit('.team-archive-form');
    expect(button('Confirmar archivado')?.disabled).toBeTrue();
    submit('.team-archive-form');
    expect(teamApiService.deleteTeam).toHaveBeenCalledOnceWith(77, captain.playerUuid);
    pending.next();
    pending.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.team-hero')).toBeNull();
    expect(navigationService.safeNavigate).toHaveBeenCalledOnceWith(['/social'], {
      queryParams: { tab: 'teams' }, replaceUrl: true, state: { archivedTeamName: 'Atleta FC' },
    });
  });

  it('shows a player who also coaches and keeps the removal action unavailable for that member', () => {
    const coach = { ...successor, esDt: true };
    teamApiService.getActiveMembers.and.returnValue(of([captain, coach]));
    component.ionViewWillEnter();
    fixture.detectChanges();

    const playerRow = fixture.nativeElement.querySelector('[aria-label="Ver ficha de Demo11"]').closest('tr');
    expect(playerRow.textContent).toContain('Jugador y DT');
    expect(playerRow.querySelector('.team-remove-member')).toBeNull();
  });

  it('offers leave to an active member and hides it once that member becomes captain', () => {
    session.currentSession.user.atletaUuid = successor.playerUuid;
    loadCaptainRoster();
    const button = () => fixture.nativeElement.querySelector('.team-leave');
    expect(button()).not.toBeNull();
    teamApiService.getActiveMembers.and.returnValue(of([{ ...captain, rol: 'JUGADOR' }, { ...successor, rol: 'CAPITAN' }]));
    component.ionViewWillEnter();
    fixture.detectChanges();
    expect(button()).toBeNull();
    component.leaveTeam();
    expect(teamApiService.leaveTeam).not.toHaveBeenCalled();
  });

  it('asks before leaving and refreshes the roster after the member leaves', () => {
    session.currentSession.user.atletaUuid = successor.playerUuid;
    loadCaptainRoster();
    const confirm = spyOn(window, 'confirm').and.returnValue(false);
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.team-leave');
    button.click();
    expect(confirm).toHaveBeenCalledOnceWith('¿Abandonar el equipo Atleta FC?');
    expect(teamApiService.leaveTeam).not.toHaveBeenCalled();

    const pending = new Subject<void>();
    confirm.and.returnValue(true);
    teamApiService.leaveTeam.and.returnValue(pending);
    button.click();
    fixture.detectChanges();
    expect(button.disabled).toBeTrue();
    component.leaveTeam();
    expect(teamApiService.leaveTeam).toHaveBeenCalledOnceWith(77);

    teamApiService.getActiveMembers.and.returnValue(of([captain]));
    pending.next();
    pending.complete();
    fixture.detectChanges();
    expect(teamApiService.getActiveMembers.calls.allArgs()).toEqual([[77], [77]]);
    expect(fixture.nativeElement.querySelector('.team-leave')).toBeNull();
    expect(component.captainFeedbackText).toContain('Abandonaste el equipo');
  });

  it('refreshes the roster after a 409 and explains that the new captain must transfer first', () => {
    session.currentSession.user.atletaUuid = successor.playerUuid;
    loadCaptainRoster();
    spyOn(window, 'confirm').and.returnValue(true);
    teamApiService.leaveTeam.and.returnValue(throwError(() => ({ status: 409 })));
    teamApiService.getActiveMembers.and.returnValue(of([{ ...captain, rol: 'JUGADOR' }, { ...successor, rol: 'CAPITAN' }]));
    fixture.nativeElement.querySelector('.team-leave').click();
    fixture.detectChanges();
    expect(teamApiService.getActiveMembers.calls.allArgs()).toEqual([[77], [77]]);
    expect(fixture.nativeElement.querySelector('.team-leave')).toBeNull();
    expect(fixture.nativeElement.querySelector('.captain-feedback').textContent).toContain('Transfiere la capitanía');
  });

  it('offers removal only for other active players when the current member is captain', () => {
    const coach: TeamActiveMember = { ...successor, playerUuid: 'coach', alias: 'Coach', rol: 'DT' };
    teamApiService.getActiveMembers.and.returnValue(of([captain, successor, coach]));
    component.ionViewWillEnter();
    fixture.detectChanges();
    const buttons = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('.team-remove-member'));
    expect(buttons().map(button => button.getAttribute('aria-label'))).toEqual(['Retirar a Demo11 del equipo']);

    session.currentSession.user.atletaUuid = successor.playerUuid;
    fixture.detectChanges();
    expect(buttons()).toEqual([]);
    component.removeMember(captain.playerUuid);
    expect(teamApiService.removeMember).not.toHaveBeenCalled();

    teamApiService.getActiveMembers.and.returnValue(of([{ ...captain, rol: 'JUGADOR' }, { ...successor, rol: 'CAPITAN' }, coach]));
    component.ionViewWillEnter();
    fixture.detectChanges();
    expect(buttons().map(button => button.getAttribute('aria-label'))).toEqual(['Retirar a Demo10 del equipo']);
  });

  it('confirms the removal, prevents duplicate submissions and reloads the active roster', () => {
    loadCaptainRoster();
    const confirm = spyOn(window, 'confirm').and.returnValue(false);
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.team-remove-member');
    component.removeMember(captain.playerUuid);
    component.removeMember('non-member');
    expect(confirm).not.toHaveBeenCalled();
    button.click();
    expect(confirm).toHaveBeenCalledOnceWith('¿Retirar a Demo11 del equipo?');
    expect(teamApiService.removeMember).not.toHaveBeenCalled();

    const pending = new Subject<void>();
    confirm.and.returnValue(true);
    teamApiService.removeMember.and.returnValue(pending);
    button.click();
    fixture.detectChanges();
    expect(button.disabled).toBeTrue();
    component.removeMember(successor.playerUuid);
    expect(teamApiService.removeMember).toHaveBeenCalledOnceWith(77, successor.playerUuid);

    teamApiService.getActiveMembers.and.returnValue(of([captain]));
    pending.next();
    pending.complete();
    fixture.detectChanges();
    expect(teamApiService.getActiveMembers.calls.allArgs()).toEqual([[77], [77]]);
    expect(fixture.nativeElement.querySelector('[aria-label="Ver ficha de Demo11"]')).toBeNull();
    expect(component.captainFeedbackText).toContain('Retiraste a Demo11');
  });

  it('rechecks permissions after a 403 and hides removal when the captain changed', () => {
    loadCaptainRoster();
    spyOn(window, 'confirm').and.returnValue(true);
    teamApiService.removeMember.and.returnValue(throwError(() => ({ status: 403 })));
    teamApiService.getActiveMembers.and.returnValue(of([{ ...captain, rol: 'JUGADOR' }, { ...successor, rol: 'CAPITAN' }]));
    fixture.nativeElement.querySelector('.team-remove-member').click();
    fixture.detectChanges();
    expect(teamApiService.getActiveMembers.calls.allArgs()).toEqual([[77], [77]]);
    expect(fixture.nativeElement.querySelector('.team-remove-member')).toBeNull();
    expect(fixture.nativeElement.querySelector('.captain-feedback').textContent).toContain('Ya no tienes permiso');
  });

  it('confirms the transfer and moves the armband using the refreshed roster', () => {
    loadCaptainRoster();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#captain-target');
    expect(Array.from(select.options).map(option => option.value)).toEqual(['', successor.playerUuid]);
    const confirm = spyOn(window, 'confirm').and.returnValue(true);
    teamApiService.transferCaptain.and.returnValue(of({ teamId: 77, captainPlayerUuid: successor.playerUuid }));
    teamApiService.getActiveMembers.and.returnValue(of([{ ...captain, rol: 'JUGADOR' }, { ...successor, rol: 'CAPITAN' }]));

    selectSuccessor().click();
    fixture.detectChanges();

    expect(confirm).toHaveBeenCalledWith(jasmine.stringMatching(successor.alias));
    expect(teamApiService.transferCaptain).toHaveBeenCalledOnceWith(77, successor.playerUuid);
    expect(teamApiService.getActiveMembers.calls.allArgs()).toEqual([[77], [77]]);
    const badge: HTMLElement = fixture.nativeElement.querySelector('.captain-armband');
    expect(badge.closest('button')?.getAttribute('aria-label')).toBe('Ver ficha de Demo11');
    expect(fixture.nativeElement.querySelector('.captain-transfer')).toBeNull();
    expect(button('Editar nombre')).toBeUndefined();
    expect(button('Archivar equipo')).toBeUndefined();
    expect(fixture.nativeElement.querySelector('.captain-feedback').textContent).toContain('Plantel actualizado');
  });

  it('hides the transfer from a regular member', () => {
    session.currentSession.user.atletaUuid = successor.playerUuid;
    loadCaptainRoster();
    expect(fixture.nativeElement.querySelector('.captain-transfer')).toBeNull();
    component.captainTarget = captain.playerUuid;
    component.transferCaptain();
    expect(teamApiService.transferCaptain).not.toHaveBeenCalled();
  });

  it('rejects self and non-member targets and lets the captain cancel confirmation', () => {
    loadCaptainRoster();
    const confirm = spyOn(window, 'confirm').and.returnValue(false);
    for (const target of [captain.playerUuid, 'non-member']) {
      component.captainTarget = target;
      component.transferCaptain();
    }
    expect(confirm).not.toHaveBeenCalled();
    expect(component.captainFeedbackText).toContain('otro integrante activo');
    selectSuccessor().click();
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(teamApiService.transferCaptain).not.toHaveBeenCalled();
  });

  it('blocks repeated submissions and allows a retry after a conflict', () => {
    loadCaptainRoster();
    const confirm = spyOn(window, 'confirm').and.returnValue(true);
    const pending = new Subject<TeamCaptainResponse>();
    teamApiService.transferCaptain.and.returnValue(pending);
    const button = selectSuccessor();
    button.click();
    fixture.detectChanges();
    expect(button.disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('#captain-target').disabled).toBeTrue();
    component.transferCaptain();
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(teamApiService.transferCaptain).toHaveBeenCalledTimes(1);
    pending.error(new HttpErrorResponse({ status: 409 }));
    fixture.detectChanges();
    expect(button.disabled).toBeFalse();
    expect(component.captainFeedbackText).toContain('volver a intentarlo');
    teamApiService.transferCaptain.and.returnValue(new Subject<TeamCaptainResponse>());
    button.click();
    expect(teamApiService.transferCaptain).toHaveBeenCalledTimes(2);
  });

  it('refreshes stale permissions when the API rejects the transfer with 403', () => {
    loadCaptainRoster();
    spyOn(window, 'confirm').and.returnValue(true);
    teamApiService.transferCaptain.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    teamApiService.getActiveMembers.and.returnValue(of([{ ...captain, rol: 'JUGADOR' }, { ...successor, rol: 'CAPITAN' }]));
    selectSuccessor().click();
    fixture.detectChanges();
    expect(component.captainFeedbackText).toContain('Ya no tienes permiso');
    expect(fixture.nativeElement.querySelector('.captain-transfer')).toBeNull();
  });

  it('loads the exact team and selects a player without navigating away', () => {
    component.ionViewWillEnter();
    fixture.detectChanges();
    component.openPlayer(component.members[0]);

    expect(teamApiService.getById).toHaveBeenCalledOnceWith(77);
    expect(teamApiService.getActiveMembers).toHaveBeenCalledOnceWith(77);
    expect(fixture.nativeElement.textContent).toContain('Atleta FC');
    expect(fixture.nativeElement.textContent).toContain('Demo10');
    expect(component.selectedMember?.alias).toBe('Demo10');
    expect(navigationService.safeNavigate).not.toHaveBeenCalled();
  });

  it('shows an accessible captain armband in the roster and the player card only for the team captain', () => {
    teamApiService.getActiveMembers.and.returnValue(of([
      { playerUuid: 'captain', alias: 'Demo10', rol: 'CAPITAN', primaryPositionId: 9, primaryPositionName: 'Delantero' },
      { playerUuid: 'player', alias: 'Demo11', rol: 'JUGADOR', primaryPositionId: null, primaryPositionName: null },
    ]));
    component.ionViewWillEnter();
    fixture.detectChanges();

    const badgeSelector = '[role="img"][aria-label="Capitán del equipo"]';
    const [captain, player] = fixture.nativeElement.querySelectorAll('.team-player-button');
    const badge = captain.querySelector(badgeSelector);
    expect(badge?.textContent.trim()).toBe('C');
    expect(captain.getAttribute('aria-describedby')).toBe(badge?.id);
    expect(player.querySelector(badgeSelector)).toBeNull();
    expect(player.hasAttribute('aria-describedby')).toBeFalse();

    const modal = fixture.debugElement.query(By.directive(IonModal)).injector.get(IonModal);
    for (const [trigger, expectedBadge] of [[captain, 'C'], [player, undefined]]) {
      trigger.click();
      const view = modal.template.createEmbeddedView({});
      view.detectChanges();
      const card = view.rootNodes.find(node => node.nodeType === Node.ELEMENT_NODE);
      expect(card.querySelector(badgeSelector)?.textContent.trim()).toBe(expectedBadge);
      view.destroy();
    }
  });

  it('renders the team and its empty roster when there are no active members', () => {
    teamApiService.getActiveMembers.and.returnValue(of([]));
    component.ionViewWillEnter();
    fixture.detectChanges();

    expect(component.team?.nombre).toBe('Atleta FC');
    expect(component.members).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('No hay integrantes activos.');
  });

  it('shows an error and retries when the roster endpoint fails', () => {
    teamApiService.getActiveMembers.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    component.ionViewWillEnter();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar el equipo');
    expect(fixture.nativeElement.textContent).not.toContain('No hay integrantes activos');
    teamApiService.getActiveMembers.and.returnValue(of([]));
    fixture.nativeElement.querySelector('.team-error button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay integrantes activos');
  });

  it('shows team goals and career goals separately, preserving zero and missing data', () => {
    teamApiService.getActiveMembers.and.returnValue(of([{
      playerUuid: 'player-uuid', alias: 'Demo10', rol: 'CAPITAN', primaryPositionId: null,
      primaryPositionName: null, teamMatches: 3, teamGoals: 0, totalGoals: 12, teamAssists: 0, totalAssists: 5,
    }]));
    component.ionViewWillEnter();
    fixture.detectChanges();
    const cells = fixture.nativeElement.querySelectorAll('.team-member td');
    expect(cells[3].textContent.trim()).toBe('3');
    expect(cells[4].textContent.trim()).toBe('0');
    expect(cells[5].textContent.trim()).toBe('12');
    expect(cells[6].textContent.trim()).toBe('0');
    expect(cells[7].textContent.trim()).toBe('5');
    expect(fixture.nativeElement.textContent).toContain('Goles con el equipo');
    expect(fixture.nativeElement.textContent).toContain('Goles totales');
    teamApiService.getActiveMembers.and.returnValue(of([{
      playerUuid: 'player-uuid', alias: 'Demo10', rol: 'CAPITAN', primaryPositionId: null,
      primaryPositionName: null,
    }]));
    component.ionViewWillEnter();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.team-member td')[3].textContent.trim()).toBe('Sin datos');
    expect(fixture.nativeElement.querySelectorAll('.team-member td')[4].textContent.trim()).toBe('Sin datos');
  });

  it('offers a recoverable Social exit when the team is missing', () => {
    teamApiService.getById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    component.ionViewWillEnter();
    fixture.detectChanges();

    expect(component.notFound).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Volver a Social');
  });

  it('uses initials when team and member images cannot load', () => {
    component.ionViewWillEnter();
    component.team!.logoUrl = '/missing-team-logo.png';
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.team-hero img').dispatchEvent(new Event('error'));
    fixture.nativeElement.querySelector('.team-member__player img').dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.team-hero img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.team-shield')?.textContent).toBe('A');
    expect(fixture.nativeElement.querySelector('.team-member__player i')?.textContent).toBe('D');
  });

  it('keeps a team with an empty roster visible', () => {
    teamApiService.getActiveMembers.and.returnValue(of([]));
    component.ionViewWillEnter();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Atleta FC');
    expect(fixture.nativeElement.textContent).toContain('No hay integrantes activos.');
  });

  it('distinguishes a rating failure from an unrated player and retries', () => {
    ratingsApiService.getOverall.and.returnValue(throwError(() => ({ status: 500 })));
    component.ionViewWillEnter();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar las valoraciones.');
    expect(fixture.nativeElement.querySelector('.team-member__ovr').textContent).not.toContain('Sin valoración');
    ratingsApiService.getOverall.and.returnValue(of({ hybridOVR: 74 } as any));
    fixture.nativeElement.querySelector('[aria-label="Reintentar valoraciones de Demo10"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.team-member__ovr').textContent).toContain('74');
  });

  it('renders real position values, preserving zero and missing ratings', () => {
    ratingsApiService.getOverall.and.returnValue(of({ hybridOVR: 0, roleBreakdown: { ATAQUE: 79, MEDIOCAMPO: 0 } } as any));
    component.ionViewWillEnter();
    fixture.detectChanges();
    expect(component.members[0].roleStats).toEqual([{ role: 'ATAQUE', rating: 79 }, { role: 'MEDIOCAMPO', rating: 0 }]);
    expect(fixture.nativeElement.querySelector('.team-member__ovr').textContent).toContain('0');
    expect(ratingsApiService.getOverall).toHaveBeenCalledOnceWith('player-uuid');
  });

  it('averages rated players including zero and excludes missing values', () => {
    teamApiService.getActiveMembers.and.returnValue(of(['a', 'b', 'c'].map(playerUuid => ({ playerUuid, alias: playerUuid, rol: 'JUGADOR' as const, primaryPositionId: null, primaryPositionName: null }))));
    ratingsApiService.getOverall.and.returnValues(
      of({ hybridOVR: 80, roleBreakdown: { ATAQUE: 80, MEDIOCAMPO: 0 } } as any),
      of({ hybridOVR: 0, roleBreakdown: { ATAQUE: 60 } } as any),
      throwError(() => ({ status: 404 })),
    );
    component.ionViewWillEnter();
    expect(component.teamOvr).toBe(40);
    expect(component.ratedMembers.length).toBe(2);
    expect(component.teamRoleStats).toEqual([{ role: 'ATAQUE', rating: 70 }, { role: 'MEDIOCAMPO', rating: 0 }]);
  });

  it('leaves the team unvalued when no player has a rating', () => {
    ratingsApiService.getOverall.and.returnValue(throwError(() => ({ status: 404 })));
    component.ionViewWillEnter();
    expect(component.teamOvr).toBeNull();
    expect(component.teamRoleStats).toEqual([]);
  });

  it('reports coverage and excludes failed ratings while retaining valid zero', () => {
    teamApiService.getActiveMembers.and.returnValue(of(['a', 'b', 'c'].map(playerUuid => ({ playerUuid, alias: playerUuid, rol: 'JUGADOR' as const, primaryPositionId: null, primaryPositionName: null }))));
    ratingsApiService.getOverall.and.returnValues(
      of({ hybridOVR: 80, roleBreakdown: { ATAQUE: 80 } } as any),
      of({ hybridOVR: 0, roleBreakdown: { ATAQUE: 0 } } as any),
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    component.ionViewWillEnter();
    fixture.detectChanges();
    expect(component.teamOvr).toBe(40);
    expect(component.teamRoleStats).toEqual([{ role: 'ATAQUE', rating: 40 }]);
    expect(fixture.nativeElement.querySelector('.team-overall').textContent).toContain('2 de 3 jugadores valorados');
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar las valoraciones');
  });
});
