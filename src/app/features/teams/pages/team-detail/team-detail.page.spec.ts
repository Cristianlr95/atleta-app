import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { IonModal } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { RatingsApiService } from 'src/app/features/ratings/services/ratings-api.service';
import { UserApiService } from 'src/app/features/user/services/user-api.service';
import { TeamApiService } from '../../services/team-api.service';
import { TeamDetailPage } from './team-detail.page';

describe('TeamDetailPage', () => {
  let fixture: ComponentFixture<TeamDetailPage>;
  let component: TeamDetailPage;
  let teamApiService: jasmine.SpyObj<TeamApiService>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  let userApiService: jasmine.SpyObj<UserApiService>;
  let ratingsApiService: jasmine.SpyObj<RatingsApiService>;

  beforeEach(async () => {
    teamApiService = jasmine.createSpyObj<TeamApiService>('TeamApiService', ['getById', 'getActiveMembers']);
    navigationService = jasmine.createSpyObj<NavigationService>('NavigationService', [
      'safeNavigate', 'goBackOrProfile', 'goToProfile',
    ]);
    userApiService = jasmine.createSpyObj<UserApiService>('UserApiService', ['getPublicPlayerProfile']);
    ratingsApiService = jasmine.createSpyObj<RatingsApiService>('RatingsApiService', ['getOverall']);
    navigationService.safeNavigate.and.resolveTo(true);
    userApiService.getPublicPlayerProfile.and.returnValue(of({ pictureUrl: '/demo.jpg' } as any));
    ratingsApiService.getOverall.and.returnValue(of({ hybridOVR: 74 } as any));
    teamApiService.getById.and.returnValue(of({ id: 77, nombre: 'Atleta FC', anioFundacion: 2020 }));
    teamApiService.getActiveMembers.and.returnValue(of([{
      playerUuid: 'player-uuid', alias: 'Demo10', rol: 'CAPITAN', primaryPositionId: 9,
      primaryPositionName: 'Delantero',
    }]));

    await TestBed.configureTestingModule({
      imports: [TeamDetailPage],
      providers: [
        { provide: TeamApiService, useValue: teamApiService },
        { provide: NavigationService, useValue: navigationService },
        { provide: UserApiService, useValue: userApiService },
        { provide: RatingsApiService, useValue: ratingsApiService },
        { provide: NotificationBadgeService, useValue: { totalPending: () => 0 } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '77' } } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TeamDetailPage);
    component = fixture.componentInstance;
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
